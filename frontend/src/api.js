// Small API client. The session id lives in sessionStorage so the token budget is per browser tab.
export const SESSION_ID = (() => {
  let id = sessionStorage.getItem('hc-session')
  if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2); sessionStorage.setItem('hc-session', id) }
  return id
})()

const headers = { 'Content-Type': 'application/json', 'X-Session-Id': SESSION_ID }

export async function getJSON(path) {
  const r = await fetch(path, { headers })
  if (!r.ok) throw new Error(`${r.status} ${path}`)
  return r.json()
}

export async function resetSession() {
  return (await fetch('/api/session/reset', { method: 'POST', headers })).json()
}

// Streams NDJSON events from the multi-agent pipeline: step / tool / safety / result / error.
export async function runCopilot({ message, dataset, redteam, lang }, onEvent) {
  const r = await fetch('/api/copilot', { method: 'POST', headers, body: JSON.stringify({ message, dataset, redteam, lang }) })
  const reader = r.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
      if (line) onEvent(JSON.parse(line))
    }
  }
}

export const fmtUSD = (n, d = 6) => (n == null ? '—' : '$' + Number(n).toFixed(d))
export const fmtInt = (n) => (n == null ? '—' : Number(n).toLocaleString())
