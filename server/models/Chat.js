import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  icon: {
    type: String, // emoji or image URL
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isShared: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isSystemChat: {
    type: Boolean,
    default: false,
  },
  systemChatType: {
    type: String,
    enum: ['locked_notes', null],
    default: null,
  },
  wallpaper: {
    type: String,
  },
  lastMessage: {
    content: String,
    type: {
      type: String,
      enum: ['text', 'image', 'voice', 'file', 'location'],
    },
    timestamp: Date,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
chatSchema.index({ ownerId: 1, isPinned: -1, updatedAt: -1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ ownerId: 1, isSystemChat: 1, systemChatType: 1 });

// Pre-save middleware
chatSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check if user has access
chatSchema.methods.hasAccess = function (userId) {
  const userIdStr = userId.toString();
  return (
    this.ownerId.toString() === userIdStr ||
    this.participants.some((p) => p.toString() === userIdStr)
  );
};

// Instance method to check if user can edit
chatSchema.methods.canEdit = function (userId) {
  return this.ownerId.toString() === userId.toString();
};

// Static method to get or create locked notes chat
chatSchema.statics.getLockedNotesChat = async function (userId) {
  let lockedChat = await this.findOne({
    ownerId: userId,
    isSystemChat: true,
    systemChatType: 'locked_notes',
  });

  if (!lockedChat) {
    lockedChat = await this.create({
      name: 'Locked Notes',
      icon: '🔒',
      ownerId: userId,
      isSystemChat: true,
      systemChatType: 'locked_notes',
      isPinned: true,
    });
  }

  return lockedChat;
};

// Static method to get user's chats with pagination
chatSchema.statics.getUserChats = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 50,
    filter = 'all',
    search = '',
  } = options;

  const query = {
    $or: [
      { ownerId: userId },
      { participants: userId },
    ],
  };

  // Apply search filter
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  // Apply category filter
  if (filter === 'pinned') {
    query.isPinned = true;
  }

  const total = await this.countDocuments(query);
  const chats = await this.find(query)
    .sort({ isPinned: -1, 'lastMessage.timestamp': -1, updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    chats,
    total,
    page,
    hasMore: page * limit < total,
  };
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
