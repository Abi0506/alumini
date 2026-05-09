
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
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
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
      <header className="site-header">
        <div className="site-header__inner">
          <img
            className="site-header__image"
            src="/Screenshot%202026-05-09%20220154.png"
            alt="PSG Institute of Technology and Applied Research"
          />
          <div className="site-header__title">Alumni Management Software</div>
          <div className="site-header__spacer" aria-hidden="true"></div>
        </div>
      </header>
      <div className="page-shell">
        <div className="page-content">
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
        </div>
        <footer className="site-footer">
          <div className="site-footer__line">© 2026 PSG Institute of Technology and Applied Research. All rights reserved.</div>
          <div className="site-footer__line">
            Developed by{' '}
            <span
              className="site-footer__accent"
              data-tooltip={`Abishek N (2nd Year CSE)\nAdhithya J (2nd Year CSE)`}
            >
              SDC
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
