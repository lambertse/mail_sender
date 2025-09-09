import { useState } from 'react'
import EmailConfigForm from './components/EmailConfigForm'
import FileUploadSection from './components/FileUploadSection'
import FileProcessor from './components/FileProcessor'
import EmailResultsDisplay from './components/EmailResultsDisplay'
import './App.css'

function App() {
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

  const handleFileChange = (event) => {
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
    setProcessResult(null)
    setUserData(null)
  }

  const handleDownloadSample = () => {
    const link = document.createElement('a')
    link.href = '/sample-template.xlsx'
    link.download = 'sample-template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleProcessFile = async () => {
    if (!selectedFile) return

    setIsProcessing(true)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('user', CURRENT_USER)
    formData.append('timestamp', CURRENT_TIMESTAMP)

    try {
      const response = await fetch('http://localhost:8089/upload_file', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
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
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
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
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
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

  return (
    <div className="app-container">
      <div>
        <h1>Mail sender</h1>
        
        <FileUploadSection
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onDownloadSample={handleDownloadSample}
          onEmailConfig={handleEmailConfig}
          emailConfig={emailConfig}
        />

        <FileProcessor
          selectedFile={selectedFile}
          isProcessing={isProcessing}
          processResult={processResult}
          userData={userData}
          onProcessFile={handleProcessFile}
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
