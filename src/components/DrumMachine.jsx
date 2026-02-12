/**
 * DrumMachine.jsx – Interactive drum pad with synthesized sounds.
 * Initializes a shared AudioContext used by both DrumMachine and Beatmaker.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import './DrumMachine.css';
import { SOUND_FUNCTIONS, PADS } from '../audio/drumSounds';

// --- Styled Components ---
const MachineContainer = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background-color: #2c3e50;
  border: 4px solid #000;
  box-shadow: 8px 8px 0px #212529;
  position: relative;

  @media (max-width: 768px) {
    margin-top: 1rem;
    padding: 0.5rem;
    border: 3px solid #000;
    box-shadow: 4px 4px 0px #212529;
  }
`;

const PadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 15px;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
`;

const Screen = styled.div`
  background-color: #8bac0f;
  color: #0f380f;
  padding: 15px;
  font-size: 14px;
  margin-bottom: 20px;
  border: 4px solid #0f380f;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  box-shadow: inset 4px 4px 0px rgba(0,0,0,0.1);

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 10px;
    min-height: 40px;
  }

  @media (max-width: 480px) {
    font-size: 8px;
    padding: 8px;
    min-height: 35px;
  }
`;

const DrumMachine = ({ onAudioContextReady, isActive = true, sharedVolume = 0.8, onVolumeChange }) => {
  const [display, setDisplay] = useState("READY TO PLAY");
  const [activePad, setActivePad] = useState(null);
  const volume = sharedVolume;
  const setVolume = onVolumeChange || (() => {});
  
  // Audio refs
  const audioCtxRef = useRef(null);
  const buffersRef = useRef({});
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize AudioContext, analyser, gain node, and load sound buffers
  useEffect(() => {
    const initAudio = async () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();

      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      
      // Audio chain: gain -> analyser -> speakers
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);

      // Pre-load sample buffers (fallback to synthesis if missing)
      const loadPromises = PADS.map(async (pad) => {
        try {
          const response = await fetch(pad.url);
          if (!response.ok) throw new Error(`Failed to load ${pad.id}`);
          const arrayBuffer = await response.arrayBuffer();
          buffersRef.current[pad.id] = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        } catch (error) {
          console.warn(`Could not load ${pad.id} sample, using synthesis`);
        }
      });

      await Promise.all(loadPromises);
      setDisplay("READY");
    };

    initAudio();
    // AudioContext is kept alive for Beatmaker (no cleanup)
  }, []);

  // Trigger a drum sound by pad ID
  const playSound = useCallback((padId) => {
    if (!audioCtxRef.current || !gainNodeRef.current) return;

    // Resume suspended context (Chrome autoplay policy)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const soundFn = SOUND_FUNCTIONS[padId];
    if (soundFn) {
      soundFn(audioCtxRef.current, audioCtxRef.current.currentTime, gainNodeRef.current);
    }

    setDisplay(`HIT: ${padId}`);
    setActivePad(padId);
    setTimeout(() => setActivePad(null), 100);
  }, []);

  // Sync gain node with volume prop
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Share audio resources with parent (for Beatmaker)
  useEffect(() => {
    if (audioCtxRef.current && analyserRef.current && onAudioContextReady) {
      const setVolumeFunc = (newVolume) => {
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = newVolume;
          setVolume(newVolume);
        }
      };
      onAudioContextReady(audioCtxRef.current, playSound, setVolumeFunc, analyserRef.current);
    }
  }, [onAudioContextReady, playSound]);

  // Keyboard input: map key presses to drum pads
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (event) => {
      const key = event.key.toUpperCase();
      const pad = PADS.find(p => p.key === key);
      if (pad) {
        playSound(pad.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSound, isActive]);

  return (
    <MachineContainer className="nes-container is-rounded">
      <div className="drum-machine-title">
        MPC-2077
      </div>
      
      <Screen>{display}</Screen>

      <div className="drum-machine-volume-control">
        <span className="drum-machine-volume-label">VOL:</span>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="drum-machine-volume-slider"
          style={{ '--range-progress': `${volume * 100}%` }}
        />
      </div>

      <PadGrid>
        {PADS.map((pad) => (
          <button
            key={pad.id}
            className={`nes-btn drum-pad ${activePad === pad.id ? 'is-primary' : ''}`}
            onClick={() => playSound(pad.id)}
          >
            <span>{pad.key}</span>
            <span className="drum-pad-label">{pad.id}</span>
          </button>
        ))}
      </PadGrid>

      <div className="drum-machine-instructions">
        PRESS KEYS OR TAP PADS
      </div>
    </MachineContainer>
  );
};

export default DrumMachine;