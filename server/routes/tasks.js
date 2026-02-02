import express from 'express';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/tasks
 * Get all tasks for current user
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { filter = 'pending', chatId, page = 1, limit = 50 } = req.query;

  const result = await Message.getTasks(req.user._id, {
    filter,
    chatId,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.json(result);
}));

/**
 * GET /api/tasks/upcoming
 * Get upcoming tasks for the next N days
 */
router.get('/upcoming', authenticate, asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const Chat = (await import('../models/Chat.js')).default;

  // Get user's chats
  const userChats = await Chat.find({
    $or: [
      { ownerId: req.user._id },
      { participants: req.user._id },
    ],
  }).select('_id name');

  const chatIds = userChats.map((c) => c._id);
  const chatMap = new Map(userChats.map((c) => [c._id.toString(), c.name]));

  const tasks = await Message.find({
    chatId: { $in: chatIds },
    'task.isTask': true,
    'task.isCompleted': false,
    'task.reminderAt': { $gte: now, $lte: futureDate },
    isDeleted: false,
  })
    .sort({ 'task.reminderAt': 1 })
    .lean();

  // Add chat name to each task
  const tasksWithChatName = tasks.map((t) => ({
    ...t,
    chatName: chatMap.get(t.chatId.toString()) || 'Unknown',
  }));

  res.json({ tasks: tasksWithChatName });
}));

export default router;
