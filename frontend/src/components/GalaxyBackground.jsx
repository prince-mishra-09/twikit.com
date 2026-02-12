import React from 'react';
import './GalaxyBackground.css';

const GalaxyBackground = ({ children }) => {
  return (
    <div className="galaxy-container">
      <div className="stars-wrapper">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>
      <div className="galaxy-content">
        {children}
      </div>
    </div>
  );
};

export default GalaxyBackground;
