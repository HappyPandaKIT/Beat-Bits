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
    width: 100%;
    justify-content: center;
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
  grid-template-columns: 100px repeat(16, 1fr);
  gap: 2px;
  min-width: 850px;

  @media (max-width: 768px) {
    grid-template-columns: 70px repeat(16, 1fr);
    min-width: 650px;
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
  border: 2px solid ${props => props.active ? '#76c442' : '#000'};
  cursor: pointer;
  transition: background-color 0.05s;
  aspect-ratio: 1;
  min-width: 30px;
  min-height: 30px;

  &:hover {
    background-color: ${props => props.active ? '#76c442' : '#666'};
  }

  &.playing {
    border-color: #ff006e;
    box-shadow: inset 0 0 10px rgba(255, 0, 110, 0.5);
  }

  @media (max-width: 768px) {
    min-width: 25px;
    min-height: 25px;
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

  // Store audioCtx reference and sync volume from DrumMachine
  useEffect(() => {
    audioCtxRef.current = audioCtx;
    // Get current volume from DrumMachine's gain node if available
    if (audioCtx && audioCtx.destination) {
      // The gain node is already set by DrumMachine, so we read its current value
      // This happens through the setVolume callback passed from parent
    }
  }, [audioCtx]);

  // Handle step count change
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

  // Calculate step interval based on BPM (16th notes)
  const stepInterval = (60 / bpm / 4) * 1000; // in milliseconds

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

  // Sequencer loop with precise timing
  useEffect(() => {
    if (!isPlaying) return;

    // Initialize timing
    if (!nextStepTimeRef.current) {
      nextStepTimeRef.current = Date.now();
    }

    const scheduleStep = () => {
      const now = Date.now();
      
      // If we're past the next step time, advance
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
          <label style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '8px' }}>Steps:</label>
          <div style={{ position: 'relative', display: 'inline-block' }}>
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
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>BPM:</label>
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            style={{ width: '120px', '--range-progress': `${((bpm - 60) / (200 - 60)) * 100}%` }}
          />
          <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '45px' }}>{bpm}</span>
        </BPMControl>
      </TransportControls>

      <SequencerGrid>
        <GridTable style={{ gridTemplateColumns: `100px repeat(${steps}, 1fr)`, minWidth: `${100 + steps * 34}px` }}>
          {/* Header - Step numbers */}
          <TrackLabel style={{ backgroundColor: '#212529', color: '#92cc41' }}>TRACK</TrackLabel>
          {Array.from({ length: steps }, (_, i) => (
            <TrackLabel 
              key={`step-${i}`}
              style={{ 
                backgroundColor: i % 4 === 0 ? '#92cc41' : '#cecece',
                color: i % 4 === 0 ? '#000' : '#333',
                fontSize: '10px'
              }}
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="nes-input"
            placeholder="Please give me a name..."
            value={patternName}
            onChange={(e) => setPatternName(e.target.value)}
            style={{ flex: '1', minWidth: '200px', fontSize: '12px', margin: 0 }}
          />
          <button 
            className="nes-btn is-success"
            onClick={savePattern}
            disabled={!patternName.trim()}
            data-tooltip="Save Beat"
            style={{ 
              opacity: patternName.trim() ? 1 : 0.5,
              cursor: patternName.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            <span className="btn-icon"><SaveAltIcon /></span>
          </button>
        </div>
      </PatternControls>

      {savedPatterns.length > 0 && (
        <div className="saved-patterns">
          <div className="beat-collection-title">BEAT COLLECTION</div>
          <div className="patterns-scroll-container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedPatterns.map((saved, index) => {
              // Create appealing color combinations for each pattern
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
                  style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    alignItems: 'center',
                    background: colorScheme.bg,
                    padding: '10px',
                    border: '3px solid #000',
                    boxShadow: '4px 4px 0px #000',
                    borderRadius: '4px'
                  }}
                >
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: 'bold', color: colorScheme.text }}>
                    {saved.name} ({saved.bpm} BPM • {saved.steps || 16} Steps)
                  </span>
                  <button 
                    className="nes-btn is-primary"
                    style={{ fontSize: '10px' }}
                    onClick={() => loadPattern(saved)}
                  >
                    LOAD
                  </button>
                  <button 
                    className="nes-btn is-error"
                    style={{ fontSize: '10px' }}
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
