import React from 'react'
import UserDataTable from './UserDataTable'
import './FileProcessor.css'

const FileProcessor = ({ 
  isProcessing, 
  processResult, 
  userData, 
  onSendMail,
  isSendingMail
}) => {
  return (
    <>
      {processResult && (
        <div className={`process-result ${processResult.error ? 'error' : 'success'}`}>
          {processResult.error ? (
            <>
              <h3>Error</h3>
              <p>{processResult.error}</p>
              <p>{processResult.details}</p>
            </>
          ) : (
            <>
              <h3>Receiver's List</h3>
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
      )}

      {userData && !processResult?.mailResult && (
        <button
          className="send-mail-button"
          onClick={onSendMail}
          disabled={isSendingMail}
        >
          {isSendingMail ? 'Sending Mail...' : 'Send Mail'}
        </button>
      )}
    </>
  )
}

export default FileProcessor
