/** Dev keeps short intervals; production uses 15–30s to reduce server load. */

export function getPollInterval(devMs: number, prodMs: number): number {
  return import.meta.env.PROD ? prodMs : devMs
}

export const POLL = {
  changeDetection: () => getPollInterval(5000, 20000),
  authSession: () => getPollInterval(8000, 30000),
  listRefresh: () => getPollInterval(15000, 30000),
  detailRefresh: () => getPollInterval(10000, 20000),
  chatRefresh: () => getPollInterval(15000, 30000),
} as const
