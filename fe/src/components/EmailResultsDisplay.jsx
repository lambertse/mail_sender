import React from 'react'
import UserDataTable from './UserDataTable'
import './EmailResultsDisplay.css'

const EmailResultsDisplay = ({
  mailResult,
  isSendingMail,
  onRetryFailedEmails,
  onCancelRetry,
  onBackToMain
}) => {
  if (!mailResult) return null

  return (
    <div className="mail-results-container">
      <h3>Email Sending Results</h3>
      
      {mailResult.success.length > 0 && (
        <UserDataTable
          data={mailResult.success}
          title={`✅ Successfully Sent (${mailResult.success.length})`}
          className="success-section"
        />
      )}

      {mailResult.failed.length > 0 && (
        <UserDataTable
          data={mailResult.failed}
          title={`❌ Failed to Send (${mailResult.failed.length})`}
          className="failed-section"
        />
      )}

      <div className="mail-results-actions">
        {mailResult.showRetryInterface && mailResult.failed.length > 0 && (
          <>
            <button
              className="retry-button"
              onClick={onRetryFailedEmails}
              disabled={isSendingMail}
            >
              {isSendingMail ? 'Retrying...' : `Retry Failed (${mailResult.failed.length})`}
            </button>
            <button
              className="cancel-retry-button"
              onClick={onCancelRetry}
              disabled={isSendingMail}
            >
              Cancel Retry
            </button>
          </>
        )}
        <button
          className="back-to-main-button"
          onClick={onBackToMain}
        >
          Back to Main
        </button>
      </div>
    </div>
  )
}

export default EmailResultsDisplay
