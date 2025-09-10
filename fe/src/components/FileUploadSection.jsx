import React, { useState } from 'react'
import './FileUploadSection.css'

const FileUploadSection = ({ 
  selectedFile, 
  onFileChange, 
  onDownloadSample, 
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.xlsx')) {
        onFileChange({ target: { files: [file] } })
      }
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="upload-section">
      <div className="upload-header">
        <h2>File Upload</h2>
        <p>Upload your Excel file to send personalized emails</p>
      </div>

      <div 
        className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input
          type="file"
          onChange={onFileChange}
          id="file-upload"
          accept=".xlsx"
          style={{ display: 'none' }}
        />
        
        {selectedFile ? (
          <div className="file-selected">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <h3>{selectedFile.name}</h3>
              <p>{formatFileSize(selectedFile.size)}</p>
            </div>
            <div className="file-status">✓</div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">☁️</div>
            <h3>Drop your Excel file here</h3>
            <p>or click to browse files</p>
            <span className="file-format">Supports .xlsx files only</span>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button
          onClick={onDownloadSample}
          className="action-button secondary"
        >
          <span className="button-icon">⬇️</span>
          Download Template
        </button>
      </div>
    </div>
  )
}

export default FileUploadSection
