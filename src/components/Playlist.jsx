import React from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import './Playlist.css';

const Playlist = ({ beats, uploadedTracks, currentBeatId, isPlaying, onPlayTrack, onTogglePlayPause, onDeleteTrack, onFileUpload }) => {
  const allTracks = [
    ...beats.map(beat => ({ ...beat, type: 'local' })),
    ...uploadedTracks.map(track => ({ ...track, type: 'uploaded' }))
  ];

  return (
    <div className="playlist-container">
      <div className="playlist-header">
        <i className="nes-icon trophy is-small"></i>
        <span>PLAYLIST</span>
      </div>
      <div className="playlist-upload-section">
        <label htmlFor="file-upload" className="playlist-upload-label">
          <span className="playlist-upload-icon"><AddIcon /></span>
          Add your favorite tracks
        </label>
        <input 
          id="file-upload"
          type="file" 
          accept="audio/*"
          multiple 
          onChange={onFileUpload}
          className="playlist-file-input"
        />
      </div>
      <div className="playlist-scroll">
        {allTracks.map((track) => (
          <div 
            key={`${track.type}-${track.id}`}
            className={`playlist-item ${currentBeatId === track.id ? 'playlist-item-active' : ''}`}
            onClick={() => onPlayTrack(track)}
          >
            <div 
              className="playlist-play-icon"
              onClick={(e) => {
                e.stopPropagation();
                if (currentBeatId === track.id) {
                  onTogglePlayPause();
                } else {
                  onPlayTrack(track);
                }
              }}
            >
              {currentBeatId === track.id ? (isPlaying ? <span className="pause-icon"><PauseIcon fontSize="small" /></span> : <PlayArrowIcon fontSize="small" />) : <MusicNoteIcon fontSize="small" />}
            </div>
            <div className="playlist-info">
              <div className="playlist-title">{track.title}</div>
              <div className="playlist-meta">
                {track.author} • {track.bpm} BPM
              </div>
            </div>
            {track.type === 'uploaded' && (
              <button
                className="playlist-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTrack(track.id);
                }}
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlist;
