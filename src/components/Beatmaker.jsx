/**
 * Beatmaker.jsx - Step sequencer with 16/32/64 step grid
 * Supports play/pause/stop, pattern save/load (localStorage), random generation,
 * and shared audio context with DrumMachine for live playback.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import CasinoIcon from '@mui/icons-material/Casino';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import './Beatmaker.css';

const BeatmakerContainer = styled.div`
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
`;

const TransportControls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 6px;
  }
`;

const BPMControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
    flex-basis: 100%;
    order: 10;
    justify-content: flex-start;
  }
`;

const SequencerGrid = styled.div`
  overflow-x: auto;
  margin-bottom: 1rem;
  background-color: #212529;
  padding: 10px;
  border: 3px solid #000;

  @media (max-width: 768px) {
    padding: 5px;
  }
`;

const GridTable = styled.div`
  display: grid;
  grid-template-columns: 100px repeat(16, 32px);
  gap: 2px;
  width: fit-content;

  @media (max-width: 768px) {
    grid-template-columns: 70px repeat(16, 27px);
  }
`;

const TrackLabel = styled.div`
  background-color: #2c3e50;
  color: #d3d3d3;
  padding: 8px;
  border: 2px solid #000;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 9px;
    padding: 6px;
  }
`;

const StepCell = styled.div`
  background-color: ${props => props.active ? '#92cc41' : props.highlighted ? '#555' : '#333'};
  border: 2px solid #000;
  cursor: pointer;
  transition: background-color 0.05s;
  box-sizing: border-box;

  &:hover {
    background-color: ${props => props.active ? '#76c442' : '#666'};
  }

  &.playing {
    box-shadow: inset 0 0 10px rgba(255, 0, 110, 0.5);
  }
`;

const PatternControls = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    gap: 6px;
  }
`;

// Available drum sounds from DrumMachine
const TRACKS = [
  'Kick',
  'Snare',
  'HiHat',
  'Clap',
  'Tom',
  'Cowbell',
  'Blip',
  'Perc'
];

const STEP_OPTIONS = [16, 32, 64];
const DEFAULT_STEPS = 16;

const Beatmaker = React.forwardRef(({ audioCtx, playSound, setVolume, sharedVolume = 0.8, onVolumeChange }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [pattern, setPattern] = useState(() => {
    // Initialize empty pattern
    const initialPattern = {};
    TRACKS.forEach(track => {
      initialPattern[track] = Array(DEFAULT_STEPS).fill(false);
    });
    return initialPattern;
  });
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [patternName, setPatternName] = useState('');
  const [stepDropdownOpen, setStepDropdownOpen] = useState(false);
  const volume = sharedVolume; // Use shared volume from parent

  const intervalRef = useRef(null);
  const nextStepTimeRef = useRef(0);
  const audioCtxRef = useRef(null);

  // Keep audioCtx ref in sync with prop
  useEffect(() => {
    audioCtxRef.current = audioCtx;
  }, [audioCtx]);

  // Resize pattern grid, preserving existing step data
  const changeStepCount = useCallback((newSteps) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    nextStepTimeRef.current = 0;
    setPattern(prev => {
      const resized = {};
      TRACKS.forEach(track => {
        const old = prev[track] || [];
        resized[track] = Array(newSteps).fill(false).map((_, i) => i < old.length ? old[i] : false);
      });
      return resized;
    });
  }, []);

  // 16th note interval in ms
  const stepInterval = (60 / bpm / 4) * 1000;

  // Toggle step on/off
  const toggleStep = useCallback((track, step) => {
    setPattern(prev => ({
      ...prev,
      [track]: prev[track].map((val, idx) => idx === step ? !val : val)
    }));
  }, []);

  // Clear pattern
  const clearPattern = useCallback(() => {
    const emptyPattern = {};
    TRACKS.forEach(track => {
      emptyPattern[track] = Array(steps).fill(false);
    });
    setPattern(emptyPattern);
    setCurrentStep(0);
  }, [steps]);

  // Play current step
  const playCurrentStep = useCallback(() => {
    if (!playSound || !audioCtxRef.current) return;

    TRACKS.forEach(track => {
      if (pattern[track][currentStep]) {
        playSound(track);
      }
    });
  }, [currentStep, pattern, playSound]);

  // Sequencer loop — uses requestAnimationFrame for precise timing
  useEffect(() => {
    if (!isPlaying) return;

    if (!nextStepTimeRef.current) {
      nextStepTimeRef.current = Date.now();
    }

    const scheduleStep = () => {
      const now = Date.now();
      if (now >= nextStepTimeRef.current) {
        playCurrentStep();
        setCurrentStep(prev => (prev + 1) % steps);
        nextStepTimeRef.current = now + stepInterval;
      }

      intervalRef.current = requestAnimationFrame(scheduleStep);
    };

    intervalRef.current = requestAnimationFrame(scheduleStep);

    return () => {
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current);
      }
    };
  }, [isPlaying, playCurrentStep, stepInterval]);

  // Play/Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      nextStepTimeRef.current = 0;
    } else {
      nextStepTimeRef.current = Date.now();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Stop (pause and reset)
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    nextStepTimeRef.current = 0;
  }, []);

  // Expose stop function to parent via ref
  React.useImperativeHandle(ref, () => ({
    stop
  }), [stop]);

  // Save pattern
  const savePattern = useCallback(() => {
    if (!patternName.trim()) {
      alert('Please enter a pattern name');
      return;
    }

    const newPattern = {
      id: Date.now(),
      name: patternName,
      bpm: bpm,
      steps: steps,
      data: { ...pattern }
    };

    setSavedPatterns(prev => [...prev, newPattern]);
    setPatternName('');
    
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('beatPatterns') || '[]');
    saved.push(newPattern);
    localStorage.setItem('beatPatterns', JSON.stringify(saved));
  }, [pattern, bpm, patternName]);

  // Load pattern
  const loadPattern = useCallback((savedPattern) => {
    const loadedSteps = savedPattern.steps || 16;
    setSteps(loadedSteps);
    setPattern(savedPattern.data);
    setBpm(savedPattern.bpm);
    setCurrentStep(0);
    setIsPlaying(false);
    nextStepTimeRef.current = 0;
  }, []);

  // Delete saved pattern
  const deletePattern = useCallback((patternId) => {
    setSavedPatterns(prev => prev.filter(p => p.id !== patternId));
    
    // Update localStorage
    const saved = JSON.parse(localStorage.getItem('beatPatterns') || '[]');
    const filtered = saved.filter(p => p.id !== patternId);
    localStorage.setItem('beatPatterns', JSON.stringify(filtered));
  }, []);

  // Load saved patterns from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('beatPatterns') || '[]');
    setSavedPatterns(saved);
  }, []);

  // Random pattern generator
  const generateRandomPattern = useCallback(() => {
    const newPattern = {};
    TRACKS.forEach(track => {
      newPattern[track] = Array(steps).fill(false).map(() => Math.random() > 0.7);
    });
    setPattern(newPattern);
  }, [steps]);

  return (
    <BeatmakerContainer>
      <div className="drum-machine-title">
        BEATMAKER-2077
      </div>
      
      <Screen>
        {isPlaying ? `PLAYING - STEP ${currentStep + 1}/${steps}` : (currentStep > 0 ? `PAUSED - STEP ${currentStep + 1}/${steps}` : 'BEATMAKER - READY')}
      </Screen>

      <div className="drum-machine-volume-control">
        <span className="drum-machine-volume-label">VOL:</span>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={volume}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value);
            if (onVolumeChange) onVolumeChange(newVolume); // Update shared volume
            if (setVolume) setVolume(newVolume); // Update gain node
          }}
          className="drum-machine-volume-slider"
          style={{ '--range-progress': `${volume * 100}%` }}
        />
      </div>

      <TransportControls>
        <button 
          className={`nes-btn ${isPlaying ? 'is-error' : 'is-success'}`}
          onClick={togglePlay}
          data-tooltip={isPlaying ? 'Pause' : 'Play'}
        >
          <span className="btn-icon">{isPlaying ? <PauseIcon /> : <PlayArrowIcon />}</span>
        </button>
        
        <button 
          className="nes-btn is-warning"
          onClick={stop}
          data-tooltip="Stop"
        >
          <span className="btn-icon"><StopIcon /></span>
        </button>

        <button 
          className="nes-btn"
          onClick={clearPattern}
          data-tooltip="Clear Pattern"
        >
          <span className="btn-icon"><DeleteIcon /></span>
        </button>

        <button 
          className="nes-btn is-primary"
          onClick={generateRandomPattern}
          data-tooltip="Generate Random Pattern"
        >
          <span className="btn-icon"><CasinoIcon /></span>
        </button>

        <div className="step-dropdown-container">
          <label className="step-dropdown-label">Steps:</label>
          <div className="step-dropdown-wrapper">
            <button
              type="button"
              className="step-dropdown-button"
              onClick={() => setStepDropdownOpen(!stepDropdownOpen)}
            >
              {steps} ▼
            </button>
            {stepDropdownOpen && (
              <div className="step-dropdown-menu">
                {STEP_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`step-dropdown-item ${opt === steps ? 'is-selected' : ''}`}
                    onClick={() => {
                      changeStepCount(opt);
                      setStepDropdownOpen(false);
                    }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>

        <BPMControl>
          <label className="bpm-label">BPM:</label>
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="bpm-slider"
            style={{ '--range-progress': `${((bpm - 60) / (200 - 60)) * 100}%` }}
          />
          <span className="bpm-value">{bpm}</span>
        </BPMControl>
      </TransportControls>

      <SequencerGrid>
        <GridTable style={{ gridTemplateColumns: `100px repeat(${steps}, 32px)` }}>
          {/* Header - Step numbers */}
          <TrackLabel className="track-header">TRACK</TrackLabel>
          {Array.from({ length: steps }, (_, i) => (
            <TrackLabel 
              key={`step-${i}`}
              className={`step-number ${i % 4 === 0 ? 'step-number-accent' : ''}`}
            >
              {i + 1}
            </TrackLabel>
          ))}

          {/* Track rows */}
          {TRACKS.map(track => (
            <React.Fragment key={track}>
              <TrackLabel>{track}</TrackLabel>
              {Array.from({ length: steps }, (_, step) => (
                <StepCell
                  key={`${track}-${step}`}
                  active={pattern[track]?.[step] || false}
                  highlighted={step % 4 === 0}
                  className={step === currentStep && currentStep > 0 ? 'playing' : ''}
                  onClick={() => toggleStep(track, step)}
                />
              ))}
            </React.Fragment>
          ))}
        </GridTable>
      </SequencerGrid>

      <PatternControls>
        <div className="pattern-save-row">
          <input
            type="text"
            className="nes-input pattern-name-input"
            placeholder="Please give me a name..."
            value={patternName}
            onChange={(e) => setPatternName(e.target.value)}
          />
          <button 
            className={`nes-btn is-success pattern-save-btn ${!patternName.trim() ? 'is-disabled' : ''}`}
            onClick={savePattern}
            disabled={!patternName.trim()}
            data-tooltip="Save Beat"
          >
            <span className="btn-icon"><SaveAltIcon /></span>
          </button>
        </div>
      </PatternControls>

      {/* Saved patterns with gradient color cycling */}
      {savedPatterns.length > 0 && (
        <div className="saved-patterns">
          <div className="beat-collection-title">BEAT COLLECTION</div>
          <div className="patterns-scroll-container">
            <div className="patterns-list">
            {savedPatterns.map((saved, index) => {
              const colors = [
                { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },
                { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#fff' },
                { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#000' },
                { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#000' },
                { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#000' },
                { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', text: '#fff' },
                { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: '#000' },
                { bg: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)', text: '#fff' }
              ];
              const colorScheme = colors[index % colors.length];
              
              return (
                <div 
                  key={saved.id}
                  className="pattern-card"
                  style={{ background: colorScheme.bg }}
                >
                  <span className="pattern-card-name" style={{ color: colorScheme.text }}>
                    {saved.name} ({saved.bpm} BPM • {saved.steps || 16} Steps)
                  </span>
                  <button 
                    className="nes-btn is-primary pattern-card-btn"
                    onClick={() => loadPattern(saved)}
                  >
                    LOAD
                  </button>
                  <button 
                    className="nes-btn is-error pattern-card-btn"
                    onClick={() => deletePattern(saved.id)}
                  >
                    DEL
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}
    </BeatmakerContainer>
  );
});

Beatmaker.displayName = 'Beatmaker';

export default Beatmaker;
