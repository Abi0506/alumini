const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  // email transporter verification - errors handled where send is attempted
});

const sendPasswordResetEmail = async (to, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Alumni Directory <noreply@alumni.com>',
    to: to,
    subject: 'Password Reset Request - Alumni Directory',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f9;
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      color: #2d2d2d;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 15px 40px rgba(0,0,0,0.08);
      background: #ffffff;
    }

    .header {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      padding: 35px 20px;
      text-align: center;
      color: #ffffff;
    }

    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .content {
      padding: 40px 35px;
      background-color: #ffffff;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      margin: 16px 0;
      color: #444;
    }

    .button {
      display: inline-block;
      padding: 14px 36px;
      background: linear-gradient(135deg, #d4af37, #c89b2b);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      border-radius: 30px;
      margin: 25px 0;
      box-shadow: 0 6px 18px rgba(212, 175, 55, 0.4);
      transition: all 0.3s ease;
    }

    .link-box {
      background-color: #f1f3f6;
      padding: 14px;
      border-radius: 8px;
      font-size: 13px;
      word-break: break-all;
      color: #333;
    }

    .warning {
      background-color: #fff8e6;
      border-left: 5px solid #d4af37;
      padding: 15px;
      border-radius: 6px;
      margin: 25px 0;
      font-size: 14px;
    }

    .footer {
      text-align: center;
      padding: 25px;
      background-color: #f9fafc;
      font-size: 12px;
      color: #777;
    }

    .divider {
      height: 1px;
      background-color: #eee;
      margin: 30px 0;
    }

  </style>
</head>

<body>
  <div class="container">

    <div class="header">
      <h1>Password Reset</h1>
      <p style="opacity:0.8; margin-top:8px;">Secure Account Recovery</p>
    </div>

    <div class="content">

      <p>Hello <strong>${userName || 'User'}</strong>,</p>

      <p>
        We received a request to reset your password for your Alumni Directory account.
        Click the button below to securely create a new password.
      </p>

      <div style="text-align:center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>

      <p>If the button doesn't work, copy and paste this link into your browser:</p>

      <div class="link-box">
        ${resetUrl}
      </div>

      <div class="warning">
        <strong>Important Security Information</strong>
        <ul style="margin-top:10px; padding-left:18px;">
          <li>This link expires in 1 hour</li>
          <li>If you didn’t request this, you can safely ignore this email</li>
          <li>Your password will not change unless you complete the process</li>
        </ul>
      </div>

      <div class="divider"></div>

      <p>
        If you need assistance, please contact the administrator.
      </p>

      <p style="margin-top:30px;">
        Warm regards,<br>
        <strong>Alumni Directory Team</strong>
      </p>

    </div>

    <div class="footer">
      © ${new Date().getFullYear()} Alumni Directory. All rights reserved.<br>
      This is an automated email. Please do not reply.
    </div>

  </div>
</body>
</html>


    `,
    text: `
Hello ${userName || 'User'},

We received a request to reset your password for your Alumni Directory account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will not change unless you click the link above and create a new password.

Best regards,
Alumni Directory Team
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
};
