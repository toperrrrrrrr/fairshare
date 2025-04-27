import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../services/authService';
import { FiPieChart, FiLogOut } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav className="navbar navbar-clean">
      <div className="navbar-brand">
        <span className="navbar-logo"><FiPieChart /></span>
        <Link to="/dashboard">FairShare</Link>
      </div>
      <div className="navbar-links">
        {user && (
          <div className="navbar-user-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="navbar-user-avatar navbar-user-avatar-btn"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              title="Account menu"
            >
              <span className="navbar-user-avatar-initial">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </button>
            {dropdownOpen && (
              <div className="navbar-user-dropdown-menu">
                <div className="navbar-user-dropdown-email">{user.email}</div>
                <button className="navbar-user-dropdown-item" onClick={handleLogout}>
                  <FiLogOut style={{marginRight: '0.5em'}} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
        {!user && <Link to="/">Login</Link>}
      </div>
    </nav>
  );
};

export default Navbar;
