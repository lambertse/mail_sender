import { useState } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSendingMail, setIsSendingMail] = useState(false)
  const [processResult, setProcessResult] = useState(null)
  const [userData, setUserData] = useState(null)

  const CURRENT_USER = 'tri-le_opswat'
  const CURRENT_TIMESTAMP = '2025-05-29 17:41:26'

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    setSelectedFile(file)
    setProcessResult(null)
    setUserData(null)
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

      if (!response.ok) {
        throw new Error(`Failed to send mail: ${response.statusText}`)
      }

      const result = await response.json()
      alert('Mail sent successfully!')
      
    } catch (error) {
      alert(`Failed to send mail: ${error.message}`)
    } finally {
      setIsSendingMail(false)
    }
  }
  return (
    <div className="app-container">
      <div>
        <h1>File Processing Demo</h1>
        <div className="upload-container">
          <input
            type="file"
            onChange={handleFileChange}
            id="file-upload"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => document.getElementById('file-upload').click()}
            className="upload-button"
          >
            Choose File
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
                    <h3>Processing Results</h3>
                    <p>File: {processResult.fileName}</p>
                    <p>Processed at: {processResult.timestamp}</p>
                    
                    {userData && userData.length > 0 && (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Company Name</th>
                              <th>Owner</th>
                              <th>Email</th>
                              <th>Tax ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userData.map((user, index) => (
                              <tr key={index}>
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
        {userData && (
          <button
            className="send-mail-button"
            onClick={handleSendMail}
            disabled={isSendingMail}
          >
            {isSendingMail ? 'Sending Mail...' : 'Send Mail'}
          </button>
        )}
      </div>
    </div>
  )

}

export default App
