/**
 * useAudioPlayer.js - Music playback hook
 * Manages AudioContext, Media element, AnalyserNode, playback state,
 * progress tracking, volume, and keyboard shortcuts (Space, Arrow keys).
 */
import { useState, useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const [currentBeat, setCurrentBeat] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioContextRef = useRef(null);
  const audioRef = useRef(null);
  const sourceRef = useRef(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = audioContextRef.current.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8; // Add smoothing (0-1, default is 0.8)

      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserNode);
      analyserNode.connect(audioContextRef.current.destination);

      setAnalyser(analyserNode);

      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = (e) => {
        console.error("Audio error:", e);
        setError("Failed to load audio file. CORS issue or invalid URL.");
        setIsPlaying(false);
      };

      // Three duration listeners for cross-browser reliability
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current.duration);
      };

      audioRef.current.ondurationchange = () => {
        if (audioRef.current.duration && isFinite(audioRef.current.duration)) {
          setDuration(audioRef.current.duration);
        }
      };

      audioRef.current.oncanplay = () => {
        if (audioRef.current.duration && isFinite(audioRef.current.duration) && duration === 0) {
          setDuration(audioRef.current.duration);
        }
      };

      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current.currentTime);
      };
    }
  };

  const playTrack = (beat) => {
    initAudio();
    setError(null);

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (currentBeat?.id !== beat.id) {
      audioRef.current.src = beat.src;
      audioRef.current.load();
      setCurrentBeat(beat);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error("Playback error:", err);
        setError("Playback failed");
      });
      setIsPlaying(true);
    }
  };

  const handleProgressBarClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && currentBeat) {
        e.preventDefault();
        togglePlayPause();
      }

      if (currentBeat && audioRef.current) {
        if (e.code === 'ArrowRight') {
          audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
        }
        if (e.code === 'ArrowLeft') {
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBeat, isPlaying, duration]);

  return {
    currentBeat,
    isPlaying,
    analyser,
    error,
    currentTime,
    duration,
    volume,
    setVolume,
    playTrack,
    togglePlayPause,
    handleProgressBarClick,
    setError
  };
};
