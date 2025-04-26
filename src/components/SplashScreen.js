import React from 'react';
import './SplashScreen.css';

const SplashScreen = ({ message = 'Loading...' }) => (
  <div className="splash-overlay">
    <div className="splash-card">
      {/* Replace below with your logo if you have one */}
      <div className="splash-logo">FairShare</div>
      <div className="splash-spinner"></div>
      <div className="splash-message">{message}</div>
    </div>
  </div>
);

export default SplashScreen;
