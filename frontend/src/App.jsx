
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AlumniDirectory from './pages/AlumniDirectory';
import Login from './components/Login';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
   
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      setAuthError('Google authentication failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        setAuthError('Authentication failed. Please try again.');
      }
      return;
    }

    
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} authError={authError} />} />
        <Route
          path="/"
          element={isAuthenticated ? (
            <AlumniDirectory user={user} onLogout={handleLogout} />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} authError={authError} />
          )}
        />
        <Route
          path="/alumni"
          element={isAuthenticated ? (
            <AlumniDirectory user={user} onLogout={handleLogout} />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} authError={authError} />
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
