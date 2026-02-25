# Google OAuth 2.0 Setup Guide - Server-Side (Confidential) Application

This application uses **OAuth 2.0 Authorization Code Flow** with a confidential client. The client secret is securely stored on your backend server and never exposed to the browser.

## Why Server-Side OAuth?

- **More Secure**: Client secret never leaves your server
- **Better Control**: Your backend handles all token exchanges
- **Industry Standard**: Recommended for applications with a backend server

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** or select an existing project
3. Give it a name like "Alumni Directory"

### 2. Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click **Enable**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the **OAuth consent screen**:
   - User Type: **External** (for testing) or **Internal** (for organization only)
   - App name: "Alumni Directory"
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through all steps

4. Back to **Create OAuth client ID**:
   - Application type: **Web application** ⚠️ IMPORTANT!
   - Name: "Alumni Directory Web Client"

5. Configure **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
   (Add your production frontend URL later)

6. Configure **Authorized redirect URIs**:
   ```
   http://localhost:5000/auth/google/callback
   ```
   ⚠️ This MUST match exactly with `GOOGLE_REDIRECT_URI` in your `.env` file
   (Add your production backend URL later)

7. Click **Create**

### 4. Copy Your Credentials

You'll see a modal with:
- **Client ID**: Something like `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123xyz`

⚠️ **IMPORTANT**: 
- The **Client Secret** is shown only once! 
- Copy both values immediately
- Store them securely

### 5. Update Your .env File

Edit `backend/.env`:

```env
# Replace these values with your actual credentials
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz

# These should already be set correctly
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 6. Generate a Secure JWT Secret

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and update `JWT_SECRET` in your `.env` file.

### 7. Verify Your Setup

Your `backend/.env` should look like:

```env
# Database Configuration
DB_HOST="localhost"
DB_USER="root"
DB_PASS="redwolf_8324"
DB_NAME='alumini'

# JWT Secret Key
JWT_SECRET=a1b2c3d4e5f6... (64 character hex string)

# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=5000
```

## How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"** in the frontend
2. **Frontend redirects** to your backend: `http://localhost:5000/auth/google`
3. **Backend redirects** user to Google's login page
4. **User authenticates** with Google and grants permissions
5. **Google redirects** back to your backend with an authorization code: `http://localhost:5000/auth/google/callback?code=...`
6. **Backend exchanges code** for access token using your **client secret** (secure!)
7. **Backend verifies** the Google user's identity
8. **Backend creates** a JWT token for your app
9. **Backend redirects** to frontend with the JWT token
10. **Frontend stores** the token and user is logged in

### Security Benefits

- ✅ Client secret stays on the server (never exposed to browser)
- ✅ Authorization code is single-use and short-lived
- ✅ Access tokens are never sent to the frontend
- ✅ Your app issues its own JWT tokens for session management

## Testing OAuth Login

1. **Start your backend**:
   ```bash
   cd backend
   node index.js
   ```

2. **Start your frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the login**:
   - Open http://localhost:5173
   - Click "Sign in with Google"
   - You should be redirected to Google
   - After login, redirected back to your app

## Troubleshooting

### "redirect_uri_mismatch" Error

- **Cause**: The redirect URI doesn't match exactly
- **Fix**: Check that `GOOGLE_REDIRECT_URI` in `.env` matches exactly what you entered in Google Console
- **Note**: Must include protocol (`http://`), port (`:5000`), and exact path (`/auth/google/callback`)

### "invalid_client" Error

- **Cause**: Wrong Client ID or Client Secret
- **Fix**: Double-check the values in your `.env` file match Google Console

### "Access blocked: This app's request is invalid"

- **Cause**: OAuth consent screen not configured or app not verified
- **Fix**: Complete the OAuth consent screen setup in Google Console
- **For Testing**: Add your email to "Test users" in OAuth consent screen

### Can't See Google Login Button

- **Cause**: Frontend trying to load old GoogleOAuthProvider
- **Fix**: Make sure you've updated App.jsx to remove GoogleOAuthProvider

## Production Deployment

When deploying to production:

1. **Update Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   ```

2. **Update Authorized redirect URIs**:
   ```
   https://yourdomain.com/auth/google/callback
   ```

3. **Update your production .env**:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Never commit** your `.env` file to Git (already in `.gitignore`)

5. **Verify OAuth Consent Screen**:
   - For public use, submit for Google verification
   - Or keep as "Testing" and add specific test users

## Support

For more information, see:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
