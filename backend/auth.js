const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const pool = require('./db');
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendAccountCreationNoticeEmail,
  sendActivationEmail,
} = require('./emailService');
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

// Ensure verification columns exist in the users table (runs once)
(async function ensureVerificationColumns() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_access_logs (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(100) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        note VARCHAR(255) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const check = async (col) => {
      const [rows] = await pool.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ? LIMIT 1",
        [col]
      );
      return rows.length > 0;
    };

    const emailVerifiedExists = await check('email_verified');
    const verifyTokenExists = await check('verify_token');
    const verifyExpiresExists = await check('verify_token_expires');
    const createdByIdExists = await check('created_by_id');
    const createdByEmailExists = await check('created_by_email');
    const createdByNameExists = await check('created_by_name');
    const createdByRoleExists = await check('created_by_role');
    const activationTokenExists = await check('activation_token');
    const activationTokenExpiresExists = await check('activation_token_expires');
    const activationEmailSentAtExists = await check('activation_email_sent_at');
    const firstLoginAtExists = await check('first_login_at');
    const lastLoginAtExists = await check('last_login_at');
    const lastAccessedAtExists = await check('last_accessed_at');
    const accessCountExists = await check('access_count');
    const blockedAtExists = await check('blocked_at');
    const blockedReasonExists = await check('blocked_reason');
    const blockedByIdExists = await check('blocked_by_id');
    const blockedByEmailExists = await check('blocked_by_email');
    const blockedByNameExists = await check('blocked_by_name');
    const blockedByRoleExists = await check('blocked_by_role');

    if (!emailVerifiedExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN email_verified TINYINT(1) DEFAULT 0");
    }
    if (!verifyTokenExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN verify_token VARCHAR(255) DEFAULT NULL");
    }
    if (!verifyExpiresExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN verify_token_expires DATETIME DEFAULT NULL");
    }
    if (!createdByIdExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN created_by_id INT NULL");
    }
    if (!createdByEmailExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN created_by_email VARCHAR(255) DEFAULT NULL");
    }
    if (!createdByNameExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN created_by_name VARCHAR(255) DEFAULT NULL");
    }
    if (!createdByRoleExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN created_by_role VARCHAR(50) DEFAULT NULL");
    }
    if (!activationTokenExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN activation_token VARCHAR(255) DEFAULT NULL");
    }
    if (!activationTokenExpiresExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN activation_token_expires DATETIME DEFAULT NULL");
    }
    if (!activationEmailSentAtExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN activation_email_sent_at DATETIME DEFAULT NULL");
    }
    if (!firstLoginAtExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN first_login_at DATETIME DEFAULT NULL");
    }
    if (!lastLoginAtExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN last_login_at DATETIME DEFAULT NULL");
    }
    if (!lastAccessedAtExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN last_accessed_at DATETIME DEFAULT NULL");
    }
    if (!accessCountExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN access_count INT NOT NULL DEFAULT 0");
    }
    if (!blockedAtExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN blocked_at DATETIME DEFAULT NULL");
    }
    if (!blockedReasonExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN blocked_reason VARCHAR(255) DEFAULT NULL");
    }
    if (!blockedByIdExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN blocked_by_id INT NULL");
    }
    if (!blockedByEmailExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN blocked_by_email VARCHAR(255) DEFAULT NULL");
    }
    if (!blockedByNameExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN blocked_by_name VARCHAR(255) DEFAULT NULL");
    }
    if (!blockedByRoleExists) {
      await pool.execute("ALTER TABLE users ADD COLUMN blocked_by_role VARCHAR(50) DEFAULT NULL");
    }
  } catch (err) {
    // If migration fails, do not crash server here — admin can run DB migration manually.
    console.warn('ensureVerificationColumns failed:', err.message || err);
  }
})();

const isPsgitechEmail = (email) =>
  String(email || '').trim().toLowerCase().endsWith('@psgitech.ac.in');

