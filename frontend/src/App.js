import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TeamDashboard from './pages/TeamDashboard';
import VerificationPage from './pages/VerificationPage';
import TeamManagementPage from './pages/TeamManagementPage';
import PrivateRoute from './routes/PrivateRoute';
import { TeamProvider } from './context/TeamContext';
import CameraPage from "./pages/CameraPage";
import './styles/Dashboard.css';

function App() {
  return (
    <TeamProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/*" element={<AuthPage />} />
            <Route path="/camera" element={<CameraPage />} />
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
          <Route path="/team-management" element={<TeamManagementPage />} />
        </Routes>
      </Router>
    </TeamProvider>
  );
}

export default App;