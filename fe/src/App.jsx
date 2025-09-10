import { useState, useEffect } from 'react'
import Login from './components/Login'
import Header from './components/Header'
import EmailConfigForm from './components/EmailConfigForm'
import FileUploadSection from './components/FileUploadSection'
import FileProcessor from './components/FileProcessor'
import EmailResultsDisplay from './components/EmailResultsDisplay'
import LoadingSpinner from './components/LoadingSpinner'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSendingMail, setIsSendingMail] = useState(false)
  const [processResult, setProcessResult] = useState(null)
  const [userData, setUserData] = useState(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [currentView, setCurrentView] = useState('upload') // 'upload' or 'processor'
  const [emailConfig, setEmailConfig] = useState(() => {
    // Load saved email config from localStorage on initial load
    const saved = localStorage.getItem('emailConfig')
    return saved ? JSON.parse(saved) : null
  })

  const CURRENT_USER = 'tri-le_opswat'
  const CURRENT_TIMESTAMP = '2025-05-29 17:41:26'

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken')
      const userInfo = localStorage.getItem('userInfo')
      
      if (token && userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Error parsing user info:', error)
          handleLogout()
        }
      }
      setIsCheckingAuth(false)
    }
    
    checkAuth()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    setUser(null)
    setIsAuthenticated(false)
    // Reset all app state on logout
    setSelectedFile(null)
    setProcessResult(null)
    setUserData(null)
    setShowEmailForm(false)
    setCurrentView('upload') 
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    
    // Check if file is selected
    if (!file) return

    // Check file extension
    const fileExt = file.name.split('.').pop().toLowerCase()
    if (fileExt !== 'xlsx') {
      alert('Please upload only Excel (.xlsx) files')
      event.target.value = '' // Reset the input
      return
    }
    setSelectedFile(file)
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 500)) 

    const formData = new FormData()
    formData.append('file', file)
    formData.append('user', CURRENT_USER)
    formData.append('timestamp', CURRENT_TIMESTAMP)

    try {
      const response = await fetch('http://localhost:8089/upload_file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout()
          return
        }
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      setProcessResult({
        success: true,
        fileName: file.name,
        timestamp: CURRENT_TIMESTAMP
      })
      setUserData(result)
      setCurrentView('processor') // Navigate to processor view 
    } catch (error) {
      setProcessResult({
        error: 'Failed to process file',
        details: error.message
      })
    } finally {
      setIsProcessing(false)
    }
 
  }

  const handleDownloadSample = () => {
    const link = document.createElement('a')
    link.href = '/sample-template.xlsx'
    link.download = 'sample-template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSendMail = async () => {
    if (!userData) return

    setIsSendingMail(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    const requestBody = {
      data: userData,
    }

    try {
      const response = await fetch('http://localhost:8089/send_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout()
          return
        }
        throw new Error(`Failed to send mail: ${response.statusText}`)
      }

      const result = await response.json()
      
      setProcessResult(prev => ({
        ...prev,
        mailResult: {
          success: result.success || [],
          failed: result.failed || [],
          showRetryInterface: result.failed && result.failed.length > 0
        }
      }))
    } catch (error) {
      alert(`Failed to send mail: ${error.message}`)
    } finally {
      setIsSendingMail(false)
    }
  }

  const handleEmailConfig = () => {
    setShowEmailForm(true)
  }

  const handleEmailFormSubmit = (formData) => {
    setEmailConfig(formData)
    localStorage.setItem('emailConfig', JSON.stringify(formData))
    setShowEmailForm(false)
  }

  const handleCloseEmailForm = () => {
    setShowEmailForm(false)
  }

  const handleRetryFailedEmails = async (failedUsers) => {
    if (!failedUsers || failedUsers.length === 0) return

    setIsSendingMail(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const requestBody = {
      data: failedUsers,
    }

    try {
      const response = await fetch('http://localhost:8089/send_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout()
          return
        }
        throw new Error(`Failed to retry sending mail: ${response.statusText}`)
      }

      const result = await response.json()
      
      setProcessResult(prev => ({
        ...prev,
        mailResult: {
          success: [...(prev.mailResult.success || []), ...(result.success || [])],
          failed: result.failed || [],
          showRetryInterface: result.failed && result.failed.length > 0
        }
      }))
      
    } catch (error) {
      alert(`Failed to retry sending mail: ${error.message}`)
    } finally {
      setIsSendingMail(false)
    }
  } 

  const handleCancelRetry = () => {
    setProcessResult(prev => ({
      ...prev,
      mailResult: {
        ...prev.mailResult,
        showRetryInterface: false
      }
    }))
  }

  const handleBackToMain = () => {
    setProcessResult(null)
    setUserData(null)
    setSelectedFile(null)
    setCurrentView('upload')
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = '' 
  }

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

   return (
    <div className="app-container">
      <Header user={user} onLogout={handleLogout} />
      <div className="app-content">
        {currentView === 'upload' ? (
          <FileUploadSection
            selectedFile={selectedFile}
            onFileChange={handleFileChange}
            onDownloadSample={handleDownloadSample}
          />
        ) : (
          <div className="processor-view">
            <div className="top-controls">
              <button 
                className="back-button"
                onClick={handleBackToMain}
                aria-label="Back to file upload"
              >
                <span className="back-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg> 
                </span>
              </button>
              
              <button
                onClick={handleEmailConfig}
                className={`email-config-button ${emailConfig ? 'success' : 'primary'}`}
              >
                <span className="button-icon">{emailConfig ? '✓' : '⚙️'}</span>
                {emailConfig ? 'Email Configured' : 'Configure Email'}
              </button>
            </div>
            
            <FileProcessor
              isProcessing={isProcessing}
              processResult={processResult}
              orgUserData={userData}
              onSendMail={handleSendMail}
              isSendingMail={isSendingMail}
            />

            <EmailResultsDisplay
              mailResult={processResult?.mailResult}
              isSendingMail={isSendingMail}
              onRetryFailedEmails={handleRetryFailedEmails}
              onCancelRetry={handleCancelRetry}
              onBackToMain={handleBackToMain}
            />
          </div>
        )}

        {showEmailForm && (
          <EmailConfigForm 
            onSubmit={handleEmailFormSubmit}
            onClose={handleCloseEmailForm}
            initialData={emailConfig}
          />
        )}
      </div>
      <LoadingSpinner 
        message="Uploading File" 
        isVisible={isProcessing} 
      />
    </div>
  )
}

export default App