const readCreator = async (creatorId) => {
  const [rows] = await pool.execute(
    'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1',
    [creatorId]
  );

  return rows[0] || null;
};

const readUserById = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  return rows[0] || null;
};

const buildActivationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

  return { token, tokenHash, expiresAt };
};

const buildAdminReviewToken = ({ creatorId, createdUserId }) =>
  jwt.sign(
    {
      type: 'admin_creation_review',
      creatorId,
      createdUserId,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

const logUserAccess = async ({ userId, eventType, req, note = null }) => {
  try {
    await pool.execute(
      'INSERT INTO user_access_logs (user_id, event_type, ip_address, user_agent, note) VALUES (?, ?, ?, ?, ?)',
      [
        userId,
        eventType,
        req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
        req.headers['user-agent'] || null,
        note,
      ]
    );
  } catch (err) {
    // Access log should not block auth flow.
  }
};

const ensureActivationEmailSent = async ({ user, req }) => {
  if (!user || user.activation_email_sent_at) {
    return null;
  }

  const { token, tokenHash, expiresAt } = buildActivationToken();

  await pool.execute(
    'UPDATE users SET activation_token = ?, activation_token_expires = ? WHERE id = ?',
    [tokenHash, expiresAt, user.id]
  );

  await sendActivationEmail({
    recipientEmail: user.email,
    activationToken: token,
    userName: user.name,
    requestContext: req,
  });

  await pool.execute(
    'UPDATE users SET activation_email_sent_at = NOW() WHERE id = ?',
    [user.id]
  );

  return token;
};

const blockUserAccount = async ({ userId, blockedBy = null, reason = 'Blocked by super admin' }) => {
  const [result] = await pool.execute(
    `UPDATE users
     SET blocked_at = NOW(),
         blocked_reason = ?,
         blocked_by_id = ?,
         blocked_by_email = ?,
         blocked_by_name = ?,
         blocked_by_role = ?,
         activation_token = NULL,
         activation_token_expires = NULL
     WHERE id = ?`,
    [
      reason,
      blockedBy?.id || null,
      blockedBy?.email || null,
      blockedBy?.name || null,
      blockedBy?.role || null,
      userId,
    ]
  );

  return result.affectedRows > 0;
};

router.post('/register', authenticateToken, isAdmin, async (req, res) => {
  const { email, password, name, role } = req.body;
  const assignedRole = role || 'user';

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  if (!['user', 'admin'].includes(assignedRole)) {
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
  }

  if (!isPsgitechEmail(email)) {
    return res.status(400).json({ error: 'New user email must be on the psgitech.ac.in domain' });
  }

  try {
    const creator = await readCreator(req.user.id);

    if (!creator) {
      return res.status(403).json({ error: 'Creator account not found' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create a verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const verifyExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    const [insertResult] = await pool.execute(
      'INSERT INTO users (email, password, name, role, email_verified, verify_token, verify_token_expires, created_by_id, created_by_email, created_by_name, created_by_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, assignedRole, 0, verifyTokenHash, verifyExpires, creator.id, creator.email, creator.name, creator.role]
    );

    const createdUserId = insertResult.insertId;
    const adminReviewToken = buildAdminReviewToken({
      creatorId: creator.id,
      createdUserId,
    });

    try {
      await sendVerificationEmail(email, verifyToken, name);
    } catch (emailErr) {
      // If email fails, still create user but warn admin
      console.warn('Verification email send failed:', emailErr.message || emailErr);
    }

    try {
      await sendAccountCreationNoticeEmail({
        recipientEmail: process.env.ACCOUNT_CREATION_NOTICE_EMAIL || 'sdc@psgitech.ac.in',
        creator,
        createdUser: {
          id: createdUserId,
          email,
          name,
          role: assignedRole,
        },
        adminReviewToken,
      });
    } catch (noticeErr) {
      console.warn('Account creation notice send failed:', noticeErr.message || noticeErr);
    }

    res.json({ success: true, message: 'User created. Verification email sent.' });
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

  if (!isPsgitechEmail(email)) {
    return res.status(400).json({ error: 'Email login requires an @psgitech.ac.in email address' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, email, password, name, role, email_verified, blocked_at, activation_email_sent_at, last_login_at, last_accessed_at, access_count FROM users WHERE email = ?',
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

    if (user.blocked_at) {
      return res.status(403).json({ error: 'This account is blocked. Please contact the administrator.' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Email not verified. Please check your inbox for the verification link.' });
    }

    const now = new Date();
    const isFirstLogin = !user.last_login_at;

    await pool.execute(
      `UPDATE users
       SET first_login_at = COALESCE(first_login_at, ?),
           last_login_at = ?,
           last_accessed_at = ?,
           access_count = COALESCE(access_count, 0) + 1
       WHERE id = ?`,
      [now, now, now, user.id]
    );

    await logUserAccess({ userId: user.id, eventType: 'LOGIN', req, note: 'email_password' });

    if (isFirstLogin) {
      try {
        await ensureActivationEmailSent({ user, req });
      } catch (noticeErr) {
        console.warn('Activation email send failed:', noticeErr.message || noticeErr);
      }
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

// Verify email endpoint
router.get('/verify-email', async (req, res) => {
  const token = String(req.query?.token || '').trim();
  if (!token) return res.redirect(`${FRONTEND_URL}?verified=0&error=no_token`);

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE verify_token = ? AND verify_token_expires > NOW() LIMIT 1',
      [tokenHash]
    );

    if (users.length === 0) {
      return res.redirect(`${FRONTEND_URL}?verified=0&error=invalid_or_expired`);
    }

    const user = users[0];
    await pool.execute(
      'UPDATE users SET email_verified = 1, verify_token = NULL, verify_token_expires = NULL WHERE id = ?',
      [user.id]
    );

    return res.redirect(`${FRONTEND_URL}?verified=1`);
  } catch (err) {
    return res.redirect(`${FRONTEND_URL}?verified=0&error=server_error`);
  }
});

router.get('/block-pending-user', async (req, res) => {
  const token = String(req.query?.token || '').trim();

  if (!token) {
    return res.redirect(`${FRONTEND_URL}?blocked=0&error=no_token`);
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE verify_token = ? AND verify_token_expires > NOW() LIMIT 1',
      [tokenHash]
    );

    if (users.length === 0) {
      return res.redirect(`${FRONTEND_URL}?blocked=0&error=invalid_or_expired`);
    }

    await blockUserAccount({
      userId: users[0].id,
      reason: 'Blocked from account verification email link',
    });

    await pool.execute(
      'UPDATE users SET verify_token = NULL, verify_token_expires = NULL WHERE id = ?',
      [users[0].id]
    );

    return res.redirect(`${FRONTEND_URL}?blocked=1`);
  } catch (err) {
    return res.redirect(`${FRONTEND_URL}?blocked=0&error=server_error`);
  }
});

router.get('/admin-review', async (req, res) => {
  const token = String(req.query?.token || '').trim();
  const decision = String(req.query?.decision || '').trim().toLowerCase();

  if (!token || !['confirm', 'block'].includes(decision)) {
    return res.status(400).send('Invalid admin review link.');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload?.type !== 'admin_creation_review' || !payload?.createdUserId) {
      return res.status(400).send('Invalid admin review token.');
    }

    const createdUser = await readUserById(payload.createdUserId);

    if (!createdUser) {
      return res.status(404).send('The created account no longer exists.');
    }

    if (decision === 'confirm') {
      return res.send('Thanks for confirming this account creation. No further action is needed.');
    }

    const creator = payload.creatorId ? await readCreator(payload.creatorId) : null;

    await blockUserAccount({
      userId: createdUser.id,
      blockedBy: creator,
      reason: 'Blocked from admin account creation review email link',
    });

    return res.send('The account has been blocked successfully.');
  } catch (err) {
    return res.status(400).send('This admin review link is invalid or expired.');
  }
});

router.get('/block-account', async (req, res) => {
  const token = String(req.query?.token || '').trim();

  if (!token) {
    return res.redirect(`${FRONTEND_URL}?blocked=0&error=no_token`);
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE activation_token = ? AND activation_token_expires > NOW() LIMIT 1',
      [tokenHash]
    );

    if (users.length === 0) {
      return res.redirect(`${FRONTEND_URL}?blocked=0&error=invalid_or_expired`);
    }

    await blockUserAccount({ userId: users[0].id, reason: 'Blocked from activation email link' });
    return res.redirect(`${FRONTEND_URL}?blocked=1`);
  } catch (err) {
    return res.redirect(`${FRONTEND_URL}?blocked=0&error=server_error`);
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
      'SELECT id, email, name, role, google_id, email_verified, blocked_at, activation_email_sent_at, last_login_at, last_accessed_at, access_count FROM users WHERE email = ? OR google_id = ?',
      [email, googleId]
    );

    let user;
    if (users.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO users (email, name, role, google_id, email_verified) VALUES (?, ?, ?, ?, ?)',
        [email, name, 'user', googleId, 1]
      );

      [users] = await pool.execute(
        'SELECT id, email, name, role, email_verified, blocked_at, activation_email_sent_at, last_login_at, last_accessed_at, access_count FROM users WHERE id = ?',
        [result.insertId]
      );
    } else {
      if (!users[0].google_id) {
        await pool.execute(
          'UPDATE users SET google_id = ?, email_verified = 1 WHERE id = ?',
          [googleId, users[0].id]
        );
      }
      await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [users[0].id]);
    }

    user = users[0];

    if (user.blocked_at) {
      return res.redirect(`${FRONTEND_URL}?error=blocked`);
    }

    const now = new Date();
    const isFirstLogin = !user.last_login_at;

    await pool.execute(
      `UPDATE users
       SET first_login_at = COALESCE(first_login_at, ?),
           last_login_at = ?,
           last_accessed_at = ?,
           access_count = COALESCE(access_count, 0) + 1
       WHERE id = ?`,
      [now, now, now, user.id]
    );

    await logUserAccess({ userId: user.id, eventType: 'LOGIN', req, note: 'google_oauth' });

    if (isFirstLogin) {
      try {
        await ensureActivationEmailSent({ user, req });
      } catch (noticeErr) {
        console.warn('Activation email send failed:', noticeErr.message || noticeErr);
      }
    }

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
      `SELECT id, email, name, role, created_at,
              created_by_id, created_by_email, created_by_name, created_by_role,
              email_verified, activation_email_sent_at, first_login_at, last_login_at, last_accessed_at,
              access_count, blocked_at, blocked_reason, blocked_by_id, blocked_by_email, blocked_by_name, blocked_by_role
       FROM users ORDER BY created_at DESC`
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

    const [users] = await pool.execute('SELECT email, name, role FROM users WHERE id = ?', [id]);
    
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

    const [currentUsers] = await pool.execute('SELECT role FROM users WHERE id = ? LIMIT 1', [id]);
    if (currentUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
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
      'SELECT id, email, name, role, blocked_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (users[0].blocked_at) {
      return res.status(403).json({ error: 'This account is blocked. Please contact the administrator.' });
    }

    await pool.execute(
      'UPDATE users SET last_accessed_at = NOW(), access_count = COALESCE(access_count, 0) + 1 WHERE id = ?',
      [req.user.id]
    );

    await logUserAccess({ userId: req.user.id, eventType: 'ACCESS', req, note: 'profile_check' });

    res.json(users[0]);
  } catch (err) {
    // Get user error
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

router.patch('/users/:id/block', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ error: 'You cannot block your own account' });
    }

    const user = await readUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await blockUserAccount({
      userId: user.id,
      blockedBy: req.user,
      reason: 'Blocked by super admin',
    });

    await logUserAccess({ userId: user.id, eventType: 'BLOCKED', req, note: 'super_admin_action' });

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block user' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.isAdmin = isAdmin;
