/**
 * App.jsx – Root component orchestrating audio playback, drum machine,
 * beatmaker sequencer, playlist, and visualizer.
 */
import './App.css'
import React, { useState, useCallback } from 'react';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useUploadedTracks } from './hooks/useUploadedTracks'
import Header from './components/Header'
import ErrorDisplay from './components/ErrorDisplay'
import VisualizerContainer from './components/VisualizerContainer'
import DrumMachine from './components/DrumMachine'
import Beatmaker from './components/Beatmaker'
import PlayerControls from './components/PlayerControls'
import Playlist from './components/Playlist'

// Default tracks bundled with the app
const BEATS = [
  { id: 1, title: "Crystal Cave", bpm: 120, author: "cynicmusic", src: `${import.meta.env.BASE_URL}sounds/song18.mp3` },
  { id: 2, title: "High Stakes,Low Chances", bpm: 140, author: "Ove Meela", src: `${import.meta.env.BASE_URL}sounds/HighStakes.mp3` }
];

function App() {
  const audioPlayer = useAudioPlayer();
  const { uploadedTracks, handleFileUpload, deleteUploadedTrack } = useUploadedTracks();
  const displayError = audioPlayer.error;
  
  // Shared audio state between DrumMachine and Beatmaker
  const [drumAudioContext, setDrumAudioContext] = useState(null);
  const [drumPlaySound, setDrumPlaySound] = useState(null);
  const [drumSetVolume, setDrumSetVolume] = useState(null);
  const [drumAnalyser, setDrumAnalyser] = useState(null);
  const [sharedVolume, setSharedVolume] = useState(0.8);
  
  // Active mode: 'playlist' | 'beat' | 'drum'
  const [activeMode, setActiveMode] = useState('playlist');
  const beatmakerRef = React.useRef(null);

  // Receives audio resources from DrumMachine once initialized
  const handleAudioContextReady = useCallback((audioCtx, playSound, setVolume, analyser) => {
    setDrumAudioContext(audioCtx);
    setDrumPlaySound(() => playSound);
    setDrumSetVolume(() => setVolume);
    setDrumAnalyser(analyser);
  }, []);

  // Stops playback if the track being deleted is currently playing
  const handlePlayTrackWithDeletion = (trackId) => {
    if (audioPlayer.currentBeat?.id === trackId) {
      audioPlayer.togglePlayPause();
    }
    deleteUploadedTrack(trackId);
  };

  return (
    <div className="container">
      <Header />
      <ErrorDisplay error={displayError} />
      
      <VisualizerContainer 
        analyser={audioPlayer.analyser} 
        drumAnalyser={drumAnalyser} 
      />
      
      {audioPlayer.currentBeat && (
        <PlayerControls
          isPlaying={audioPlayer.isPlaying}
          onTogglePlayPause={audioPlayer.togglePlayPause}
          currentTime={audioPlayer.currentTime}
          duration={audioPlayer.duration}
          onProgressClick={audioPlayer.handleProgressBarClick}
          volume={audioPlayer.volume}
          onVolumeChange={audioPlayer.setVolume}
          songTitle={audioPlayer.currentBeat.title}
        />
      )}
      
      {/* Mode Switcher */}
      <div className="container mode-switcher-container">
        <div className="nes-container is-rounded is-dark mode-switcher-inner">
          <h3 className="mode-switcher-title">
            <i className="nes-icon trophy is-small"></i> CHOOSE YOUR BEAT
          </h3>
          <div className="mode-switcher-buttons">
            <button
              type="button"
              className={`nes-btn mode-switcher-btn ${activeMode === 'playlist' ? 'is-warning is-active' : ''}`}
              onClick={() => {
                if (beatmakerRef.current) {
                  beatmakerRef.current.stop();
                }
                setActiveMode('playlist');
              }}
            >
              {activeMode === 'playlist' && <span className="btn-icon"><MusicNoteIcon fontSize="small" /></span>}TRACKS{activeMode === 'playlist' && <span className="btn-icon"><MusicNoteIcon fontSize="small" /></span>}
            </button>
            <button
              type="button"
              className={`nes-btn mode-switcher-btn ${activeMode === 'beat' ? 'is-success is-active' : ''}`}
              onClick={() => setActiveMode('beat')}
            >
              {activeMode === 'beat' && <span className="btn-icon"><MusicNoteIcon fontSize="small" /></span>}SEQUENCER{activeMode === 'beat' && <span className="btn-icon"><MusicNoteIcon fontSize="small" /></span>}
            </button>
            <button
              type="button"
              className={`nes-btn mode-switcher-btn ${activeMode === 'drum' ? 'is-primary is-active' : ''}`}
              onClick={() => {
                if (beatmakerRef.current) {
                  beatmakerRef.current.stop();
                }
                setActiveMode('drum');
              }}
            >
              {activeMode === 'drum' && <span className="btn-icon"><MusicNoteIcon fontSize="small" /></span>}DRUM PAD{activeMode === 'drum' && <span className="btn-icon"><MusicNoteIcon fontSize="small" /></span>}
            </button>
          </div>
        </div>
      </div>
      
      {/* Keep DrumMachine mounted to maintain audio context, but hide when not active */}
      <div className="container drum-machine-wrapper" style={{ display: activeMode === 'drum' ? 'block' : 'none' }}>
        <DrumMachine 
          onAudioContextReady={handleAudioContextReady} 
          isActive={activeMode === 'drum'}
          sharedVolume={sharedVolume}
          onVolumeChange={setSharedVolume}
        />
      </div>
      
      <div className="container drum-machine-wrapper" style={{ display: activeMode === 'beat' ? 'block' : 'none' }}>
        <Beatmaker 
          ref={beatmakerRef} 
          audioCtx={drumAudioContext} 
          playSound={drumPlaySound} 
          setVolume={drumSetVolume}
          sharedVolume={sharedVolume}
          onVolumeChange={setSharedVolume}
        />
      </div>

      <div className="container" style={{ display: activeMode === 'playlist' ? 'block' : 'none', maxWidth: '800px' }}>
        <Playlist
          beats={BEATS}
          uploadedTracks={uploadedTracks}
          currentBeatId={audioPlayer.currentBeat?.id}
          isPlaying={audioPlayer.isPlaying}
          onPlayTrack={audioPlayer.playTrack}
          onTogglePlayPause={audioPlayer.togglePlayPause}
          onDeleteTrack={handlePlayTrackWithDeletion}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
}

export default App;