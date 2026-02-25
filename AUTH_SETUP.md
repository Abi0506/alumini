# Authentication Setup Guide

## 1. Install Backend Dependencies

```bash
cd backend
npm install bcryptjs jsonwebtoken google-auth-library
```

## 2. Install Frontend Dependencies

```bash
cd frontend
npm install @react-oauth/google
```

## 3. Database Setup

Run the SQL script to create the users table:

```bash
mysql -u root -p alumni_db < backend/users_table.sql
```

Or manually run the SQL in your MySQL client.

## 4. Environment Variables

Create a `.env` file in the backend folder:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id-from-console
```

## 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
5. Copy the Client ID and paste it in:
   - Backend `.env` as `GOOGLE_CLIENT_ID`
   - Frontend `src/App.jsx` where it says `YOUR_GOOGLE_CLIENT_ID`

## 6. Update Backend to Use Environment Variables

Update `backend/auth.js` to use environment variables if not already done:

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
```

## 7. Create Admin User

The SQL script creates a default admin user:
- Email: `admin@alumni.com`
- Password: `admin123`

**⚠️ IMPORTANT: Change this password immediately after first login!**

## 8. Start the Application

Backend:
```bash
cd backend
node index.js
```

Frontend:
```bash
cd frontend
npm run dev
```

## Features

### For All Users:
- Email/password login
- Google OAuth login
- View and search alumni
- Edit alumni records
- Upload Excel files

### For Admin Users:
- All user features
- Create new users
- Delete users
- Assign admin/user roles
- Manage user accounts

## Security Notes

1. Always use HTTPS in production
2. Change default admin password
3. Use strong JWT_SECRET in production
4. Never commit .env files to git
5. Regularly update dependencies
6. Implement rate limiting for login attempts (recommended)
7. Add password reset functionality (recommended)

## Troubleshooting

**Login fails:**
- Check database connection
- Verify users table exists
- Check JWT_SECRET is set
- Verify password is correct

**Google login fails:**
- Verify GOOGLE_CLIENT_ID is correct
- Check authorized origins in Google Console
- Ensure google-auth-library is installed
- Check browser console for errors

**Token errors:**
- Clear localStorage
- Check token expiration (24h default)
- Verify JWT_SECRET matches backend
