// client/src/pages/VerificationPage.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract the verification token from the URL query string
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Call the backend verification endpoint
      axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        .then((res) => {
          // Save the token and user info
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          // Redirect to the dashboard (todo page)
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('Verification failed:', err);
          // Optionally, show an error message or redirect to a fallback page
        });
    } else {
      // No token found, redirect to login
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
