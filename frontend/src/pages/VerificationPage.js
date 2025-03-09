// client/src/pages/VerificationPage.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
  
    console.log("Extracted token:", token);  // Debugging line
  
    if (token) {
      axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        .then((res) => {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('Verification failed:', err.response?.data || err.message);
        });
    } else {
      navigate('/auth/login');
    }
  }, [location.search, navigate]);
  
  return (
    <div className="container mt-5 text-center">
      <h2>Verifying your email...</h2>
      <p>Please wait while we verify your email.</p>
    </div>
  );
};

export default VerificationPage;
