import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" aria-label="Loading" />
      <span>{message}</span>
    </div>
  );
}
