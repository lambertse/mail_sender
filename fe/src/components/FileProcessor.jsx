import React, { useState, useMemo, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'
import './FileProcessor.css'

const FileProcessor = ({ 
  isProcessing, 
  processResult, 
  orgUserData, 
  onSendMail,
  isSendingMail,
}) => {
  const [searchEmail, setSearchEmail] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [userData, setUserData] = useState([])
  const itemsPerPage = 10

  // Initialize userData from orgUserData when it changes
  useEffect(() => {
    if (orgUserData) {
      setUserData([...orgUserData])
    }
  }, [orgUserData])

  // Filter users based on email search
  const filteredUsers = useMemo(() => {
    if (!userData) return []
    if (!searchEmail) return userData
    return userData.filter(user => 
      user.email.toLowerCase().includes(searchEmail.toLowerCase())
    )
  }, [userData, searchEmail])

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when search changes
  const handleSearchChange = (e) => {
    setSearchEmail(e.target.value)
    setCurrentPage(1)
  }

  const handleDeleteUser = (userId) => {
    setUserData(prevData => prevData.filter(user => user.id !== userId))
    
    // Adjust current page if needed after deletion
    const newFilteredCount = filteredUsers.filter(user => user.id !== userId).length
    const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    }
  }

  const handleRefresh = () => {
    if (orgUserData) {
      setUserData([...orgUserData])
      setSearchEmail('')
      setCurrentPage(1)
    }
  }

  return (
    <>
      <LoadingSpinner 
        message="Sending email..."
        isVisible={isSendingMail}
      />
  
     {processResult && !processResult.mailResult && (
        <div className={`process-result ${processResult.error ? 'error' : 'success'}`}>
          {processResult.error ? (
            <>
              <h3>Error</h3>
              <p>{processResult.error}</p>
              <p>{processResult.details}</p>
            </>
          ) : (
            <>
              {userData && userData.length > 0 && (
                <div className="table-section">
                  <div className="table-controls">
                    <button 
                      className="refresh-button"
                      onClick={handleRefresh}
                      title="Refresh to original data"
                    >
                      🔄
                    </button>
                    <div className="search-container">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search by email..."
                        value={searchEmail}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>
                  
                  <div className="table-container">
                    <table className="data-table">
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
                        {currentUsers.map((user, index) => (
                          <tr key={user.id || index}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.owner}</td>
                            <td>{user.email}</td>
                            <td>{user.tax_id}</td>
                            <td>
                              <button
                                className="delete-button"
                                onClick={() => handleDeleteUser(user.id || index)}
                                title="Delete user"
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
                          ({filteredUsers.length} {filteredUsers.length === 1 ? 'record' : 'records'})
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
            </>
          )}
        </div>
      )}

      {userData && !processResult?.mailResult && (
        <button
          className="send-mail-button"
          onClick={() => onSendMail(userData)}
        >
          Send Mail
        </button>
      )}
    </>
  )
}

export default FileProcessor
