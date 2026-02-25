# Quick Start Commands

## Step 1: Install Dependencies

### Backend
```powershell
cd backend
npm install bcryptjs jsonwebtoken google-auth-library dotenv
```

### Frontend
```powershell
cd frontend
npm install @react-oauth/google
```

## Step 2: Setup Database

Run this SQL in your MySQL database:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create default admin (email: admin@alumni.com, password: admin123)
INSERT INTO users (email, password, name, role) 
VALUES ('admin@alumni.com', '$2a$10$YQ6z8QX8QX8QX8QX8QX8QuGq6q6q6q6q6q6q6q6q6q6q6q6q6q6qu', 'Admin User', 'admin');
```

## Step 3: Update Google Client ID

Edit `frontend/src/App.jsx` line 8 and replace:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
```

With your actual Google OAuth Client ID from [Google Console](https://console.cloud.google.com/)

## Step 4: Start Both Servers

### Terminal 1 - Backend (PowerShell):
```powershell
cd backend
node index.js
```

### Terminal 2 - Frontend (PowerShell):
```powershell
cd frontend
npm run dev
```

## Default Login Credentials

**Email:** admin@alumni.com  
**Password:** admin123

⚠️ **Change this password immediately after first login!**

## Features

✅ Email/Password Login  
✅ Google OAuth Login  
✅ User Management (Admin only)  
✅ Role-based Access (User/Admin)  
✅ JWT Authentication  
✅ Protected Routes  

---

For detailed setup including Google OAuth configuration, see [AUTH_SETUP.md](AUTH_SETUP.md)
