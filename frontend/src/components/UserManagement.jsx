import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert } from 'react-bootstrap';

export default function UserManagement({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: 'psgitech', role: 'user', name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('http://localhost:5000/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch users';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (err) {
        // Fetch users failed
        setError(err.message || 'Failed to fetch users');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      setSuccess('User added successfully');
      setNewUser({ email: '', password: 'psgitech', role: 'user', name: '' });
      setShowAddUser(false);
      setShowPassword(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName, userEmail, userRole) => {
    const confirmMessage = `⚠️ WARNING: This action cannot be undone!\n\nAre you sure you want to permanently delete this user?\n\nName: ${userName}\nEmail: ${userEmail}\nRole: ${userRole.toUpperCase()}\n\nType "DELETE" to confirm:`;
    
    const userInput = window.prompt(confirmMessage);
    
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://localhost:5000/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete user';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(`User "${userName}" (${userRole.toUpperCase()}) has been permanently deleted`);
      fetchUsers();
    } catch (err) {
      // Delete user failed
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, currentRole, userName) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const confirmMessage = `Change user role?\n\nUser: ${userName}\nCurrent Role: ${currentRole.toUpperCase()}\nNew Role: ${newRole.toUpperCase()}\n\nDo you want to proceed?`;
    
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://localhost:5000/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to change user role';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(`User "${userName}" role changed to ${newRole.toUpperCase()}`);
      fetchUsers();
    } catch (err) {
      // Change role failed
      setError(err.message || 'Failed to change user role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>User Management</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <div>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => {
                setShowAddUser(!showAddUser);
                if (showAddUser) {
                  setNewUser({ email: '', password: 'psgitech', role: 'user', name: '' });
                  setError('');
                }
              }}
            >
              {showAddUser ? 'Cancel' : '+ Add New User'}
            </Button>
          </div>
          <div className="text-muted small">
            <strong>Total Users:</strong> {users.length} | 
            <strong className="ms-2">Admins:</strong> {users.filter(u => u.role === 'admin').length} | 
            <strong className="ms-2">Regular Users:</strong> {users.filter(u => u.role === 'user').length}
          </div>
        </div>

        {showAddUser && (
          <Form onSubmit={handleAddUser} className="mb-4 p-3 border rounded">
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </Form.Group>

            <div className="mb-3 p-2 bg-light border rounded">
              <small className="text-muted">
                <strong>Password:</strong> All new users are created with default password <code>psgitech</code>
              </small>
              <br />
              <small className="text-muted">Users can change their password after first login or via "Forgot Password"</small>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>

            <Button type="submit" variant="success" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </Form>
        )}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No users found. Add a new user to get started.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const isCurrentUser = user.id === currentUser.id;
                
                return (
                  <tr key={user.id} className={isCurrentUser ? 'table-primary' : ''}>
                    <td>
                      {user.name}
                      {isCurrentUser && <span className="badge bg-info ms-2">You</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge bg-${user.role === 'admin' ? 'danger' : 'primary'}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group" role="group">
                        {!isCurrentUser && (
                          <>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleChangeRole(user.id, user.role, user.name)}
                              disabled={loading}
                              title={`Change to ${user.role === 'admin' ? 'User' : 'Admin'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                              </svg>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.name, user.email, user.role)}
                              disabled={loading}
                              title="Delete User"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                              </svg>
                            </Button>
                          </>
                        )}
                        {isCurrentUser && (
                          <span className="text-muted small">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
}
