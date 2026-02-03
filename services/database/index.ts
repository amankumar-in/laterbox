// Database initialization and migration utilities
import type { SQLiteDatabase } from 'expo-sqlite'
import { DATABASE_VERSION, SCHEMA_V1, MIGRATIONS } from './schema'

/**
 * Initialize the database with schema and run migrations
 * This is called by SQLiteProvider's onInit callback
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  // Get current database version
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  )
  let currentVersion = result?.user_version ?? 0

  // Fresh database - create initial schema
  if (currentVersion === 0) {
    await db.execAsync(SCHEMA_V1)
    currentVersion = 1
  }

  // Run any pending migrations
  while (currentVersion < DATABASE_VERSION) {
    const nextVersion = currentVersion + 1
    const migration = MIGRATIONS[nextVersion]

    if (migration) {
      await db.execAsync(migration)
    }

    currentVersion = nextVersion
  }

  // Update the database version
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`)
}

/**
 * Generate a UUID v4 for local entity IDs
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get current ISO timestamp
 */
export function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Convert SQLite integer (0/1) to boolean
 */
export function toBoolean(value: number | null | undefined): boolean {
  return value === 1
}

/**
 * Convert boolean to SQLite integer (0/1)
 */
export function fromBoolean(value: boolean | undefined | null): number {
  return value ? 1 : 0
}

// Re-export types and constants
export * from './types'
export * from './schema'
