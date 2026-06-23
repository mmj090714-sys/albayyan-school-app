import React from 'react';

const SchoolHeader = ({ showLogoOnly = false }) => {
  return (
    <div className="school-header">
      <div className="school-header-content">
        <img src="/school-logo.png" alt="Albayyan International School Logo" className="school-logo" />
        <div className="school-header-text">
          <h1 className="school-name">Albayyan International School</h1>
          <p className="school-tagline">Fee Management System</p>
        </div>
      </div>
    </div>
  );
};

export default SchoolHeader;
