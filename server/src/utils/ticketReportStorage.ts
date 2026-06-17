import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function getReportsDir(): string {
  return path.resolve(__dirname, '../../reports')
}

export function findReportFilename(ticketId: number, storedFilename?: string | null): string | null {
  const reportsDir = getReportsDir()
  if (storedFilename) {
    const storedPath = path.join(reportsDir, storedFilename)
    if (fs.existsSync(storedPath)) return storedFilename
  }

  if (!fs.existsSync(reportsDir)) return null

  const suffix = `-${ticketId}.html`
  const matches = fs
    .readdirSync(reportsDir)
    .filter((name) => name.startsWith('REPORT-') && name.endsWith(suffix))

  if (matches.length === 0) return null

  matches.sort((a, b) => {
    const aStat = fs.statSync(path.join(reportsDir, a))
    const bStat = fs.statSync(path.join(reportsDir, b))
    return bStat.mtimeMs - aStat.mtimeMs
  })

  return matches[0] ?? null
}

export function getTicketReportUrl(ticketId: number, storedFilename?: string | null): string | null {
  const filename = findReportFilename(ticketId, storedFilename)
  return filename ? `/api/tickets/reports/${filename}` : null
}

export function saveTicketReportHtml(
  ticketId: number,
  html: string,
): { reportId: string; filename: string; url: string } {
  const reportsDir = getReportsDir()
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const reportId = `REPORT-${Date.now()}-${ticketId}`
  const filename = `${reportId}.html`
  fs.writeFileSync(path.join(reportsDir, filename), html, 'utf8')

  return {
    reportId,
    filename,
    url: `/api/tickets/reports/${filename}`,
  }
}
