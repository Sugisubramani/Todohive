import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Layout/Navbar';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main className="landing">
        <motion.div
          className="landing-content"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>Welcome to Todohive</h1>
          <p>
            Your ultimate productivity companion. Manage your tasks effortlessly and get more done with style!
          </p>
          <Link to="/auth/signup" className="get-started">
            Get Started
          </Link>
        </motion.div>
      </main>
    </>
  );
};

export default LandingPage;
