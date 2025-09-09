import { useState } from 'react'
import EmailConfigForm from './components/EmailConfigForm'
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
    link.href = '/sample-template.xlsx' // Make sure this file exists in your public folder
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

    // Create the request body with proper JSON structure
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
      console.log('Request body:', requestBody) // Debug log
      console.log('Response status:', response) // Debug log

      if (!response.ok) {
        throw new Error(`Failed to send mail: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Handle the response with success and failed arrays
      setProcessResult(prev => ({
        ...prev,
        mailResult: {
          success: result.success || [],
          failed: result.failed || [],
          showRetryInterface: result.failed && result.failed.length > 0
        }
      }))
      
      if (result.failed && result.failed.length > 0) {
        // Don't show success alert if there are failures - let user handle retries
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
    // Save to localStorage
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
      
      // Update the results - add newly successful ones to success array, keep failed ones
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
    // Reset file input
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="app-container">
      <div>
        <h1>Mail sender</h1>
        <div className="upload-container">
          <input
            type="file"
            onChange={handleFileChange}
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
                onClick={handleDownloadSample}
                className="download-sample-button"
            >
                Download Template
            </button>
       <button
            onClick={handleEmailConfig}
            className={`email-config-button ${emailConfig ? 'configured' : ''}`}
          >
            {emailConfig ? '✓ Email Configured' : 'Configure Email'}
          </button> 
          {selectedFile && (
            <div className="file-info">
              <p>Selected file: {selectedFile.name}</p>
              <button 
                className="process-button"
                onClick={handleProcessFile}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Process File'}
              </button>
            </div>
          )}

          {processResult && (
            <>
              <div className={`process-result ${processResult.error ? 'error' : 'success'}`}>
                {processResult.error ? (
                  <>
                    <h3>Error</h3>
                    <p>{processResult.error}</p>
                    <p>{processResult.details}</p>
                  </>
                ) : (
                  <>
                    <h3>Receivers's list</h3>
                    
                    {userData && userData.length > 0 && (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Company Name</th>
                              <th>Owner</th>
                              <th>Email</th>
                              <th>Tax ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userData.map((user, index) => (
                              <tr key={index}>
                                <td>{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.owner}</td>
                                <td>{user.email}</td>
                                <td>{user.tax_id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Send mail button moved outside the process-result div */}
             </>
          )}
        </div>
        {userData && !processResult?.mailResult && (
          <button
            className="send-mail-button"
            onClick={handleSendMail}
            disabled={isSendingMail}
          >
            {isSendingMail ? 'Sending Mail...' : 'Send Mail'}
          </button>
        )}

        {/* Email Results Summary */}
        {processResult?.mailResult && (
          <div className="mail-results-container">
            <h3>Email Sending Results</h3>
            
            {processResult.mailResult.success.length > 0 && (
              <div className="results-section success-section">
                <h4>✅ Successfully Sent ({processResult.mailResult.success.length})</h4>
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Company Name</th>
                        <th>Owner</th>
                        <th>Email</th>
                        <th>Tax ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processResult.mailResult.success.map((user, index) => (
                        <tr key={`success-${index}`}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.owner}</td>
                          <td>{user.email}</td>
                          <td>{user.tax_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {processResult.mailResult.failed.length > 0 && (
              <div className="results-section failed-section">
                <h4>❌ Failed to Send ({processResult.mailResult.failed.length})</h4>
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Company Name</th>
                        <th>Owner</th>
                        <th>Email</th>
                        <th>Tax ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processResult.mailResult.failed.map((user, index) => (
                        <tr key={`failed-${index}`}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.owner}</td>
                          <td>{user.email}</td>
                          <td>{user.tax_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mail-results-actions">
              {processResult.mailResult.showRetryInterface && processResult.mailResult.failed.length > 0 && (
                <>
                  <button
                    className="retry-button"
                    onClick={handleRetryFailedEmails}
                    disabled={isSendingMail}
                  >
                    {isSendingMail ? 'Retrying...' : `Retry Failed (${processResult.mailResult.failed.length})`}
                  </button>
                  <button
                    className="cancel-retry-button"
                    onClick={handleCancelRetry}
                    disabled={isSendingMail}
                  >
                    Cancel Retry
                  </button>
                </>
              )}
              <button
                className="back-to-main-button"
                onClick={handleBackToMain}
              >
                Back to Main
              </button>
            </div>
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
    </div>
  )

}

export default App
