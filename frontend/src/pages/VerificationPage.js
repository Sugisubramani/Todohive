import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/VerificationPage.css'; 

const VerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasVerifiedRef = useRef(false); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasVerifiedRef.current) return;

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    console.log("Extracted token:", token);

    if (token) {
      hasVerifiedRef.current = true;
      axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        .then((res) => {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
    
          setTimeout(() => navigate('/dashboard', { replace: true }), 500);
        })
        .catch((err) => {
          const errorMessage = err.response?.data?.message || err.message;
          console.error('Verification failed:', errorMessage);
          setError(errorMessage);
          setLoading(false);
        });
    } else {
      navigate('/auth/login', { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="verification-container">
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Verifying your email, please wait...</p>
        </div>
      ) : (
        <div className="error-message">
          <h2>Verification Error</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;

