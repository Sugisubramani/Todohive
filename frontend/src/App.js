import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TeamDashboard from './pages/TeamDashboard';
import VerificationPage from './pages/VerificationPage';
import PrivateRoute from './routes/PrivateRoute';
import { TeamProvider } from './context/TeamContext';
import './styles/Dashboard.css';

function App() {
  return (
    <TeamProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/*" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerificationPage />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route 
            path="/teams/:teamName/dashboard" 
            element={
              <PrivateRoute>
                <TeamDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </TeamProvider>
  );
}

export default App;