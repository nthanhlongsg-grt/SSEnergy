/**
 * Database Console - Interactive tool to query and modify database
 * 
 * Usage:
 * npm run db:console
 * 
 * Or with custom query:
 * npm run db:console -- "SELECT * FROM users"
 */

import db from '../src/database/db.js'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'SQL> ',
})

console.log('🗄️  Database Console')
console.log('Type SQL queries or commands:')
console.log('  - Type "exit" or "quit" to exit')
console.log('  - Type "tables" to list all tables')
console.log('  - Type "schema <table_name>" to view table schema')
console.log('  - Type "help" for more info\n')

const showTables = () => {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as Array<{ name: string }>
  
  console.log('\n📋 Tables:')
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number }
    console.log(`  - ${table.name} (${count.count} rows)`)
  })
  console.log('')
}

const showSchema = (tableName: string) => {
  try {
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all()
    console.log(`\n📐 Schema for "${tableName}":`)
    console.table(schema)
    console.log('')
  } catch (error) {
    console.error(`❌ Error: Table "${tableName}" does not exist\n`)
  }
}

const executeQuery = (query: string) => {
  query = query.trim()
  
  if (!query) return
  
  // Handle special commands
  if (query.toLowerCase() === 'tables' || query.toLowerCase() === 'show tables') {
    showTables()
    return
  }
  
  if (query.toLowerCase().startsWith('schema ')) {
    const tableName = query.split(' ')[1]
    showSchema(tableName)
    return
  }
  
  if (query.toLowerCase() === 'help') {
    console.log(`
📖 Help:
  - SELECT queries: Returns all matching rows
  - INSERT/UPDATE/DELETE: Executes modification
  - PRAGMA commands: Database metadata queries
  - DROP/ALTER: Schema modifications
  
⚠️  Warning: Be careful with DELETE, DROP, and ALTER commands!
`)
    return
  }
  
  try {
    // Check if it's a SELECT query (read-only)
    const isSelect = query.trim().toUpperCase().startsWith('SELECT')
    
    if (isSelect) {
      const result = db.prepare(query).all()
      if (result.length === 0) {
        console.log('No results found\n')
      } else {
        console.table(result)
        console.log(`\n${result.length} row(s) returned\n`)
      }
    } else {
      // Execute write query
      const result = db.prepare(query).run()
      console.log(`✅ Query executed successfully`)
      if ('changes' in result) {
        console.log(`   Changes: ${result.changes} row(s) affected`)
      }
      if ('lastInsertRowid' in result && result.lastInsertRowid) {
        console.log(`   Last insert ID: ${result.lastInsertRowid}`)
      }
      console.log('')
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`)
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.length > 0) {
  const query = args.join(' ')
  executeQuery(query)
  db.close()
  process.exit(0)
}

// Interactive mode
rl.prompt()

rl.on('line', (input) => {
  const query = input.trim()
  
  if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
    console.log('👋 Goodbye!')
    db.close()
    rl.close()
    process.exit(0)
  }
  
  executeQuery(query)
  rl.prompt()
})

rl.on('close', () => {
  console.log('\n👋 Goodbye!')
  db.close()
  process.exit(0)
})


