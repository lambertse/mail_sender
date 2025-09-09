import React from 'react'
import './FileUploadSection.css'

const FileUploadSection = ({ 
  selectedFile, 
  onFileChange, 
  onDownloadSample, 
  onEmailConfig, 
  emailConfig 
}) => {
  return (
    <div className="upload-container">
      <input
        type="file"
        onChange={onFileChange}
        id="file-upload"
        accept=".xlsx"
        style={{ display: 'none' }}
      />
      <button
        onClick={() => document.getElementById('file-upload').click()}
        className="upload-button"
      >
        Choose File
      </button>
      <button
        onClick={onDownloadSample}
        className="download-sample-button"
      >
        Download Template
      </button>
      <button
        onClick={onEmailConfig}
        className={`email-config-button ${emailConfig ? 'configured' : ''}`}
      >
        {emailConfig ? '✓ Email Configured' : 'Configure Email'}
      </button>
      
      {selectedFile && (
        <div className="file-info">
          <p>Selected file: {selectedFile.name}</p>
        </div>
      )}
    </div>
  )
}

export default FileUploadSection
