import React, { useState, useMemo, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'
import './EmailResultsDisplay.css'

const EmailResultsDisplay = ({
  mailResult,
  isSendingMail,
  onRetryFailedEmails,
  onCancelRetry,
  onBackToMain
}) => {
  const [failedUsers, setFailedUsers] = useState([])
  const [searchEmail, setSearchEmail] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Initialize failed users when mailResult changes
  useEffect(() => {
    if (mailResult?.failed) {
      setFailedUsers([...mailResult.failed])
    }
  }, [mailResult])

  // Filter failed users based on email search
  const filteredFailedUsers = useMemo(() => {
    if (!failedUsers) return []
    if (!searchEmail) return failedUsers
    return failedUsers.filter(user => 
      user.email.toLowerCase().includes(searchEmail.toLowerCase())
    )
  }, [failedUsers, searchEmail])

  // Calculate pagination
  const totalPages = Math.ceil(filteredFailedUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentFailedUsers = filteredFailedUsers.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when search changes
  const handleSearchChange = (e) => {
    setSearchEmail(e.target.value)
    setCurrentPage(1)
  }

  const handleDeleteFailedUser = (userId) => {
    setFailedUsers(prevData => prevData.filter(user => user.id !== userId))
    
    // Adjust current page if needed after deletion
    const newFilteredCount = filteredFailedUsers.filter(user => user.id !== userId).length
    const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    }
  }

  const handleResendFailed = () => {
    onRetryFailedEmails(failedUsers)
  }

  if (!mailResult) return null

  return (
    <div className="mail-results-container">
      <LoadingSpinner 
        message="Re-sending emails..."
        isVisible={isSendingMail}
      /> 
      {/* Success Summary */}
      <div className="success-summary">
        <div className="success-count">
          ✅ Successfully Sent: <strong>{mailResult.success?.length || 0}</strong> emails
        </div>
      </div>

      {/* Failed Emails Section */}
      {failedUsers.length > 0 && (
        <div className="failed-section">
          <h4>❌ Failed Emails ({failedUsers.length})</h4>
          
          <div className="table-controls">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search failed emails..."
                value={searchEmail}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <div className="table-container">
            <table className="failed-emails-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Company Name</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Tax ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentFailedUsers.map((user, index) => (
                  <tr key={user.id || index}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.owner}</td>
                    <td>{user.email}</td>
                    <td>{user.tax_id}</td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteFailedUser(user.id || index)}
                        title="Remove from retry list"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="pagination-info">
                <span>
                  Page {currentPage} of {totalPages} 
                  ({filteredFailedUsers.length} {filteredFailedUsers.length === 1 ? 'record' : 'records'})
                </span>
              </div>
              
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mail-results-actions">
        {failedUsers.length > 0 && (
          <button
            className="retry-button"
            onClick={handleResendFailed}
            disabled={isSendingMail}
          >
            {isSendingMail ? 'Re-sending...' : `Re-send Failed (${failedUsers.length})`}
          </button>
        )}
      </div>
    </div>
  )
}

export default EmailResultsDisplay
