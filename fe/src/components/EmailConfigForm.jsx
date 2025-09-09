import { useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
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
        
        // Auto-close after success (optional)
        setTimeout(() => {
            onClose()
        }, 1500)

        } catch (error) {
        console.error('Error saving email configuration:', error)
        setError(error.message || 'Failed to save email configuration. Please try again.')
        } finally {
        setIsLoading(false)
        }
    }


  return (
    <div className="email-config-overlay">
      <div className="email-config-modal">
        <div className="email-config-header">
          <h2>Email Configuration</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="email-config-form">
          <div className="form-section">
            <div className="form-group">
              <label>Subject:</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Email subject"
                required
              />
            </div>

            <div className="form-group">
              <label>Body:</label>
              <div className="quill-wrapper">
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
              <label>Attachments:</label>
              <div className="attachment-section">
                <input
                  type="file"
                  multiple
                  onChange={handleFileAttachment}
                  id="attachment-input"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('attachment-input').click()}
                  className="attachment-button"
                >
                  Add Attachments
                </button>
                
                {attachments.length > 0 && (
                  <div className="attachment-list">
                    {attachments.map((file, index) => (
                      <div key={index} className="attachment-item">
                        <span>{file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="remove-attachment"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
 
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmailConfigForm
