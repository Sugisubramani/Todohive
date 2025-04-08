const express = require('express');
const router = express.Router();
const { signup, verifyEmail, login, resendVerification } = require('../controllers/authController');

router.post('/signup', signup);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/resend-verification', resendVerification);

module.exports = router;
