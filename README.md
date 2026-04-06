# Alumni Management System

A full-stack web application for managing alumni records with authentication, advanced search, and administrative controls.

## Features

- **Authentication** — Email/password login and Google OAuth 2.0
- **JWT Sessions** — Secure token-based authentication (24-hour expiry)
- **Password Reset** — Email-based password reset flow
- **Alumni Directory** — Search by name, roll, phone, email, department, designation, year, company, or address
- **Record Management** — Create and update individual alumni records
- **Bulk Import** — Import alumni records from Excel files with smart column detection
- **Admin Panel** — Manage users, assign roles, create and delete accounts
- **Responsive UI** — Bootstrap 5 with React Bootstrap

## Tech Stack

### Backend
| Package | Purpose |
|---------|---------|
| Express.js | REST API framework |
| MySQL2 | Database driver |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT management |
| google-auth-library | Google OAuth 2.0 |
| Nodemailer | Email sending |
| ExcelJS | Excel file parsing |
| Multer | File upload handling |

### Frontend
| Package | Purpose |
|---------|---------|
| React 19 + Vite | UI library and build tool |
| React Router DOM | Client-side routing |
| Axios | HTTP client |
| React Bootstrap + Bootstrap 5 | UI components and styling |
| @react-oauth/google | Google OAuth button |

### Database
- MySQL with connection pooling
- Tables: `users`, `alumni`, `departments`

## Prerequisites

- Node.js (LTS recommended)
- MySQL server

## Getting Started

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup

Create a MySQL database and run the following:

```sql
CREATE DATABASE IF NOT EXISTS alumini;
USE alumini;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  google_id VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roll VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  dept VARCHAR(100),
  designation VARCHAR(255),
  year INT,
  address TEXT,
  company VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dept_name VARCHAR(100) UNIQUE NOT NULL
);
```

### 3. Environment Configuration

Create a `backend/.env` file:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=alumini

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_jwt_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173

# Email / SMTP (optional, required for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@alumni.com

# Server
PORT=5000
```

### 4. Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
node index.js
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | admin@alumni.com |
| Password | admin123 |

> ⚠️ Change the default password immediately after first login.

## Project Structure

```
alumini/
├── backend/
│   ├── index.js          # Express server entry point
│   ├── auth.js           # Authentication & user management routes
│   ├── alumni.js         # Alumni CRUD and Excel import routes
│   ├── db.js             # MySQL connection pool
│   ├── emailService.js   # Password reset email templates
│   └── uploads/          # Temporary storage for uploaded Excel files
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx               # Root component and routing
        ├── api/api.js            # Axios API client
        ├── components/
        │   ├── Login.jsx         # Login form (email + Google)
        │   ├── SearchForm.jsx    # Alumni search filters
        │   ├── ResultsTable.jsx  # Paginated results table
        │   ├── AlumniModal.jsx   # Create / edit alumni record
        │   ├── ExcelUpload.jsx   # Bulk Excel import
        │   └── UserManagement.jsx # Admin user management
        └── pages/
            ├── AlumniDirectory.jsx # Main dashboard
            └── ResetPassword.jsx   # Password reset page
```

## API Reference

### Authentication — `/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Email/password login | No |
| POST | `/auth/register` | Create new user | Admin |
| POST | `/forgot-password` | Request password reset email | No |
| POST | `/reset-password` | Set new password with token | No |
| GET | `/auth/google` | Initiate Google OAuth flow | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| GET | `/auth/me` | Get current user info | Yes |
| GET | `/auth/users` | List all users | Admin |
| DELETE | `/auth/users/:id` | Delete a user | Admin |
| PATCH | `/auth/users/:id/role` | Update user role | Admin |

### Alumni — `/alumni`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/alumni/search` | Search alumni with filters and pagination | Yes |
| POST | `/alumni` | Create or update a single alumni record | Yes |
| POST | `/alumni/import-excel` | Bulk import alumni from an Excel file | Yes |
| GET | `/alumni/departments` | List all departments | Yes |

## Available Scripts

### Backend
```bash
node index.js      # Start the server
```

### Frontend
```bash
npm run dev        # Start development server with HMR
npm run build      # Build for production
npm run preview    # Preview the production build
npm run lint       # Run ESLint
```

## Additional Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Condensed setup guide |
| [AUTH_SETUP.md](AUTH_SETUP.md) | Detailed authentication configuration |
| [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) | Step-by-step Google OAuth setup |
| [OAUTH_UPGRADE_COMPLETE.md](OAUTH_UPGRADE_COMPLETE.md) | OAuth migration notes |
