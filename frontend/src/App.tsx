import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoadmapEditor from './pages/RoadmapEditor';
import PublicRoadmap from './pages/PublicRoadmap';
import QuarterView from './pages/QuarterView';
import TenantSettings from './pages/TenantSettings';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import './components.css';
import './styles/index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/tenant-settings" element={
                  <ProtectedRoute>
                    <TenantSettings />
                  </ProtectedRoute>
                } />
                <Route path="/roadmap/:slug/edit" element={
                  <ProtectedRoute>
                    <RoadmapEditor />
                  </ProtectedRoute>
                } />
                <Route path="/roadmap/:slug" element={<PublicRoadmap />} />
                <Route path="/roadmap/:slug/:quarter" element={<QuarterView />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
