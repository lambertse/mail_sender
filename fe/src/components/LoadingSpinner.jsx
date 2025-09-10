import React from 'react'
import './LoadingSpinner.css'

const LoadingSpinner = ({ message = "Processing...", isVisible = false }) => {
  if (!isVisible) return null

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <div className="loading-text">
          <h3>{message}</h3>
          <p>Please wait while we process your file...</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner

