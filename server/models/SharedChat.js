import mongoose from 'mongoose';

const sharedChatSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  permissions: {
    canEdit: {
      type: Boolean,
      default: false,
    },
    canDelete: {
      type: Boolean,
      default: false,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Compound indexes
sharedChatSchema.index({ chatId: 1, sharedWith: 1 }, { unique: true });
sharedChatSchema.index({ sharedWith: 1, status: 1 });
sharedChatSchema.index({ sharedBy: 1 });

// Instance method to accept share
sharedChatSchema.methods.accept = async function () {
  this.status = 'accepted';
  await this.save();

  // Add user to chat participants
  const Chat = mongoose.model('Chat');
  await Chat.findByIdAndUpdate(this.chatId, {
    $addToSet: { participants: this.sharedWith },
    isShared: true,
  });

  return this;
};

// Instance method to reject share
sharedChatSchema.methods.reject = async function () {
  this.status = 'rejected';
  return this.save();
};

// Static method to get pending shares for a user
sharedChatSchema.statics.getPendingShares = async function (userId) {
  return this.find({
    sharedWith: userId,
    status: 'pending',
  })
    .populate('chatId', 'name icon')
    .populate('sharedBy', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to remove user from shared chat
sharedChatSchema.statics.removeShare = async function (chatId, userId) {
  const share = await this.findOneAndDelete({
    chatId,
    sharedWith: userId,
  });

  if (share) {
    // Remove user from chat participants
    const Chat = mongoose.model('Chat');
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { participants: userId } },
      { new: true }
    );

    // Update isShared flag if no more participants
    if (chat && chat.participants.length === 0) {
      chat.isShared = false;
      await chat.save();
    }
  }

  return share;
};

const SharedChat = mongoose.model('SharedChat', sharedChatSchema);

export default SharedChat;
