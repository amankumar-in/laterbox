import React, { createContext, useContext, useEffect, useState } from 'react'
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite'
import { initializeDatabase, DATABASE_NAME } from '@/services/database'

// Context for database-ready state
interface DatabaseContextValue {
  isReady: boolean
  db: SQLiteDatabase | null
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isReady: false,
  db: null,
})

/**
 * Hook to access the database context
 */
export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext)
}

/**
 * Hook to access SQLite database directly
 * Must be used within DatabaseProvider
 */
export function useDb(): SQLiteDatabase {
  const db = useSQLiteContext()
  return db
}

/**
 * Inner provider that sets database ready state after SQLite is initialized
 */
function DatabaseReadyProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Database is ready once we have the context
    setIsReady(true)
  }, [db])

  return (
    <DatabaseContext.Provider value={{ isReady, db }}>
      {children}
    </DatabaseContext.Provider>
  )
}

interface DatabaseProviderProps {
  children: React.ReactNode
}

/**
 * Database provider component
 * Wraps the app with SQLiteProvider and manages database state
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      <DatabaseReadyProvider>{children}</DatabaseReadyProvider>
    </SQLiteProvider>
  )
}
