import React from 'react'
import './UserDataTable.css'

const UserDataTable = ({ data, title, className = '' }) => {
  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className={`results-section ${className}`}>
      {title && <h4>{title}</h4>}
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
            {data.map((user, index) => (
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
    </div>
  )
}

export default UserDataTable
