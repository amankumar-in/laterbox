import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new device
 */
router.post('/register', asyncHandler(async (req, res) => {
  let { deviceId } = req.body;

  // Generate device ID if not provided
  if (!deviceId) {
    deviceId = uuidv4();
  }

  // Check if device already exists
  let user = await User.findOne({ deviceId });
  let isNew = false;

  if (!user) {
    // Create new user
    user = await User.create({ deviceId });
    isNew = true;
  }

  res.status(isNew ? 201 : 200).json({
    user: {
      _id: user._id,
      deviceId: user.deviceId,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      settings: user.settings,
      createdAt: user.createdAt,
    },
    isNew,
  });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      deviceId: req.user.deviceId,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone,
      avatar: req.user.avatar,
      settings: req.user.settings,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
}));

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', authenticate, asyncHandler(async (req, res) => {
  const { name, username, email, phone, avatar, settings } = req.body;

  // Build update object
  const update = {};
  if (name !== undefined) update.name = name;
  if (username !== undefined) update.username = username || null;
  if (email !== undefined) update.email = email || null;
  if (phone !== undefined) update.phone = phone || null;
  if (avatar !== undefined) update.avatar = avatar;
  if (settings !== undefined) {
    // Merge settings
    update.settings = {
      ...req.user.settings,
      ...settings,
      notifications: {
        ...req.user.settings.notifications,
        ...(settings.notifications || {}),
      },
      privacy: {
        ...req.user.settings.privacy,
        ...(settings.privacy || {}),
      },
    };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    update,
    { new: true, runValidators: true }
  );

  res.json({
    user: {
      _id: user._id,
      deviceId: user.deviceId,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      settings: user.settings,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}));

/**
 * DELETE /api/auth/me
 * Delete current user account and all data
 */
router.delete('/me', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Import models
  const Chat = (await import('../models/Chat.js')).default;
  const Message = (await import('../models/Message.js')).default;
  const SharedChat = (await import('../models/SharedChat.js')).default;

  // Delete all user's chats
  const userChats = await Chat.find({ ownerId: userId });
  const chatIds = userChats.map((c) => c._id);

  // Delete all messages in user's chats
  await Message.deleteMany({ chatId: { $in: chatIds } });

  // Delete all chats
  await Chat.deleteMany({ ownerId: userId });

  // Delete all shared chat records
  await SharedChat.deleteMany({
    $or: [
      { sharedBy: userId },
      { sharedWith: userId },
    ],
  });

  // Remove user from any chats they're a participant in
  await Chat.updateMany(
    { participants: userId },
    { $pull: { participants: userId } }
  );

  // Delete the user
  await User.findByIdAndDelete(userId);

  res.json({
    success: true,
    message: 'Account and all data deleted successfully',
  });
}));

/**
 * POST /api/auth/check-username
 * Check if username is available
 */
router.post('/check-username', asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      error: 'Username required',
      available: false,
    });
  }

  const existing = await User.findOne({
    username: username.toLowerCase(),
  });

  res.json({
    username,
    available: !existing,
  });
}));

export default router;
