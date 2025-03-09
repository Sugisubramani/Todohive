import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main className="landing">
        <div className="landing-content">
          <h1>Welcome to MERN ToDo App</h1>
          <p>
            Your productivity companion. Manage your tasks effortlessly and get more done!
          </p>
          <Link to="/auth/signup" className="btn btn-primary get-started">
            Get Started
          </Link>
        </div>
      </main>
    </>
  );
};

export default LandingPage;
