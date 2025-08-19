import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTenantInfo, getTenantInfoAsync, getProductName } from '../utils/tenantUtils';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, themeSource, setSystemTheme } = useTheme();
  const navigate = useNavigate();
  const [tenantInfo, setTenantInfo] = useState(() => getTenantInfo()); // Initial sync value
  
  // Get tenant info for dynamic branding
  const productName = getProductName(tenantInfo);
  
  // Update tenant info from API
  useEffect(() => {
    const updateTenantInfo = async () => {
      try {
        const updatedTenantInfo = await getTenantInfoAsync();
        setTenantInfo(updatedTenantInfo);
      } catch (error) {
        console.error('Failed to update tenant info in Navbar:', error);
      }
    };
    
    updateTenantInfo();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          {productName}
        </Link>
        
        <div className="nav-menu">
          <div className="theme-controls">
            <button 
              onClick={toggleTheme} 
              className="theme-toggle"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            {themeSource === 'manual' && (
              <button 
                onClick={setSystemTheme}
                className="system-theme-btn"
                title="Use system theme"
              >
                🖥️
              </button>
            )}
          </div>
          
          {user ? (
            <div className="nav-user">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/tenant-settings" className="nav-link settings-link" title="Tenant Settings">
                ⚙️
              </Link>
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
