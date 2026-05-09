import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Login({ onLoginSuccess, authError }) {
  const [showModal, setShowModal] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  useEffect(() => {
    document.body.classList.add('login-bg');
    return () => {
      document.body.classList.remove('login-bg');
    };
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <Modal
      show={showModal}
      onHide={() => {}}
      backdrop="static"
      keyboard={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>Alumni Management Software - Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!showForgotPassword ? (
          <>
            <Form onSubmit={handleEmailLogin}>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ borderLeft: 0 }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Button>
                </InputGroup>
              </Form.Group>

              <div className="d-flex justify-content-end mb-3">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowForgotPassword(true)}
                  className="p-0"
                >
                  Forgot Password?
                </Button>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mb-3"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Form>

            
          </>
        ) : (
          <ForgotPasswordForm
            onBack={() => {
              setShowForgotPassword(false);
              setError('');
            }}
            onSuccess={() => {
              setShowForgotPassword(false);
              setError('');
              setEmail('');
            }}
          />
        )}
      </Modal.Body>
    </Modal>
  );
}

/* ===============================
   Forgot Password Component
================================ */

function ForgotPasswordForm({ onBack, onSuccess }) {
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('request');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setResetSuccess(
        'Verification code sent to your email. Please check your inbox.'
      );
      setStep('verify');

    } catch (err) {
      setResetError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetCode.trim(), newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess('Password reset successfully. You can log in now.');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5 className="mb-4">Reset Your Password</h5>

      {resetError && (
        <Alert variant="danger" dismissible onClose={() => setResetError('')}>
          {resetError}
        </Alert>
      )}

      {resetSuccess && (
        <Alert variant="success" dismissible onClose={() => setResetSuccess('')}>
          {resetSuccess}
        </Alert>
      )}

      {step === 'request' ? (
        <Form onSubmit={handleRequestReset}>
          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <Form.Text className="d-block mt-2 text-muted">
              Enter the email associated with your account, and we'll send you a
              verification code.
            </Form.Text>
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </Form>
      ) : (
        <Form onSubmit={handleVerifyReset}>
          <Form.Group className="mb-3">
            <Form.Label>Verification Code</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter the 6-digit code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
              inputMode="numeric"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Reset Password'}
          </Button>

          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={() => {
              setStep('request');
              setResetSuccess('');
              setResetError('');
            }}
            disabled={loading}
          >
            Resend Code
          </Button>
        </Form>
      )}

      <Button
        variant="secondary"
        className="w-100"
        onClick={onBack}
        disabled={loading}
      >
        Back to Login
      </Button>
    </div>
  );
}
