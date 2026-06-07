/**
 * Centralized env access for server runtime.
 */

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim() === '' || secret === 'your-super-secret-jwt-key-change-this-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production')
    }
    return 'dev-insecure-jwt-secret'
  }
  return secret
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d'
}
