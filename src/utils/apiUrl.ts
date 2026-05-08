/**
 * Get the API base URL, automatically detecting LAN IP if accessing via LAN
 * If accessing via localhost, returns localhost:3000
 * If accessing via LAN IP (e.g., 192.168.1.124:5173), returns same IP:3000
 * If accessing via production domain, uses environment variable or same domain
 */
export function getApiBaseUrl(): string {
  // Use environment variable if set (for production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Auto-detect from current location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const port = '3000'
    
    // Production domain - use same domain with /api path
    if (hostname === 'growattvietnam.com' || hostname === 'www.growattvietnam.com') {
      return `${protocol}//${hostname}/api`
    }
    
    // If accessing via IP address (LAN), use same IP for backend
    // Always use port 3000 for backend, regardless of frontend port
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Check if it's an IP address (contains numbers and dots)
      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        // Ensure we use the hostname (IP) with backend port 3000
        return `http://${hostname}:${port}`
      }
      // For other domains (dev/staging), use same domain with /api
      return `${protocol}//${hostname}/api`
    }
  }
  
  // Default to localhost
  return 'http://localhost:3000'
}

/**
 * Get the API base URL without /api suffix
 * Useful for direct file access URLs
 */
export function getApiBaseUrlWithoutApi(): string {
  const baseUrl = getApiBaseUrl()
  // Remove /api if present
  return baseUrl.replace(/\/api\/?$/, '')
}
