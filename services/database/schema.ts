// SQLite schema definitions for offline-first architecture

export const DATABASE_VERSION = 1
export const DATABASE_NAME = 'mneme.db'

// Schema for version 1
export const SCHEMA_V1 = `
  -- Enable WAL mode for better concurrent access
  PRAGMA journal_mode = WAL;

  -- Chats table
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY NOT NULL,
    server_id TEXT UNIQUE,
    name TEXT NOT NULL,
    icon TEXT,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    wallpaper TEXT,
    last_message_content TEXT,
    last_message_type TEXT,
    last_message_timestamp TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Index for chat queries
  CREATE INDEX IF NOT EXISTS idx_chats_deleted_at ON chats(deleted_at);
  CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
  CREATE INDEX IF NOT EXISTS idx_chats_sync_status ON chats(sync_status);
  CREATE INDEX IF NOT EXISTS idx_chats_is_pinned ON chats(is_pinned);

  -- Messages table
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    server_id TEXT UNIQUE,
    chat_id TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL DEFAULT 'text',
    -- Attachment fields
    attachment_url TEXT,
    attachment_filename TEXT,
    attachment_mime_type TEXT,
    attachment_size INTEGER,
    attachment_duration INTEGER,
    attachment_thumbnail TEXT,
    attachment_width INTEGER,
    attachment_height INTEGER,
    -- Location fields
    location_latitude REAL,
    location_longitude REAL,
    location_address TEXT,
    -- Flags
    is_locked INTEGER NOT NULL DEFAULT 0,
    is_starred INTEGER NOT NULL DEFAULT 0,
    is_edited INTEGER NOT NULL DEFAULT 0,
    -- Task fields
    is_task INTEGER NOT NULL DEFAULT 0,
    reminder_at TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    -- Sync fields
    sync_status TEXT NOT NULL DEFAULT 'pending',
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  );

  -- Indexes for message queries
  CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_messages_sync_status ON messages(sync_status);
  CREATE INDEX IF NOT EXISTS idx_messages_is_task ON messages(is_task);
  CREATE INDEX IF NOT EXISTS idx_messages_is_completed ON messages(is_completed);
  CREATE INDEX IF NOT EXISTS idx_messages_reminder_at ON messages(reminder_at);

  -- FTS5 virtual table for full-text search
  CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    id UNINDEXED,
    chat_id UNINDEXED,
    content,
    content='messages',
    content_rowid='rowid'
  );

  -- Triggers to keep FTS index in sync
  CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(rowid, id, chat_id, content)
    VALUES (NEW.rowid, NEW.id, NEW.chat_id, NEW.content);
  END;

  CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, id, chat_id, content)
    VALUES ('delete', OLD.rowid, OLD.id, OLD.chat_id, OLD.content);
  END;

  CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, id, chat_id, content)
    VALUES ('delete', OLD.rowid, OLD.id, OLD.chat_id, OLD.content);
    INSERT INTO messages_fts(rowid, id, chat_id, content)
    VALUES (NEW.rowid, NEW.id, NEW.chat_id, NEW.content);
  END;

  -- User table (single row for current user)
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY NOT NULL,
    server_id TEXT UNIQUE,
    device_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    username TEXT,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    -- Settings (flattened)
    settings_theme TEXT NOT NULL DEFAULT 'system',
    settings_notifications_task_reminders INTEGER NOT NULL DEFAULT 1,
    settings_notifications_shared_messages INTEGER NOT NULL DEFAULT 1,
    settings_privacy_visibility TEXT NOT NULL DEFAULT 'private',
    -- Sync fields
    sync_status TEXT NOT NULL DEFAULT 'pending',
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Sync metadata table
  CREATE TABLE IF NOT EXISTS sync_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_sync_timestamp TEXT,
    last_push_timestamp TEXT,
    is_syncing INTEGER NOT NULL DEFAULT 0
  );

  -- Initialize sync_meta with single row
  INSERT OR IGNORE INTO sync_meta (id) VALUES (1);
`

// Migrations for future versions
export const MIGRATIONS: Record<number, string> = {
  // Example for future migration:
  // 2: `
  //   ALTER TABLE chats ADD COLUMN new_field TEXT;
  //   -- other migration statements
  // `
}
