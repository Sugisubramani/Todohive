import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InvitePage from './pages/InvitePage';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import VerificationPage from './pages/VerificationPage';
import PrivateRoute from './routes/PrivateRoute';
import TeamDashboard from './pages/TeamDashboard'; 
import './styles/Dashboard.css';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerificationPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/teams/:teamId" element={<TeamDashboard />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
