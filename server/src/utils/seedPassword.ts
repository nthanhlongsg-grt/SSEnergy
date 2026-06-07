/** Dev/demo seed scripts must read passwords from env — never commit real credentials. */
export function requireSeedPassword(label = 'DEV_SEED_PASSWORD'): string {
  const password = process.env[label] || process.env.DEV_SEED_PASSWORD
  if (!password || password.trim().length < 8) {
    console.error(`❌ Set ${label} (min 8 characters) before running this script.`)
    console.error('   Example: DEV_SEED_PASSWORD=your-local-only-password npm run db:seed')
    process.exit(1)
  }
  return password.trim()
}
