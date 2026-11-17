import { useEffect, useState } from 'react'
import { Vignette } from './Illustrations.jsx'

export function ModuleHeader({ kind, eyebrow, title, children }) {
  return (
    <header className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
      <div className="flex-1">
        <p className="label mb-2">{eyebrow}</p>
        <h2 className="font-display text-4xl md:text-5xl text-navy leading-tight">{title}</h2>
        {children && <p className="mt-3 text-lg text-ink/90 max-w-3xl leading-relaxed">{children}</p>}
      </div>
      <Vignette kind={kind} />
    </header>
  )
}

export function Chips({ options, value, onChange, multi = false, label }) {
  const on = (v) => (multi ? value.includes(v) : value === v)
  const toggle = (v) => {
    if (multi) onChange(on(v) ? value.filter((x) => x !== v) : [...value, v])
    else onChange(on(v) ? null : v)
  }
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={on(v)} onClick={() => toggle(v)} className={`chip ${on(v) ? 'chip-on' : 'chip-off'}`}>{text}</button>
      ))}
    </div>
  )
}

export function Select({ value, onChange, options, label, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label block mb-1">{label}</span>
      <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  )
}

export function Pill({ children, tone = 'forest' }) {
  const tones = {
    forest: 'bg-forest/10 text-forest', gold: 'bg-marigold-soft text-navy', terra: 'bg-terracotta-soft text-terracotta-ink',
    sky: 'bg-sky-soft text-sky-ink', navy: 'bg-navy text-cream',
  }
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function CopyButton({ text, label = 'Copy' }) {
  return (
    <button type="button" className="btn-ghost !py-1.5 !px-3 text-sm" onClick={(e) => {
      navigator.clipboard?.writeText(text); const b = e.currentTarget; const t = b.textContent; b.textContent = 'Copied ✓'; setTimeout(() => (b.textContent = t), 1400)
    }}>{label}</button>
  )
}

export function ScoreBar({ label, value }) {
  const color = value >= 80 ? '#1F4D3A' : value >= 65 ? '#4A90C2' : value >= 50 ? '#E8A317' : '#C8553D'
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}</span></div>
      <div className="h-2.5 rounded-full bg-cream-2 overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} /></div>
    </div>
  )
}

// Tiny, safe markdown: escapes HTML, then supports ### headings, - bullets, **bold**, *italic*, [source-id] chips.
export function Markdown({ text = '' }) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([a-z0-9-]{3,60})\]/g, '<span class="inline-block rounded-full bg-dodger-soft text-dodger-ink text-xs font-semibold px-2 py-0.5 align-middle">$1</span>')
  const html = []
  let list = false
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (/^[-*•]\s+/.test(line)) { if (!list) { html.push('<ul>'); list = true } html.push(`<li>${inline(line.replace(/^[-*•]\s+/, ''))}</li>`); continue }
    if (list) { html.push('</ul>'); list = false }
    if (!line) continue
    if (/^#{1,4}\s/.test(line)) html.push(`<h3>${inline(line.replace(/^#{1,4}\s/, ''))}</h3>`)
    else html.push(`<p>${inline(line)}</p>`)
  }
  if (list) html.push('</ul>')
  return <div className="prose-joy" dangerouslySetInnerHTML={{ __html: html.join('') }} />
}

export const BUDGET_LABELS = { free: 'Free', under25: 'Under $25', under50: 'Under $50', under100: 'Under $100', over100: 'Over $100' }
export const ACCESS_LABELS = { wheelchair: '♿ Wheelchair', cane: '🦯 Cane', walker: '🚶 Walker', vision: '👁️ Vision', hearing: '🦻 Hearing' }
export const AGE_LABELS = { '0-5': 'Ages 0–5', '6-12': 'Ages 6–12', '13-17': 'Ages 13–17', '18-21': 'Ages 18–21' }
export const SPECIALTY_LABELS = { pediatrician: 'Pediatrician', physiatrist: 'Physiatrist (PM&R)', physical_therapist: 'Physical Therapist', occupational_therapist: 'Occupational Therapist', orthotist: 'Orthotist' }
export const pretty = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bPe\b/, 'PE').replace(/\bIep\b/, 'IEP')

// ---- outbound links -------------------------------------------------------------------
export const searchUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`
export const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

/* Website buttons for any listing:
   - real url            → "Visit website"
   - real org, no url    → "Find their website" (web search for the exact name)
   - sample listing      → "Find similar near {place}" (a search for real local options, never a fake site) */
export function WebLinks({ url, name, real = false, similar, place, map, label, className = '' }) {
  const a = 'inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-semibold transition'
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {url ? (
        <a className={`${a} bg-forest text-cream hover:bg-forest-2`} href={url} target="_blank" rel="noopener noreferrer">{label || 'Visit website'} ↗</a>
      ) : real ? (
        <a className={`${a} bg-forest text-cream hover:bg-forest-2`} href={searchUrl(name)} target="_blank" rel="noopener noreferrer">{label || 'Find their website'} ↗</a>
      ) : (
        <a className={`${a} bg-dodger-soft text-dodger-ink hover:underline`} href={searchUrl(similar || `${name} ${place || ''}`)} target="_blank" rel="noopener noreferrer">{label ? `${label} ↗` : similar ? `Find similar${place ? ' near ' + place : ''} ↗` : 'Search the web ↗'}</a>
      )}
      {map && <a className={`${a} bg-white text-navy border border-sand hover:border-forest`} href={mapsUrl(map)} target="_blank" rel="noopener noreferrer">📍 Map it ↗</a>}
    </div>
  )
}

// Bottom sheet on phones, centered dialog on larger screens.
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-navy/45" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="w-full md:max-w-2xl max-h-[92vh] overflow-y-auto bg-cream rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl anim-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end -mt-2 -mr-2"><button onClick={onClose} className="w-10 h-10 rounded-full bg-cream-2 text-2xl leading-none" aria-label="Close details">×</button></div>
        {children}
      </div>
    </div>
  )
}

// Long hint text gets cut off on phones, so anything narrower than a wide laptop gets a shorter example list.
export function useWide(query = '(min-width: 1280px)') {
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const f = () => setWide(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [query])
  return wide
}
