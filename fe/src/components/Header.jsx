import './Header.css'

const Header = ({ user, onLogout }) => {
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout()
    }
  }

return (
    <header className="app-header">
      <div className="header-content">
        <h1>Mail Sender</h1>
        <div className="header-user-section">
          <span className="welcome-text">Welcome, {user?.username || user?.name || 'User'}</span>
          {user?.mail_token && (
            <span className="mail-token">Mail token: {user?.mail_token}</span>
          )}
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

