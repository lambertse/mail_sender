import { useState, useEffect } from 'react'
import Login from './components/Login'
import Header from './components/Header'
import EmailConfigForm from './components/EmailConfigForm'
import FileUploadSection from './components/FileUploadSection'
import FileProcessor from './components/FileProcessor'
import EmailResultsDisplay from './components/EmailResultsDisplay'
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

    const formData = new FormData()
    formData.append('file', selectedFile)
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
        fileName: selectedFile.name,
        timestamp: CURRENT_TIMESTAMP
      })
      setUserData(result)
      
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
      
      if (result.failed && result.failed.length > 0) {
        console.log(`${result.success?.length || 0} emails sent successfully, ${result.failed.length} failed`)
      } else {
        alert('All emails sent successfully!')
      }
      
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
    alert('Email configuration saved!')
  }

  const handleCloseEmailForm = () => {
    setShowEmailForm(false)
  }

  const handleRetryFailedEmails = async () => {
    if (!processResult?.mailResult?.failed || processResult.mailResult.failed.length === 0) return

    setIsSendingMail(true)

    const requestBody = {
      data: processResult.mailResult.failed,
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

      if (result.failed && result.failed.length > 0) {
        console.log(`Retry: ${result.success?.length || 0} more emails sent, ${result.failed.length} still failed`)
      } else {
        alert('All remaining emails sent successfully!')
      }
      
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
        <FileUploadSection
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onDownloadSample={handleDownloadSample}
          onEmailConfig={handleEmailConfig}
          emailConfig={emailConfig}
        />

        <FileProcessor
          isProcessing={isProcessing}
          processResult={processResult}
          userData={userData}
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

        {showEmailForm && (
          <EmailConfigForm 
            onSubmit={handleEmailFormSubmit}
            onClose={handleCloseEmailForm}
            initialData={emailConfig}
          />
        )}
      </div>
    </div>
  )
}

export default App
