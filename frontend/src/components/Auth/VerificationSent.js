// client/src/components/Auth/VerificationSent.js
import React from 'react';

const VerificationSent = () => {
  return (
    <div className="container text-center mt-5">
      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Verification Email Sent!</h2>
          <p className="card-text">
            We have sent a verification link to your Gmail. Please check your inbox and click the link to verify your account.
          </p>
          <a 
            href="https://mail.google.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-danger btn-lg"
          >
            Open Gmail
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerificationSent;
