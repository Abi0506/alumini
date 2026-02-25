const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const pool = require('./db');
const { sendPasswordResetEmail } = require('./emailService');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

router.post('/register', authenticateToken, isAdmin, async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.execute(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role || 'user']
    );

    res.json({ success: true, message: 'User created successfully' });
  } catch (err) {
    // Registration error
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, email, password, name, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    // Login error
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, email, name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.json({ success: true, message: 'If email exists, reset link has been sent' });
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000);

    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetTokenHash, resetTokenExpires, user.id]
    );

    const hasEmailConfig = process.env.EMAIL_USER && 
                          process.env.EMAIL_USER !== 'your-email@gmail.com' &&
                          process.env.EMAIL_PASS &&
                          process.env.EMAIL_PASS !== 'your-app-password';

    if (hasEmailConfig) {
      try {
        await sendPasswordResetEmail(email, resetToken, user.name);
      } catch (emailErr) {
        // Email send error
      }
    } else {
      // Dev mode: token available in memory for developers to copy if needed
    }

    res.json({ 
      success: true, 
      message: hasEmailConfig 
        ? 'Password reset link sent to email' 
        : 'Test mode: Check server console for reset token' 
    });
  } catch (err) {
    // Forgot password error
    res.status(500).json({ error: 'Failed to process password reset' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await pool.execute(
      'SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [tokenHash]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = users[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    // Reset password error
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.get('/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'select_account'
  });
  
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${FRONTEND_URL}?error=no_code`);
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub;

    let [users] = await pool.execute(
      'SELECT id, email, name, role FROM users WHERE email = ? OR google_id = ?',
      [email, googleId]
    );

    let user;
    if (users.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO users (email, name, role, google_id) VALUES (?, ?, ?, ?)',
        [email, name, 'user', googleId]
      );

      [users] = await pool.execute(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        [result.insertId]
      );
    } else {
      if (!users[0].google_id) {
        await pool.execute(
          'UPDATE users SET google_id = ? WHERE id = ?',
          [googleId, users[0].id]
        );
      }
    }

    user = users[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userDataEncoded = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }));

    res.redirect(`${FRONTEND_URL}?token=${token}&user=${userDataEncoded}`);
  } catch (err) {
    // Google OAuth error
    res.redirect(`${FRONTEND_URL}?error=auth_failed`);
  }
});

router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    // Fetch users error
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [users] = await pool.execute('SELECT email, name FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedUser = users[0];
    
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: `User ${deletedUser.email} has been permanently deleted`,
      deletedUser: {
        email: deletedUser.email,
        name: deletedUser.name
      }
    });
  } catch (err) {
    // Delete user error
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.patch('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    res.json({ 
      success: true, 
      message: `User role updated to ${role}`,
      role
    });
  } catch (err) {
    // Change role error
    res.status(500).json({ error: 'Failed to change user role' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    // Get user error
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.isAdmin = isAdmin;
