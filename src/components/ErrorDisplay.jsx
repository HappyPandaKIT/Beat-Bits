import React from 'react';

const ErrorDisplay = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="nes-container is-error error-display">
      <p>{error}</p>
    </div>
  );
};

export default ErrorDisplay;
