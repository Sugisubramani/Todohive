// client/src/components/Auth/Signup.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import '../../styles/Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => setPasswordVisible(prev => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      console.log(res.data);
      // Store the signup email in localStorage as a fallback
      localStorage.setItem("signupEmail", formData.email);
      // Navigate to the verification page with the email in the query parameters
      navigate(`/auth/verification-sent?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <h2>Signup</h2>
        {message && <div className="alert alert-danger">{message}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              name="name" 
              className="form-control" 
              placeholder="Username"
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input 
              type="email" 
              name="email" 
              className="form-control" 
              placeholder="Enter your email"
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group password-group">
            <label>Password</label>
            <div className="password-input-container">
              <input 
                type={passwordVisible ? "text" : "password"} 
                name="password" 
                className="form-control" 
                placeholder="Enter your password"
                onChange={handleChange} 
                required 
                minLength="8"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
              >
                {passwordVisible ? <span>Hide</span> : <span>Show</span>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-auth">Signup</button>
        </form>
        <div className="auth-toggle">
          Already have an account? <Link to="/auth/login">Login</Link>
        </div>
      </div>
    </>
  );
};

export default Signup;
