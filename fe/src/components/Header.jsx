import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import './Header.css'

const Header = ({ user, onLogout }) => {
  const [showToken, setShowToken] = useState(false)

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout()
    }
  }

  const maskToken = (token) => {
    if (!token) return ''
    return '*'.repeat(token.length - 4) + token.slice(-4)
  }

return (
    <header className="app-header">
      <div className="header-content">
        <h1>Automatic Mail Sender</h1>
        <div className="header-user-section">
          <div className="user-info-card">
            <div className="user-avatar">
              {(user?.username || user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="user-details">
              <span className="welcome-text">Welcome, {user?.username || user?.name || 'User'}</span>
              {user?.mail_token && (
                <div className="mail-token-container">
                  <span className="mail-token">
                    Mail token: {showToken ? user.mail_token : maskToken(user.mail_token)}
                  </span>
                  <button 
                    className="token-eye-button"
                    onClick={() => setShowToken(!showToken)}
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              )}
            </div>
          </div>
          <button 
            className="logout-button" 
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
 
}

export default Header
