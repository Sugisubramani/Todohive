const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const verificationToken = crypto.randomBytes(20).toString('hex');
    user = new User({ name, email, password, verificationToken });
    await user.save();

    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                font-family: 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                background: #f8f9fa;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            .header h2 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            .content {
                padding: 30px;
                background-color: #333333;
                color: #ffffff;
            }
            .content h3 {
                margin-top: 0;
            }
            .button {
                display: inline-block;
                padding: 12px 32px;
                background: white;
                color: black;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            }
            .button:hover {
                background: #e2e6ea;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .footer {
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #212529;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }
            .logo-text {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .verification-note {
                background: #e9ecef;
                padding: 15px;
                border-radius: 6px;
                margin: 15px 0;
                font-size: 13px;
                color: black;
            }
        </style>
    </head>
    <body style="background-color: #f8f9fa; margin: 0; padding: 0;">
        <div class="email-container">
            <div class="header">
                <div class="logo-text">TodoHive</div>
                <h2>Welcome to Your New Hive!</h2>
            </div>
            <div class="content">
                <h3>Hello${name ? ' ' + name : ''}! 👋</h3>
                <p>Thank you for joining TodoHive. We're excited to help you organize and collaborate better!</p>
                <p>To start using your hive, please verify your email address:</p>
                <div style="text-align: center;">
                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                </div>
                <div class="verification-note">
                    <p style="margin: 0;">If the button doesn't work, copy and paste this link:</p>
                    <p style="margin: 5px 0; word-break: break-all; font-family: monospace;">${verificationLink}</p>
                    <p style="margin: 5px 0; color: #dc3545;">This verification link will expire in 24 hours.</p>
                </div>
            </div>
            <div class="footer">
                <p>This email was sent to verify your TodoHive account.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} TodoHive. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await sendEmail({ to: email, subject: 'Verify your email - TodoHive', html });

    res.status(201).json({ message: 'Signup successful. Verification email sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  console.log("Received verification token:", token);

  if (!token) {
    return res.status(400).json({ message: 'Missing verification token' });
  }

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  if (user.emailVerified) {
    return res.json({
      message: 'Email is already verified.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  }

  user.emailVerified = true;
  user.verificationToken = undefined;
  await user.save();

  const payload = { user: { id: user.id, name: user.name, email: user.email } };
  const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({
    message: 'Email verified successfully.',
    token: jwtToken,
    user: { id: user.id, name: user.name, email: user.email }
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.emailVerified) return res.status(401).json({ message: 'Please verify your email first.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id, name: user.name, email: user.email } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
