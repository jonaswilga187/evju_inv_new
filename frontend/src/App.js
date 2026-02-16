import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import { authAPI } from './services/api';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import ScannerPage from './components/ScannerPage';
import ScanReceiverPage from './components/ScanReceiverPage';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout user={user} onLogout={handleLogout} />} />
      <Route path="/scanner" element={<ScannerPage />} />
      <Route path="/s/:itemId" element={<ScanReceiverPage />} />
    </Routes>
  );
}

export default App;

