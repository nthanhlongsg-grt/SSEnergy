/**
 * API server origin (no /api suffix).
 * Callers append `/api/...` themselves (see services/api.ts).
 */

const DEFAULT_DEV_ORIGIN = 'http://localhost:3000'

/** Exact hostnames that serve SPA + /api on the same origin (reverse proxy). */
const SAME_ORIGIN_API_HOSTS = new Set([
  'baohanh.sgesolartech.vn',
  'sgesolartech.vn',
  'www.sgesolartech.vn',
  'SSEvietnam.com',
  'www.SSEvietnam.com',
])

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

function isSameOriginApiHost(hostname: string): boolean {
  if (SAME_ORIGIN_API_HOSTS.has(hostname)) return true
  return hostname.endsWith('.sgesolartech.vn')
}

/** Normalize VITE_API_URL / auto-detected URLs — always return origin without /api. */
export function normalizeApiOrigin(url: string): string {
  const trimmed = stripTrailingSlash(url.trim())
  return trimmed.replace(/\/api\/?$/i, '')
}

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return normalizeApiOrigin(String(import.meta.env.VITE_API_URL))
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location

    if (isSameOriginApiHost(hostname)) {
      return `${protocol}//${hostname}`
    }

    // LAN dev: backend on port 3000
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return `http://${hostname}:3000`
      }
      // HTTPS production custom domain — assume /api on same host
      if (protocol === 'https:') {
        return `${protocol}//${hostname}`
      }
    }
  }

  return DEFAULT_DEV_ORIGIN
}

/** Origin for static uploads / file URLs (same as API server). */
export function getApiBaseUrlWithoutApi(): string {
  return getApiBaseUrl()
}
