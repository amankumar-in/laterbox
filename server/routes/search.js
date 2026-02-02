import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/search
 * Search across chats and messages
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { q, type = 'all', page = 1, limit = 20 } = req.query;

  if (!q?.trim()) {
    return res.status(400).json({
      error: 'Query required',
      message: 'Search query is required',
    });
  }

  const results = {
    chats: [],
    messages: [],
  };
  let total = 0;

  // Search chats
  if (type === 'all' || type === 'chats') {
    const chats = await Chat.find({
      $or: [
        { ownerId: req.user._id },
        { participants: req.user._id },
      ],
      name: { $regex: q, $options: 'i' },
    })
      .limit(parseInt(limit))
      .lean();

    results.chats = chats;
    total += chats.length;
  }

  // Search messages
  if (type === 'all' || type === 'messages') {
    const messageResult = await Message.searchMessages(req.user._id, q, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    results.messages = messageResult.messages;
    total += messageResult.total;
  }

  res.json({
    results,
    total,
    query: q,
  });
}));

/**
 * GET /api/search/chat/:chatId
 * Search within a specific chat
 */
router.get('/chat/:chatId', authenticate, asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q?.trim()) {
    return res.status(400).json({
      error: 'Query required',
      message: 'Search query is required',
    });
  }

  const chat = await Chat.findById(req.params.chatId);

  if (!chat) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Chat not found',
    });
  }

  if (!chat.hasAccess(req.user._id)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this chat',
    });
  }

  const result = await Message.searchMessages(req.user._id, q, {
    chatId: chat._id,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.json(result);
}));

export default router;
