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
        <Modal.Title>Alumni Directory - Login</Modal.Title>
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

            <div className="text-center mb-3">
              <span className="text-muted">OR</span>
            </div>

            <Button
              variant="outline-primary"
              className="w-100"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Sign in with Google
            </Button>
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
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
        'Reset link sent to your email. Please check your inbox.'
      );

      setTimeout(() => {
        onSuccess();
      }, 2000);

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
            link to reset your password.
          </Form.Text>
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100 mb-3"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </Form>

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
