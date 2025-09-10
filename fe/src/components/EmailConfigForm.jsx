import { useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import LoadingSpinner from './LoadingSpinner'
import './EmailConfigForm.css'

const EmailConfigForm = ({ onSubmit, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  })

  const [attachments, setAttachments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  

  useEffect(() => {
    if (initialData) {
      setFormData({
        subject: initialData.subject || '',
        body: initialData.body || ''
      })
      setAttachments(initialData.attachments || [])
    }
  }, [initialData])

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align',
    'code-block'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBodyChange = (content) => {
    setFormData(prev => ({
      ...prev,
      body: content
    }))
  }

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files)
    const filePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result // This will be a data URL like "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises).then(fileData => {
      setAttachments(prev => [...prev, ...fileData])
    })
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        //Sleep 1s
        await new Promise(resolve => setTimeout(resolve, 1000))
        setError('')
        setSuccess('')
        
        const configData = {
        ...formData,
        attachments
        }

        try {
        const response = await fetch('http://localhost:8089/email-config', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(configData)
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        setSuccess('Email configuration saved successfully!')
        
        // Call the parent's onSubmit callback if provided
        if (onSubmit) {
            onSubmit(configData)
        }
        
        } catch (error) {
        console.error('Error saving email configuration:', error)
        setError(error.message || 'Failed to save email configuration. Please try again.')
        } finally {
        setIsLoading(false)
        }
    }


  return (
    <>
      <LoadingSpinner 
        message="Saving Email Configuration" 
        isVisible={isLoading} 
      />
      
      <div className="email-config-overlay">
        <div className="email-config-modal">
          <div className="email-config-header">
            <div className="header-content">
              <div className="header-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="header-text">
                <h2>Email Configuration</h2>
                <p>Customize your email template and attachments</p>
              </div>
            </div>
            <button 
              type="button" 
              className="close-button"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="email-config-form">
            <div className="form-content">
              <div className="form-group">
                <label htmlFor="subject">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Email Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Enter your email subject line..."
                  required
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Email Body
                </label>
                <div className="quill-container">
                  <ReactQuill
                    theme="snow"
                    value={formData.body}
                    onChange={handleBodyChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Compose your email template..."
                    className="email-body-editor"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 22 8 22C6.40278 22 4.87582 21.3658 3.75 20.24C2.62418 19.1142 1.99 17.5872 1.99 15.99C1.99 14.3928 2.62418 12.8658 3.75 11.74L12.94 2.55C13.7006 1.78944 14.7348 1.36462 15.81 1.36462C16.8852 1.36462 17.9194 1.78944 18.68 2.55C19.4406 3.31056 19.8654 4.34477 19.8654 5.42C19.8654 6.49523 19.4406 7.52944 18.68 8.29L10.07 16.9C9.68944 17.2806 9.17722 17.4938 8.64 17.4938C8.10278 17.4938 7.59056 17.2806 7.21 16.9C6.82944 16.5194 6.61624 16.0072 6.61624 15.47C6.61624 14.9328 6.82944 14.4206 7.21 14.04L15.07 6.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Attachments
                </label>
                <div className="attachment-section">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileAttachment}
                    id="attachment-input"
                    className="file-input"
                  />
                  <label htmlFor="attachment-input" className="file-upload-button">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Choose Files</span>
                    <span className="file-hint">or drag and drop</span>
                  </label>
                  
                  {attachments.length > 0 && (
                    <div className="attachment-list">
                      <h4>Attached Files ({attachments.length})</h4>
                      {attachments.map((file, index) => (
                        <div key={index} className="attachment-item">
                          <div className="file-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M13 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <polyline points="13,2 13,9 20,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="file-info">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                         <button 
                            type="button" 
                            onClick={() => removeAttachment(index)}
                            className="remove-attachment-btn"
                            title="Remove attachment"
                          >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default EmailConfigForm
