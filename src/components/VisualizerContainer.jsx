/**
 * VisualizerContainer.jsx - Manages 20 audio visualizers
 * Merges music player + drum machine audio into a single analyser,
 * renders only the active visualizer via component lookup map.
 */
import React, { useState, useEffect } from 'react';
import './VisualizerContainer.css';

// Regular imports for instant loading (no delay)
import BarVisualizer from './BarVisualizer';
import CircleVisualizer from './CircleVisualizer';
import WaveformVisualizer from './WaveformVisualizer';
import MatrixRainVisualizer from './MatrixRainVisualizer';
import PulseRingsVisualizer from './PulseRingsVisualizer';
import WormholeVisualizer from './WormholeVisualizer';
import BlocksVisualizer from './BlocksVisualizer';
import OrbitingParticlesVisualizer from './OrbitingParticlesVisualizer';
import NeonGridVisualizer from './NeonGridVisualizer';
import OscilloscopeVisualizer from './OscilloscopeVisualizer';
import CircularWaveVisualizer from './CircularWaveVisualizer';
import SunVisualizer from './SunVisualizer';
import VoronoiVisualizer from './VoronoiVisualizer';
import FractalVisualizer from './FractalVisualizer';
import AttractorVisualizer from './AttractorVisualizer';
import FlowFieldVisualizer from './FlowFieldVisualizer';
import InkWaterVisualizer from './InkWaterVisualizer';
import NeuralNetVisualizer from './NeuralNetVisualizer';
import ExpandingRingsVisualizer from './ExpandingRingsVisualizer';
import CometShowerVisualizer from './CometShowerVisualizer';

// Component lookup map — only the active visualizer renders
const VISUALIZER_COMPONENTS = {
  bars: BarVisualizer,
  circle: CircleVisualizer,
  waveform: WaveformVisualizer,
  matrix: MatrixRainVisualizer,
  pulse: PulseRingsVisualizer,
  wormhole: WormholeVisualizer,
  blocks: BlocksVisualizer,
  particles: OrbitingParticlesVisualizer,
  neon: NeonGridVisualizer,
  scope: OscilloscopeVisualizer,
  circwave: CircularWaveVisualizer,
  sun: SunVisualizer,
  voronoi: VoronoiVisualizer,
  fractal: FractalVisualizer,
  attractor: AttractorVisualizer,
  flow: FlowFieldVisualizer,
  ink: InkWaterVisualizer,
  neural: NeuralNetVisualizer,
  rings: ExpandingRingsVisualizer,
  comet: CometShowerVisualizer
};

// Main visualizers shown as buttons
const MAIN_VISUALIZERS = ['bars', 'circle', 'waveform', 'matrix', 'blocks', 'attractor'];

// Remaining visualizers shown in dropdown menu
const DROPDOWN_VISUALIZERS = ['neon', 'pulse', 'wormhole', 'particles', 'scope', 'circwave', 'sun', 'voronoi', 'fractal', 'flow', 'ink', 'neural', 'rings', 'comet'];

// Display name overrides (defaults to uppercase key)
const VISUALIZER_NAMES = {
  'neon': 'GRID',
  'circwave': 'CIRCWAVE',
  'scope': 'SCOPE',
  'voronoi': 'CONSTELLATION'
};

const getVisualizerName = (type) => VISUALIZER_NAMES[type] || type.toUpperCase();

const VisualizerContainer = ({ analyser, drumAnalyser }) => {
  const [visualizerType, setVisualizerType] = useState('bars');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeAnalyser, setActiveAnalyser] = useState(null);
  
  // Merge music + drum analysers by taking the louder value per bin
  useEffect(() => {
    if (!analyser && !drumAnalyser) {
      setActiveAnalyser(null);
      return;
    }

    const mergedAnalyser = {
      frequencyBinCount: (analyser?.frequencyBinCount || drumAnalyser?.frequencyBinCount || 128),
      fftSize: (analyser?.fftSize || drumAnalyser?.fftSize || 256),
      getByteFrequencyData: (dataArray) => {
        const tempArray1 = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
        const tempArray2 = drumAnalyser ? new Uint8Array(drumAnalyser.frequencyBinCount) : null;
        
        if (tempArray1) analyser.getByteFrequencyData(tempArray1);
        if (tempArray2) drumAnalyser.getByteFrequencyData(tempArray2);
        
        for (let i = 0; i < dataArray.length; i++) {
          const val1 = tempArray1 ? tempArray1[i] : 0;
          const val2 = tempArray2 ? tempArray2[i] : 0;
          dataArray[i] = Math.max(val1, val2);
        }
      },
      getByteTimeDomainData: (dataArray) => {
        // Merge by taking the value with greater deviation from center (128)
        const tempArray1 = analyser ? new Uint8Array(analyser.fftSize || 256) : null;
        const tempArray2 = drumAnalyser ? new Uint8Array(drumAnalyser.fftSize || 256) : null;
        
        if (tempArray1) analyser.getByteTimeDomainData(tempArray1);
        if (tempArray2) drumAnalyser.getByteTimeDomainData(tempArray2);
        
        for (let i = 0; i < dataArray.length; i++) {
          const val1 = tempArray1 ? tempArray1[i] : 128;
          const val2 = tempArray2 ? tempArray2[i] : 128;
          const dev1 = Math.abs(val1 - 128);
          const dev2 = Math.abs(val2 - 128);
          dataArray[i] = dev1 > dev2 ? val1 : val2;
        }
      }
    };
    
    setActiveAnalyser(mergedAnalyser);
  }, [analyser, drumAnalyser]);

  // Resolve active visualizer component
  const VisualizerComponent = VISUALIZER_COMPONENTS[visualizerType];

  return (
    <div className="nes-container is-dark visualizer-container">
      <div className="visualizer-controls">
        {MAIN_VISUALIZERS.map((type) => (
          <button
            key={type}
            type="button"
            className={`nes-btn visualizer-button ${visualizerType === type ? 'is-primary' : ''}`}
            onClick={() => setVisualizerType(type)}
          >
            {getVisualizerName(type)}
          </button>
        ))}
        
        <div className="visualizer-dropdown-container">
          <button
            type="button"
            className={`nes-btn visualizer-button ${DROPDOWN_VISUALIZERS.includes(visualizerType) ? 'is-primary' : ''}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            ▼
          </button>
          {dropdownOpen && (
            <div className="visualizer-dropdown-menu">
              {DROPDOWN_VISUALIZERS.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`visualizer-dropdown-item ${visualizerType === type ? 'is-selected' : ''}`}
                  onClick={() => {
                    setVisualizerType(type);
                    setDropdownOpen(false);
                  }}
                >
                  {getVisualizerName(type)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <VisualizerComponent analyser={activeAnalyser} />
    </div>
  );
};

export default VisualizerContainer;
