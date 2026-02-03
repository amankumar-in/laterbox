// Local database types for offline-first architecture

export type SyncStatus = 'pending' | 'synced'
export type MessageType = 'text' | 'image' | 'voice' | 'file' | 'location'

// Database row types (snake_case to match SQLite columns)
export interface ChatRow {
  id: string
  server_id: string | null
  name: string
  icon: string | null
  is_pinned: number
  wallpaper: string | null
  last_message_content: string | null
  last_message_type: string | null
  last_message_timestamp: string | null
  sync_status: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface MessageRow {
  id: string
  server_id: string | null
  chat_id: string
  content: string | null
  type: string
  attachment_url: string | null
  attachment_filename: string | null
  attachment_mime_type: string | null
  attachment_size: number | null
  attachment_duration: number | null
  attachment_thumbnail: string | null
  attachment_width: number | null
  attachment_height: number | null
  location_latitude: number | null
  location_longitude: number | null
  location_address: string | null
  is_locked: number
  is_starred: number
  is_edited: number
  is_task: number
  reminder_at: string | null
  is_completed: number
  completed_at: string | null
  sync_status: string
  deleted_at: string | null
  created_at: string
  updated_at: string
  chat_name?: string // Joined from chats table
}

export interface UserRow {
  id: string
  server_id: string | null
  device_id: string
  name: string
  username: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  settings_theme: string
  settings_notifications_task_reminders: number
  settings_notifications_shared_messages: number
  settings_privacy_visibility: string
  sync_status: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// Base type for entities that can be synced (camelCase for app use)
export interface SyncableEntity {
  id: string // Local UUID
  serverId: string | null // MongoDB _id, null until synced
  syncStatus: SyncStatus
  deletedAt: string | null // Soft delete timestamp
  createdAt: string
  updatedAt: string
}

export interface LocalChat extends SyncableEntity {
  name: string
  icon: string | null
  isPinned: number // SQLite doesn't have boolean, use 0/1
  wallpaper: string | null
  lastMessageContent: string | null
  lastMessageType: MessageType | null
  lastMessageTimestamp: string | null
}

export interface LocalMessage extends SyncableEntity {
  chatId: string // Local chat UUID
  content: string | null
  type: MessageType
  // Attachment fields (flattened for SQLite)
  attachmentUrl: string | null
  attachmentFilename: string | null
  attachmentMimeType: string | null
  attachmentSize: number | null
  attachmentDuration: number | null
  attachmentThumbnail: string | null
  attachmentWidth: number | null
  attachmentHeight: number | null
  // Location fields
  locationLatitude: number | null
  locationLongitude: number | null
  locationAddress: string | null
  // Flags
  isLocked: number
  isStarred: number
  isEdited: number
  // Task fields
  isTask: number
  reminderAt: string | null
  isCompleted: number
  completedAt: string | null
}

export interface LocalUser extends SyncableEntity {
  deviceId: string
  name: string
  username: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  // Settings (flattened)
  settingsTheme: 'light' | 'dark' | 'system'
  settingsNotificationsTaskReminders: number
  settingsNotificationsSharedMessages: number
  settingsPrivacyVisibility: 'public' | 'private' | 'contacts'
}

export interface SyncMeta {
  id: number
  lastSyncTimestamp: string | null
  lastPushTimestamp: string | null
  isSyncing: number
}

// Input types for creating entities (without auto-generated fields)
export interface CreateChatInput {
  name: string
  icon?: string | null
}

export interface UpdateChatInput {
  name?: string
  icon?: string | null
  isPinned?: boolean
  wallpaper?: string | null
}

export interface CreateMessageInput {
  chatId: string
  content?: string | null
  type: MessageType
  attachment?: {
    url: string
    filename?: string
    mimeType?: string
    size?: number
    duration?: number
    thumbnail?: string
    width?: number
    height?: number
  } | null
  location?: {
    latitude: number
    longitude: number
    address?: string
  } | null
}

export interface UpdateMessageInput {
  content?: string
}

export interface TaskInput {
  isTask: boolean
  reminderAt?: string | null
  isCompleted?: boolean
}

// Query result types that match the app's expected format
export interface ChatWithLastMessage {
  id: string
  serverId: string | null
  name: string
  icon: string | null
  isPinned: boolean
  wallpaper: string | null
  lastMessage: {
    content: string
    type: MessageType
    timestamp: string
  } | null
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
}

export interface MessageWithDetails {
  id: string
  serverId: string | null
  chatId: string
  chatName?: string // For task queries
  content: string | null
  type: MessageType
  attachment: {
    url: string
    filename?: string
    mimeType?: string
    size?: number
    duration?: number
    thumbnail?: string
    width?: number
    height?: number
  } | null
  location: {
    latitude: number
    longitude: number
    address?: string
  } | null
  isLocked: boolean
  isStarred: boolean
  isEdited: boolean
  task: {
    isTask: boolean
    reminderAt?: string
    isCompleted: boolean
    completedAt?: string
  }
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  serverId: string | null
  deviceId: string
  name: string
  username: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  settings: {
    theme: 'light' | 'dark' | 'system'
    notifications: {
      taskReminders: boolean
      sharedMessages: boolean
    }
    privacy: {
      visibility: 'public' | 'private' | 'contacts'
    }
  }
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
}

// Pagination types
export interface PaginatedResult<T> {
  data: T[]
  hasMore: boolean
  total: number
}

export interface MessageCursor {
  before?: string
  after?: string
  limit?: number
}

// Task filter types
export type TaskFilter = 'pending' | 'completed' | 'overdue' | 'all'
