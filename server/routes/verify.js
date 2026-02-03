import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import User from '../models/User.js';
import Verification from '../models/Verification.js';
import { sendEmailVerification, sendSmsVerification } from '../services/verification.js';

const router = express.Router();

const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

/**
 * POST /api/verify/email/send
 * Send verification code to email
 */
router.post('/email/send', authenticate, asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userId = req.user._id;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Check if email is already taken by another user
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    _id: { $ne: userId }
  });
  if (existingUser) {
    return res.status(400).json({ error: 'Email is already in use' });
  }

  // Check for recent verification request (rate limiting)
  const recentVerification = await Verification.findOne({
    userId,
    type: 'email',
    target: email.toLowerCase(),
    createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) },
  });
  if (recentVerification) {
    const waitSeconds = Math.ceil(
      (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recentVerification.createdAt.getTime())) / 1000
    );
    return res.status(429).json({
      error: 'Please wait before requesting another code',
      waitSeconds,
    });
  }

  // Generate code and save
  const code = Verification.generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // Remove any existing verification for this email
  await Verification.deleteMany({ userId, type: 'email', target: email.toLowerCase() });

  await Verification.create({
    userId,
    type: 'email',
    target: email.toLowerCase(),
    code,
    expiresAt,
  });

  // Send email
  try {
    await sendEmailVerification(email, code);
    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Failed to send email:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
}));

/**
 * POST /api/verify/email/verify
 * Verify email with code
 */
router.post('/email/verify', authenticate, asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const userId = req.user._id;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const verification = await Verification.findOne({
    userId,
    type: 'email',
    target: email.toLowerCase(),
    verified: false,
  });

  if (!verification) {
    return res.status(400).json({ error: 'No pending verification found' });
  }

  if (verification.expiresAt < new Date()) {
    await Verification.deleteOne({ _id: verification._id });
    return res.status(400).json({ error: 'Verification code has expired' });
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    await Verification.deleteOne({ _id: verification._id });
    return res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
  }

  if (verification.code !== code) {
    verification.attempts += 1;
    await verification.save();
    return res.status(400).json({
      error: 'Invalid verification code',
      attemptsRemaining: MAX_ATTEMPTS - verification.attempts,
    });
  }

  // Code is correct - update user's email
  await User.findByIdAndUpdate(userId, { email: email.toLowerCase() });

  // Mark as verified and clean up
  verification.verified = true;
  await verification.save();

  res.json({ success: true, message: 'Email verified successfully' });
}));

/**
 * POST /api/verify/phone/send
 * Send verification code to phone
 */
router.post('/phone/send', authenticate, asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const userId = req.user._id;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Validate phone format (should include country code)
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone format. Include country code (e.g., +1234567890)' });
  }

  const normalizedPhone = phone.replace(/[\s-]/g, '');

  // Check if phone is already taken by another user
  const existingUser = await User.findOne({
    phone: normalizedPhone,
    _id: { $ne: userId }
  });
  if (existingUser) {
    return res.status(400).json({ error: 'Phone number is already in use' });
  }

  // Check for recent verification request (rate limiting)
  const recentVerification = await Verification.findOne({
    userId,
    type: 'phone',
    target: normalizedPhone,
    createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) },
  });
  if (recentVerification) {
    const waitSeconds = Math.ceil(
      (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recentVerification.createdAt.getTime())) / 1000
    );
    return res.status(429).json({
      error: 'Please wait before requesting another code',
      waitSeconds,
    });
  }

  // Generate code and save
  const code = Verification.generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // Remove any existing verification for this phone
  await Verification.deleteMany({ userId, type: 'phone', target: normalizedPhone });

  await Verification.create({
    userId,
    type: 'phone',
    target: normalizedPhone,
    code,
    expiresAt,
  });

  // Send SMS
  try {
    await sendSmsVerification(normalizedPhone, code);
    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Failed to send SMS:', error.message);
    res.status(500).json({ error: 'Failed to send verification SMS' });
  }
}));

/**
 * POST /api/verify/phone/verify
 * Verify phone with code
 */
router.post('/phone/verify', authenticate, asyncHandler(async (req, res) => {
  const { phone, code } = req.body;
  const userId = req.user._id;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  const normalizedPhone = phone.replace(/[\s-]/g, '');

  const verification = await Verification.findOne({
    userId,
    type: 'phone',
    target: normalizedPhone,
    verified: false,
  });

  if (!verification) {
    return res.status(400).json({ error: 'No pending verification found' });
  }

  if (verification.expiresAt < new Date()) {
    await Verification.deleteOne({ _id: verification._id });
    return res.status(400).json({ error: 'Verification code has expired' });
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    await Verification.deleteOne({ _id: verification._id });
    return res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
  }

  if (verification.code !== code) {
    verification.attempts += 1;
    await verification.save();
    return res.status(400).json({
      error: 'Invalid verification code',
      attemptsRemaining: MAX_ATTEMPTS - verification.attempts,
    });
  }

  // Code is correct - update user's phone
  await User.findByIdAndUpdate(userId, { phone: normalizedPhone });

  // Mark as verified and clean up
  verification.verified = true;
  await verification.save();

  res.json({ success: true, message: 'Phone verified successfully' });
}));

/**
 * GET /api/verify/check-username/:username
 * Check if username is available
 */
router.get('/check-username/:username', authenticate, asyncHandler(async (req, res) => {
  const { username } = req.params;
  const userId = req.user._id;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Validate username format
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!usernameRegex.test(username.toLowerCase())) {
    return res.status(400).json({
      error: 'Username must be 3-30 characters, lowercase letters, numbers, and underscores only',
      available: false,
    });
  }

  const existingUser = await User.findOne({
    username: username.toLowerCase(),
    _id: { $ne: userId },
  });

  res.json({
    available: !existingUser,
    username: username.toLowerCase(),
  });
}));

/**
 * POST /api/verify/username
 * Update username (no verification needed, just uniqueness check)
 */
router.post('/username', authenticate, asyncHandler(async (req, res) => {
  const { username } = req.body;
  const userId = req.user._id;

  if (!username) {
    // Clearing username
    await User.findByIdAndUpdate(userId, { $unset: { username: 1 } });
    return res.json({ success: true, message: 'Username removed' });
  }

  // Validate username format
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!usernameRegex.test(username.toLowerCase())) {
    return res.status(400).json({
      error: 'Username must be 3-30 characters, lowercase letters, numbers, and underscores only',
    });
  }

  // Check availability
  const existingUser = await User.findOne({
    username: username.toLowerCase(),
    _id: { $ne: userId },
  });
  if (existingUser) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  await User.findByIdAndUpdate(userId, { username: username.toLowerCase() });
  res.json({ success: true, message: 'Username updated' });
}));

export default router;
