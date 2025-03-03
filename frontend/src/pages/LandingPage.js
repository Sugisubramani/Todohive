// client/src/pages/LandingPage.js
import React from 'react';
import Navbar from '../components/Layout/Navbar';

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <div className="container text-center mt-5">
        <h1>Welcome to MERN ToDo App</h1>
        <p>Your productivity companion.</p>
        <a href="/auth/signup" className="btn btn-primary mr-2">Signup</a>
        <a href="/auth/login" className="btn btn-secondary">Login</a>
      </div>
    </>
  );
};

export default LandingPage;
