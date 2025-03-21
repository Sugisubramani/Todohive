// server/controllers/authController.js
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

    // Send verification email
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
    const html = `<p>Please verify your email by clicking <a href="${verificationLink}">here</a></p>`;
    await sendEmail({ to: email, subject: 'Verify your email', html });

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

  // If no user found, check if already verified (optional)
  if (!user) {
    // Optionally, look up by email or other identifier if you store that elsewhere.
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

    // ✅ Only one response
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

