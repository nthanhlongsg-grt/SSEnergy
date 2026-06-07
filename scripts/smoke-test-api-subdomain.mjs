const baseUrl = process.argv[2] || 'https://baohanh.sgesolartech.vn'

const checks = ['/health', '/api/health']

const run = async () => {
  let failed = false

  for (const path of checks) {
    const url = `${baseUrl}${path}`
    try {
      const response = await fetch(url, { method: 'GET' })
      if (!response.ok) {
        failed = true
        console.error(`FAIL ${url} -> HTTP ${response.status}`)
        continue
      }

      const body = await response.json()
      if (body?.status !== 'ok') {
        failed = true
        console.error(`FAIL ${url} -> unexpected body: ${JSON.stringify(body)}`)
        continue
      }

      console.log(`OK   ${url}`)
    } catch (error) {
      failed = true
      console.error(`FAIL ${url} -> ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (failed) {
    process.exit(1)
  }
}

run()
