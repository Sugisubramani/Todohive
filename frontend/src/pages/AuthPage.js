// client/src/pages/AuthPage.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Signup from '../components/Auth/Signup';
import Login from '../components/Auth/Login';
import VerificationSent from '../components/Auth/VerificationSent';

const AuthPage = () => {
  return (
    <Routes>
      <Route path="signup" element={<Signup />} />
      <Route path="verification-sent" element={<VerificationSent />} />
      <Route path="login" element={<Login />} />
    </Routes>
  );
};

export default AuthPage;
