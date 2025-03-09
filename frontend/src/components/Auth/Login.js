// client/src/components/Auth/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../Layout/Navbar';
import '../../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      if (res && res.data && res.data.token) {
        const token = res.data.token;
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        localStorage.setItem("user", JSON.stringify({ name: decoded.user.name }));
        navigate('/dashboard');
      } else {
        setMessage("Login failed. No token received.");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <h2>Login</h2>
        {message && <div className="alert alert-danger">{message}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
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
          <button type="submit" className="btn btn-primary btn-auth">Login</button>
        </form>
        <div className="auth-toggle">
          Don't have an account? <Link to="/auth/signup">Signup</Link>
        </div>
      </div>
    </>
  );
};

export default Login;
