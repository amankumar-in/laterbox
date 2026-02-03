import type { SQLiteDatabase } from 'expo-sqlite'
import {
  generateUUID,
  getTimestamp,
  toBoolean,
  fromBoolean,
  type ChatRow,
  type ChatWithLastMessage,
  type CreateChatInput,
  type UpdateChatInput,
  type SyncStatus,
  type MessageType,
  type PaginatedResult,
} from '../database'

export class ChatRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new chat
   */
  async create(input: CreateChatInput): Promise<ChatWithLastMessage> {
    const id = generateUUID()
    const now = getTimestamp()

    await this.db.runAsync(
      `INSERT INTO chats (id, name, icon, is_pinned, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, 0, 'pending', ?, ?)`,
      [id, input.name, input.icon ?? null, now, now]
    )

    return this.getById(id) as Promise<ChatWithLastMessage>
  }

  /**
   * Get a chat row by local ID (for sync; returns raw row).
   */
  async getRowById(id: string): Promise<ChatRow | null> {
    return this.db.getFirstAsync<ChatRow>(
      `SELECT * FROM chats WHERE id = ? AND deleted_at IS NULL`,
      [id]
    )
  }

  /**
   * Get a chat by local ID
   */
  async getById(id: string): Promise<ChatWithLastMessage | null> {
    const row = await this.getRowById(id)
    if (!row) return null
    return this.mapToChat(row)
  }

  /**
   * Get a chat by server ID
   */
  async getByServerId(serverId: string): Promise<ChatWithLastMessage | null> {
    const row = await this.db.getFirstAsync<ChatRow>(
      `SELECT * FROM chats WHERE server_id = ? AND deleted_at IS NULL`,
      [serverId]
    )

    if (!row) return null
    return this.mapToChat(row)
  }

  /**
   * Get all chats with optional filtering and pagination
   */
  async getAll(params?: {
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResult<ChatWithLastMessage>> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const offset = (page - 1) * limit
    const search = params?.search?.trim()

    let whereClause = 'WHERE deleted_at IS NULL'
    const queryParams: (string | number)[] = []

    if (search) {
      whereClause += ' AND name LIKE ?'
      queryParams.push(`%${search}%`)
    }

    // Get total count
    const countResult = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM chats ${whereClause}`,
      queryParams
    )
    const total = countResult?.count ?? 0

    // Get paginated results, ordered by pinned first, then last message timestamp
    const rows = await this.db.getAllAsync<ChatRow>(
      `SELECT * FROM chats ${whereClause}
       ORDER BY is_pinned DESC,
                COALESCE(last_message_timestamp, updated_at) DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    const chats = rows.map((row) => this.mapToChat(row))
    const hasMore = offset + rows.length < total

    return { data: chats, hasMore, total }
  }

  /**
   * Update a chat
   */
  async update(id: string, input: UpdateChatInput): Promise<ChatWithLastMessage | null> {
    const chat = await this.getById(id)
    if (!chat) return null

    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (input.name !== undefined) {
      updates.push('name = ?')
      values.push(input.name)
    }
    if (input.icon !== undefined) {
      updates.push('icon = ?')
      values.push(input.icon)
    }
    if (input.isPinned !== undefined) {
      updates.push('is_pinned = ?')
      values.push(fromBoolean(input.isPinned))
    }
    if (input.wallpaper !== undefined) {
      updates.push('wallpaper = ?')
      values.push(input.wallpaper)
    }

    if (updates.length === 0) return chat

    // Mark as pending sync and update timestamp
    updates.push('sync_status = ?', 'updated_at = ?')
    values.push('pending', getTimestamp())

    await this.db.runAsync(
      `UPDATE chats SET ${updates.join(', ')} WHERE id = ?`,
      [...values, id]
    )

    return this.getById(id)
  }

  /**
   * Soft delete a chat
   */
  async delete(id: string): Promise<{ success: boolean; lockedMessagesCount: number }> {
    // Count locked messages
    const lockedResult = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages
       WHERE chat_id = ? AND is_locked = 1 AND deleted_at IS NULL`,
      [id]
    )
    const lockedMessagesCount = lockedResult?.count ?? 0

    const now = getTimestamp()

    // Soft delete the chat
    await this.db.runAsync(
      `UPDATE chats SET deleted_at = ?, sync_status = 'pending', updated_at = ?
       WHERE id = ?`,
      [now, now, id]
    )

    // Soft delete all non-locked messages
    await this.db.runAsync(
      `UPDATE messages SET deleted_at = ?, sync_status = 'pending', updated_at = ?
       WHERE chat_id = ? AND is_locked = 0`,
      [now, now, id]
    )

    return { success: true, lockedMessagesCount }
  }

  /**
   * Update last message info for a chat
   */
  async updateLastMessage(
    chatId: string,
    content: string | null,
    type: MessageType,
    timestamp: string
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE chats
       SET last_message_content = ?, last_message_type = ?, last_message_timestamp = ?,
           updated_at = ?
       WHERE id = ?`,
      [content, type, timestamp, getTimestamp(), chatId]
    )
  }

  /**
   * Get chats with pending sync status
   */
  async getPendingSync(): Promise<ChatRow[]> {
    return this.db.getAllAsync<ChatRow>(
      `SELECT * FROM chats WHERE sync_status = 'pending'`
    )
  }

  /**
   * Get chats that have never been synced (no server_id). Used so we always
   * send every unsynced chat in push, regardless of sync_status or pending messages.
   */
  async getNeverSynced(): Promise<ChatRow[]> {
    return this.db.getAllAsync<ChatRow>(
      `SELECT * FROM chats WHERE server_id IS NULL AND deleted_at IS NULL`
    )
  }

  /**
   * Get all non-deleted chat rows (for sync). Ensures every chat on device is sent
   * so server can create or correct mappings (e.g. wrong server_id from merge).
   */
  async getAllNonDeletedRows(): Promise<ChatRow[]> {
    return this.db.getAllAsync<ChatRow>(
      `SELECT * FROM chats WHERE deleted_at IS NULL`
    )
  }

  /**
   * Mark a chat as synced with server ID
   */
  async markSynced(localId: string, serverId: string): Promise<void> {
    const existing = await this.db.getFirstAsync<ChatRow>(
      `SELECT * FROM chats WHERE server_id = ? AND deleted_at IS NULL`,
      [serverId]
    )

    if (existing && existing.id !== localId) {
      // Merge local duplicate into existing server-backed chat
      await this.db.runAsync(
        `UPDATE messages SET chat_id = ? WHERE chat_id = ?`,
        [existing.id, localId]
      )

      const latestMessage = await this.db.getFirstAsync<{
        content: string | null
        type: string | null
        created_at: string | null
      }>(
        `SELECT content, type, created_at
         FROM messages
         WHERE chat_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [existing.id]
      )

      if (latestMessage) {
        await this.db.runAsync(
          `UPDATE chats SET
             last_message_content = ?,
             last_message_type = ?,
             last_message_timestamp = ?,
             updated_at = ?
           WHERE id = ?`,
          [
            latestMessage.content ?? null,
            latestMessage.type ?? null,
            latestMessage.created_at ?? null,
            getTimestamp(),
            existing.id,
          ]
        )
      }

      await this.db.runAsync(
        `DELETE FROM chats WHERE id = ?`,
        [localId]
      )
      return
    }

    await this.db.runAsync(
      `UPDATE chats SET server_id = ?, sync_status = 'synced' WHERE id = ?`,
      [serverId, localId]
    )
  }

  /**
   * Upsert a chat from server data (for sync)
   */
  async upsertFromServer(serverChat: {
    _id: string
    name: string
    icon?: string
    isPinned: boolean
    wallpaper?: string
    lastMessage?: {
      content: string
      type: MessageType
      timestamp: string
    }
    createdAt: string
    updatedAt: string
  }): Promise<void> {
    const existing = await this.getByServerId(serverChat._id)

    if (existing) {
      // Update existing
      await this.db.runAsync(
        `UPDATE chats SET
           name = ?, icon = ?, is_pinned = ?, wallpaper = ?,
           last_message_content = ?, last_message_type = ?, last_message_timestamp = ?,
           sync_status = 'synced', updated_at = ?
         WHERE server_id = ?`,
        [
          serverChat.name,
          serverChat.icon ?? null,
          fromBoolean(serverChat.isPinned),
          serverChat.wallpaper ?? null,
          serverChat.lastMessage?.content ?? null,
          serverChat.lastMessage?.type ?? null,
          serverChat.lastMessage?.timestamp ?? null,
          serverChat.updatedAt,
          serverChat._id,
        ]
      )
    } else {
      // Insert new
      const id = generateUUID()
      await this.db.runAsync(
        `INSERT INTO chats (
           id, server_id, name, icon, is_pinned, wallpaper,
           last_message_content, last_message_type, last_message_timestamp,
           sync_status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [
          id,
          serverChat._id,
          serverChat.name,
          serverChat.icon ?? null,
          fromBoolean(serverChat.isPinned),
          serverChat.wallpaper ?? null,
          serverChat.lastMessage?.content ?? null,
          serverChat.lastMessage?.type ?? null,
          serverChat.lastMessage?.timestamp ?? null,
          serverChat.createdAt,
          serverChat.updatedAt,
        ]
      )
    }
  }

  /**
   * Map database row to ChatWithLastMessage
   */
  private mapToChat(row: ChatRow): ChatWithLastMessage {
    return {
      id: row.id,
      serverId: row.server_id,
      name: row.name,
      icon: row.icon,
      isPinned: toBoolean(row.is_pinned),
      wallpaper: row.wallpaper,
      lastMessage:
        row.last_message_content || row.last_message_type
          ? {
              content: row.last_message_content ?? '',
              type: (row.last_message_type as MessageType) ?? 'text',
              timestamp: row.last_message_timestamp ?? row.updated_at,
            }
          : null,
      syncStatus: row.sync_status as SyncStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

// Singleton instance holder
let chatRepositoryInstance: ChatRepository | null = null

/**
 * Get or create ChatRepository instance
 */
export function getChatRepository(db: SQLiteDatabase): ChatRepository {
  if (!chatRepositoryInstance) {
    chatRepositoryInstance = new ChatRepository(db)
  }
  return chatRepositoryInstance
}
