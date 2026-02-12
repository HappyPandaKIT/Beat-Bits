/**
 * useUploadedTracks.js - Local file upload handler
 * Reads audio files via FileReader, stores as data URLs in state.
 */
import { useState } from 'react';

export const useUploadedTracks = () => {
  const [uploadedTracks, setUploadedTracks] = useState([]);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      if (!file.type.startsWith('audio/')) {
        setError("Please upload audio files only");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const trackId = Date.now();
        const newTrack = {
          id: trackId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          src: e.target.result,
          author: "Local Upload",
          bpm: "-"
        };
        setUploadedTracks((prev) => [...prev, newTrack]);
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const deleteUploadedTrack = (trackId) => {
    setUploadedTracks(uploadedTracks.filter(track => track.id !== trackId));
  };

  return {
    uploadedTracks,
    error,
    setError,
    handleFileUpload,
    deleteUploadedTrack
  };
};
