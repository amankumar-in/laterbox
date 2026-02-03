import type { SQLiteDatabase } from 'expo-sqlite'
import {
  generateUUID,
  getTimestamp,
  toBoolean,
  fromBoolean,
  type MessageRow,
  type MessageWithDetails,
  type CreateMessageInput,
  type UpdateMessageInput,
  type TaskInput,
  type SyncStatus,
  type MessageType,
  type PaginatedResult,
  type MessageCursor,
  type TaskFilter,
} from '../database'

export class MessageRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new message
   */
  async create(input: CreateMessageInput): Promise<MessageWithDetails> {
    const id = generateUUID()
    const now = getTimestamp()

    await this.db.runAsync(
      `INSERT INTO messages (
         id, chat_id, content, type,
         attachment_url, attachment_filename, attachment_mime_type,
         attachment_size, attachment_duration, attachment_thumbnail,
         attachment_width, attachment_height,
         location_latitude, location_longitude, location_address,
         sync_status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        id,
        input.chatId,
        input.content ?? null,
        input.type,
        input.attachment?.url ?? null,
        input.attachment?.filename ?? null,
        input.attachment?.mimeType ?? null,
        input.attachment?.size ?? null,
        input.attachment?.duration ?? null,
        input.attachment?.thumbnail ?? null,
        input.attachment?.width ?? null,
        input.attachment?.height ?? null,
        input.location?.latitude ?? null,
        input.location?.longitude ?? null,
        input.location?.address ?? null,
        now,
        now,
      ]
    )

    return this.getById(id) as Promise<MessageWithDetails>
  }

  /**
   * Get a message by local ID
   */
  async getById(id: string): Promise<MessageWithDetails | null> {
    const row = await this.db.getFirstAsync<MessageRow>(
      `SELECT m.*, c.name as chat_name
       FROM messages m
       LEFT JOIN chats c ON m.chat_id = c.id
       WHERE m.id = ? AND m.deleted_at IS NULL`,
      [id]
    )

    if (!row) return null
    return this.mapToMessage(row)
  }

  /**
   * Get a message by server ID
   */
  async getByServerId(serverId: string): Promise<MessageWithDetails | null> {
    const row = await this.db.getFirstAsync<MessageRow>(
      `SELECT m.*, c.name as chat_name
       FROM messages m
       LEFT JOIN chats c ON m.chat_id = c.id
       WHERE m.server_id = ? AND m.deleted_at IS NULL`,
      [serverId]
    )

    if (!row) return null
    return this.mapToMessage(row)
  }

  /**
   * Get messages for a chat with cursor-based pagination
   */
  async getByChat(
    chatId: string,
    cursor?: MessageCursor
  ): Promise<PaginatedResult<MessageWithDetails>> {
    const limit = cursor?.limit ?? 50

    let whereClause = 'WHERE m.chat_id = ? AND m.deleted_at IS NULL'
    const queryParams: (string | number)[] = [chatId]

    if (cursor?.before) {
      whereClause += ' AND m.created_at < ?'
      queryParams.push(cursor.before)
    }
    if (cursor?.after) {
      whereClause += ' AND m.created_at > ?'
      queryParams.push(cursor.after)
    }

    // Get total count for this chat
    const countResult = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages m ${whereClause}`,
      queryParams
    )
    const total = countResult?.count ?? 0

    // Get messages, newest first
    const rows = await this.db.getAllAsync<MessageRow>(
      `SELECT m.*, c.name as chat_name
       FROM messages m
       LEFT JOIN chats c ON m.chat_id = c.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [...queryParams, limit + 1] // Fetch one extra to check if there's more
    )

    const hasMore = rows.length > limit
    const messages = rows.slice(0, limit).map((row) => this.mapToMessage(row))

    return { data: messages, hasMore, total }
  }

  /**
   * Update a message
   */
  async update(id: string, input: UpdateMessageInput): Promise<MessageWithDetails | null> {
    const message = await this.getById(id)
    if (!message) return null

    const now = getTimestamp()

    await this.db.runAsync(
      `UPDATE messages SET content = ?, is_edited = 1, sync_status = 'pending', updated_at = ?
       WHERE id = ?`,
      [input.content ?? message.content, now, id]
    )

    return this.getById(id)
  }

  /**
   * Soft delete a message
   */
  async delete(id: string): Promise<void> {
    const now = getTimestamp()

    await this.db.runAsync(
      `UPDATE messages SET deleted_at = ?, sync_status = 'pending', updated_at = ?
       WHERE id = ?`,
      [now, now, id]
    )
  }

  /**
   * Toggle message lock status
   */
  async setLocked(id: string, isLocked: boolean): Promise<MessageWithDetails | null> {
    const now = getTimestamp()

    await this.db.runAsync(
      `UPDATE messages SET is_locked = ?, sync_status = 'pending', updated_at = ?
       WHERE id = ?`,
      [fromBoolean(isLocked), now, id]
    )

    return this.getById(id)
  }

  /**
   * Toggle message star status
   */
  async setStarred(id: string, isStarred: boolean): Promise<MessageWithDetails | null> {
    const now = getTimestamp()

    await this.db.runAsync(
      `UPDATE messages SET is_starred = ?, sync_status = 'pending', updated_at = ?
       WHERE id = ?`,
      [fromBoolean(isStarred), now, id]
    )

    return this.getById(id)
  }

  /**
   * Set task properties on a message
   */
  async setTask(id: string, input: TaskInput): Promise<MessageWithDetails | null> {
    const now = getTimestamp()

    await this.db.runAsync(
      `UPDATE messages SET
         is_task = ?,
         reminder_at = ?,
         is_completed = ?,
         completed_at = ?,
         sync_status = 'pending',
         updated_at = ?
       WHERE id = ?`,
      [
        fromBoolean(input.isTask),
        input.reminderAt ?? null,
        fromBoolean(input.isCompleted ?? false),
        input.isCompleted ? now : null,
        now,
        id,
      ]
    )

    return this.getById(id)
  }

  /**
   * Complete a task
   */
  async completeTask(id: string): Promise<MessageWithDetails | null> {
    const now = getTimestamp()

    await this.db.runAsync(
      `UPDATE messages SET
         is_completed = 1,
         completed_at = ?,
         sync_status = 'pending',
         updated_at = ?
       WHERE id = ?`,
      [now, now, id]
    )

    return this.getById(id)
  }

  /**
   * Get tasks with optional filtering
   */
  async getTasks(params?: {
    filter?: TaskFilter
    chatId?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResult<MessageWithDetails>> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const offset = (page - 1) * limit
    const filter = params?.filter ?? 'all'

    let whereClause = 'WHERE m.is_task = 1 AND m.deleted_at IS NULL'
    const queryParams: (string | number)[] = []

    if (params?.chatId) {
      whereClause += ' AND m.chat_id = ?'
      queryParams.push(params.chatId)
    }

    const now = new Date().toISOString()

    switch (filter) {
      case 'pending':
        whereClause += ' AND m.is_completed = 0'
        break
      case 'completed':
        whereClause += ' AND m.is_completed = 1'
        break
      case 'overdue':
        whereClause += ' AND m.is_completed = 0 AND m.reminder_at IS NOT NULL AND m.reminder_at < ?'
        queryParams.push(now)
        break
      // 'all' - no additional filter
    }

    // Get total count
    const countResult = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages m ${whereClause}`,
      queryParams
    )
    const total = countResult?.count ?? 0

    // Get paginated results, ordered by reminder date then created date
    const rows = await this.db.getAllAsync<MessageRow>(
      `SELECT m.*, c.name as chat_name
       FROM messages m
       LEFT JOIN chats c ON m.chat_id = c.id
       ${whereClause}
       ORDER BY
         m.is_completed ASC,
         CASE WHEN m.reminder_at IS NOT NULL THEN 0 ELSE 1 END,
         m.reminder_at ASC,
         m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    const tasks = rows.map((row) => this.mapToMessage(row))
    const hasMore = offset + rows.length < total

    return { data: tasks, hasMore, total }
  }

  /**
   * Get upcoming tasks within a number of days
   */
  async getUpcomingTasks(days: number = 7): Promise<MessageWithDetails[]> {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const rows = await this.db.getAllAsync<MessageRow>(
      `SELECT m.*, c.name as chat_name
       FROM messages m
       LEFT JOIN chats c ON m.chat_id = c.id
       WHERE m.is_task = 1
         AND m.is_completed = 0
         AND m.deleted_at IS NULL
         AND m.reminder_at IS NOT NULL
         AND m.reminder_at <= ?
       ORDER BY m.reminder_at ASC`,
      [futureDate.toISOString()]
    )

    return rows.map((row) => this.mapToMessage(row))
  }

  /**
   * Full-text search across messages
   */
  async search(params: {
    query: string
    chatId?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResult<MessageWithDetails>> {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const offset = (page - 1) * limit

    // Prepare FTS query - escape special characters and add prefix matching
    const ftsQuery = params.query
      .trim()
      .split(/\s+/)
      .map((term) => `"${term}"*`)
      .join(' ')

    let whereClause = ''
    const queryParams: (string | number)[] = [ftsQuery]

    if (params.chatId) {
      whereClause = 'AND fts.chat_id = ?'
      queryParams.push(params.chatId)
    }

    // Get total count
    const countResult = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM messages_fts fts
       JOIN messages m ON fts.id = m.id
       WHERE messages_fts MATCH ? ${whereClause} AND m.deleted_at IS NULL`,
      queryParams
    )
    const total = countResult?.count ?? 0

    // Get paginated results
    const rows = await this.db.getAllAsync<MessageRow>(
      `SELECT m.*, c.name as chat_name
       FROM messages_fts fts
       JOIN messages m ON fts.id = m.id
       LEFT JOIN chats c ON m.chat_id = c.id
       WHERE messages_fts MATCH ? ${whereClause} AND m.deleted_at IS NULL
       ORDER BY rank
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    const messages = rows.map((row) => this.mapToMessage(row))
    const hasMore = offset + rows.length < total

    return { data: messages, hasMore, total }
  }

  /**
   * Search within a specific chat
   */
  async searchInChat(
    chatId: string,
    query: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResult<MessageWithDetails>> {
    return this.search({
      query,
      chatId,
      page: params?.page,
      limit: params?.limit,
    })
  }

  /**
   * Get messages with pending sync status
   */
  async getPendingSync(): Promise<MessageRow[]> {
    return this.db.getAllAsync<MessageRow>(
      `SELECT * FROM messages WHERE sync_status = 'pending'`
    )
  }

  /**
   * Mark a message as synced with server ID
   */
  async markSynced(localId: string, serverId: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE messages SET server_id = ?, sync_status = 'synced' WHERE id = ?`,
      [serverId, localId]
    )
  }

  /**
   * Upsert a message from server data (for sync)
   */
  async upsertFromServer(
    chatLocalId: string,
    serverMessage: {
      _id: string
      content?: string
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
      }
      location?: {
        latitude: number
        longitude: number
        address?: string
      }
      isLocked: boolean
      isStarred: boolean
      isEdited: boolean
      isDeleted: boolean
      task: {
        isTask: boolean
        reminderAt?: string
        isCompleted: boolean
        completedAt?: string
      }
      createdAt: string
      updatedAt: string
    }
  ): Promise<void> {
    const existing = await this.getByServerId(serverMessage._id)

    if (serverMessage.isDeleted) {
      // If deleted on server, soft delete locally
      if (existing) {
        await this.db.runAsync(
          `UPDATE messages SET deleted_at = ?, sync_status = 'synced' WHERE server_id = ?`,
          [serverMessage.updatedAt, serverMessage._id]
        )
      }
      return
    }

    if (existing) {
      // Update existing
      await this.db.runAsync(
        `UPDATE messages SET
           content = ?, type = ?,
           attachment_url = ?, attachment_filename = ?, attachment_mime_type = ?,
           attachment_size = ?, attachment_duration = ?, attachment_thumbnail = ?,
           attachment_width = ?, attachment_height = ?,
           location_latitude = ?, location_longitude = ?, location_address = ?,
           is_locked = ?, is_starred = ?, is_edited = ?,
           is_task = ?, reminder_at = ?, is_completed = ?, completed_at = ?,
           sync_status = 'synced', updated_at = ?
         WHERE server_id = ?`,
        [
          serverMessage.content ?? null,
          serverMessage.type,
          serverMessage.attachment?.url ?? null,
          serverMessage.attachment?.filename ?? null,
          serverMessage.attachment?.mimeType ?? null,
          serverMessage.attachment?.size ?? null,
          serverMessage.attachment?.duration ?? null,
          serverMessage.attachment?.thumbnail ?? null,
          serverMessage.attachment?.width ?? null,
          serverMessage.attachment?.height ?? null,
          serverMessage.location?.latitude ?? null,
          serverMessage.location?.longitude ?? null,
          serverMessage.location?.address ?? null,
          fromBoolean(serverMessage.isLocked),
          fromBoolean(serverMessage.isStarred),
          fromBoolean(serverMessage.isEdited),
          fromBoolean(serverMessage.task.isTask),
          serverMessage.task.reminderAt ?? null,
          fromBoolean(serverMessage.task.isCompleted),
          serverMessage.task.completedAt ?? null,
          serverMessage.updatedAt,
          serverMessage._id,
        ]
      )
    } else {
      // Insert new
      const id = generateUUID()
      await this.db.runAsync(
        `INSERT INTO messages (
           id, server_id, chat_id, content, type,
           attachment_url, attachment_filename, attachment_mime_type,
           attachment_size, attachment_duration, attachment_thumbnail,
           attachment_width, attachment_height,
           location_latitude, location_longitude, location_address,
           is_locked, is_starred, is_edited,
           is_task, reminder_at, is_completed, completed_at,
           sync_status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [
          id,
          serverMessage._id,
          chatLocalId,
          serverMessage.content ?? null,
          serverMessage.type,
          serverMessage.attachment?.url ?? null,
          serverMessage.attachment?.filename ?? null,
          serverMessage.attachment?.mimeType ?? null,
          serverMessage.attachment?.size ?? null,
          serverMessage.attachment?.duration ?? null,
          serverMessage.attachment?.thumbnail ?? null,
          serverMessage.attachment?.width ?? null,
          serverMessage.attachment?.height ?? null,
          serverMessage.location?.latitude ?? null,
          serverMessage.location?.longitude ?? null,
          serverMessage.location?.address ?? null,
          fromBoolean(serverMessage.isLocked),
          fromBoolean(serverMessage.isStarred),
          fromBoolean(serverMessage.isEdited),
          fromBoolean(serverMessage.task.isTask),
          serverMessage.task.reminderAt ?? null,
          fromBoolean(serverMessage.task.isCompleted),
          serverMessage.task.completedAt ?? null,
          serverMessage.createdAt,
          serverMessage.updatedAt,
        ]
      )
    }
  }

  /**
   * Map database row to MessageWithDetails
   */
  private mapToMessage(row: MessageRow): MessageWithDetails {
    return {
      id: row.id,
      serverId: row.server_id,
      chatId: row.chat_id,
      chatName: row.chat_name,
      content: row.content,
      type: row.type as MessageType,
      attachment:
        row.attachment_url
          ? {
              url: row.attachment_url,
              filename: row.attachment_filename ?? undefined,
              mimeType: row.attachment_mime_type ?? undefined,
              size: row.attachment_size ?? undefined,
              duration: row.attachment_duration ?? undefined,
              thumbnail: row.attachment_thumbnail ?? undefined,
              width: row.attachment_width ?? undefined,
              height: row.attachment_height ?? undefined,
            }
          : null,
      location:
        row.location_latitude !== null && row.location_longitude !== null
          ? {
              latitude: row.location_latitude,
              longitude: row.location_longitude,
              address: row.location_address ?? undefined,
            }
          : null,
      isLocked: toBoolean(row.is_locked),
      isStarred: toBoolean(row.is_starred),
      isEdited: toBoolean(row.is_edited),
      task: {
        isTask: toBoolean(row.is_task),
        reminderAt: row.reminder_at ?? undefined,
        isCompleted: toBoolean(row.is_completed),
        completedAt: row.completed_at ?? undefined,
      },
      syncStatus: row.sync_status as SyncStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

// Singleton instance holder
let messageRepositoryInstance: MessageRepository | null = null

/**
 * Get or create MessageRepository instance
 */
export function getMessageRepository(db: SQLiteDatabase): MessageRepository {
  if (!messageRepositoryInstance) {
    messageRepositoryInstance = new MessageRepository(db)
  }
  return messageRepositoryInstance
}
