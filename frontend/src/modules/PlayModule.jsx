import { useEffect, useMemo, useState } from 'react'
import { ModuleHeader, Chips, Select, Pill, WebLinks, Sheet, ACCESS_LABELS, AGE_LABELS, BUDGET_LABELS, pretty } from '../components/ui.jsx'

const ORDER = ['free', 'under25', 'under50', 'under100', 'over100']
const fitsBudget = (tier, cap) => !cap || (cap === 'over100' ? tier === 'over100' : ORDER.indexOf(tier) <= ORDER.indexOf(cap))
const CAT_EMOJI = { adaptive_sports: '🏀', sensory_friendly_museum: '🖼️', accessible_trail: '🌲', inclusive_splash_pad: '💦', adaptive_arts: '🎨', inclusive_playground: '🛝', zoo_aquarium: '🐢', library_storytime: '📖', music_dance: '🎶', adaptive_recreation: '🛶' }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES = { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' }
const t12 = (hm) => { const [h, m] = hm.split(':').map(Number); return `${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}` }
const fmtDays = (d) => (d.length === 7 ? 'Every day' : d.length === 2 && d.includes('Sat') && d.includes('Sun') ? 'Weekends' : d.map((x) => DAY_NAMES[x]).join(', '))
export const whenText = (a) => (a.schedule ? `${fmtDays(a.schedule.days)} · ${t12(a.schedule.start)}–${t12(a.schedule.end)}` : a.best_time)
const whereText = (a) => [a.venue, a.neighborhood, `${a.city}, ${a.state}`].filter(Boolean).join(' · ')

// Download an .ics file for the next date this activity happens (works with Apple, Google and Outlook calendars).
function addToCalendar(a) {
  const s = a.schedule; if (!s) return
  const now = new Date(); const d = new Date(now)
  for (let i = 0; i < 8; i++) { d.setDate(now.getDate() + i); if (s.days.includes(DAYS[d.getDay()]) && (i > 0 || `${now.getHours()}`.padStart(2, '0') + ':00' < s.start)) break }
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const esc = (t) => String(t).replace(/[,;\\]/g, (c) => '\\' + c).replace(/\n/g, ' ')
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Joy Risers//EN', 'BEGIN:VEVENT', `UID:${a.id}-${ymd}@joyrisers`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`, `DTSTART:${ymd}T${s.start.replace(':', '')}00`, `DTEND:${ymd}T${s.end.replace(':', '')}00`,
    `SUMMARY:${esc(a.name)}`, `LOCATION:${esc(whereText(a))}`, `DESCRIPTION:${esc(`${a.price_note}. ${a.how_to_join || ''} Confirm details before you go.`)}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const link = document.createElement('a'); link.href = url; link.download = `${a.name.replace(/[^a-z0-9]+/gi, '-')}.ics`; link.click(); URL.revokeObjectURL(url)
}

function DetailStrip({ a }) {
  return (
    <dl className="mt-3 rounded-2xl bg-cream-2 p-3 text-[15px] space-y-1.5">
      <div className="flex gap-2"><dt aria-label="When">🕒</dt><dd><strong>{whenText(a)}</strong>{a.schedule?.season && a.schedule.season !== 'Year-round' && <span className="text-ink/80"> · {a.schedule.season}</span>}</dd></div>
      <div className="flex gap-2"><dt aria-label="Where">📍</dt><dd>{whereText(a)}</dd></div>
      <div className="flex gap-2"><dt aria-label="Cost">💵</dt><dd>{a.price_note}</dd></div>
    </dl>
  )
}

const CHECKLIST = [
  'Call or email ahead: confirm the accessible entrance, elevator status and today’s hours',
  'Ask about accessible parking, drop-off and the nearest family restroom / adult-size changing table',
  'Charge the power chair or pack spare batteries; check the terrain (grass, gravel, boardwalk)',
  'Pack the comfort kit: water, snacks, sunscreen, ear defenders, sunglasses, a favorite fidget',
  'Ask about ASL interpreters, captioning, audio description or tactile options',
  'Pick a calm-down spot and an exit plan before you need them',
  'Bring meds, a med list and your child’s “All About Me” card',
  'Plan a caregiver break: who holds the bags while you sip a coffee?',
]

export default function PlayModule({ data, askCopilot, focus, clearFocus }) {
  const acts = data.activities.activities
  const [access, setAccess] = useState([])
  const [age, setAge] = useState(null)
  const [budget, setBudget] = useState(null)
  const [setting, setSetting] = useState(null)
  const [city, setCity] = useState(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  useEffect(() => { if (focus?.module === 'play') { const a = acts.find((x) => x.id === focus.id); if (a) setOpen(a); clearFocus() } }, [focus])
  const [checked, setChecked] = useState(() => JSON.parse(localStorage.getItem('jr-kbyg') || '[]'))
  const cities = useMemo(() => [...new Map(acts.map((a) => [a.hotspot_id, `${a.city}, ${a.state}`])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [acts])

  const rows = acts.filter((a) =>
    (!access.length || access.every((x) => a.access.includes(x))) && (!age || a.ages.includes(age)) &&
    fitsBudget(a.cost_tier, budget) && (!setting || a.setting === setting) && (!city || a.hotspot_id === city) &&
    (!q || `${a.name} ${a.description} ${a.category}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => ORDER.indexOf(a.cost_tier) - ORDER.indexOf(b.cost_tier))

  const toggle = (i) => { const n = checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i]; setChecked(n); localStorage.setItem('jr-kbyg', JSON.stringify(n)) }

  return (
    <div>
      <ModuleHeader kind="play" eyebrow="Module 2 · The Joy & Play Finder" title="Fun, free & affordable adventures">
        Adaptive sports, sensory-friendly museum hours, rollable trails, inclusive splash pads and adaptive arts, free and low-cost first.
      </ModuleHeader>

      <div className="card p-5 md:p-6 space-y-4">
        <div className="grid md:grid-cols-[1fr_220px_220px] gap-4">
          <label className="block"><span className="label block mb-1">Search</span><input className="input" placeholder="sled hockey, splash pad, audio-described…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <Select label="City" value={city} onChange={setCity} options={[['', 'Anywhere'], ...cities]} />
          <Select label="Setting" value={setting} onChange={setSetting} options={[['', 'Indoor, outdoor or hybrid'], ['indoor', 'Indoor'], ['outdoor', 'Outdoor'], ['hybrid', 'Hybrid']]} />
        </div>
        <div><p className="label mb-2">Mobility, vision or hearing aid</p><Chips multi label="Access needs" value={access} onChange={setAccess} options={Object.entries(ACCESS_LABELS)} /></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><p className="label mb-2">Age</p><Chips label="Age" value={age} onChange={setAge} options={Object.entries(AGE_LABELS)} /></div>
          <div><p className="label mb-2">Budget</p><Chips label="Budget" value={budget} onChange={setBudget} options={Object.entries(BUDGET_LABELS)} /></div>
        </div>
      </div>

      <p className="mt-6 mb-3 font-semibold text-navy" aria-live="polite">{rows.length} {rows.length === 1 ? 'adventure' : 'adventures'} found</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rows.map((a) => (
          <article key={a.id} className="card p-5 flex flex-col anim-pop">
            <div className="flex items-start gap-3">
              <span className="text-3xl" aria-hidden="true">{CAT_EMOJI[a.category] || '✨'}</span>
              <div className="flex-1">
                <h3 className="font-display text-xl text-navy leading-snug">{a.name}</h3>
                <p className="text-sm text-ink/80">{a.city}, {a.state} · {pretty(a.category)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {a.verified && <Pill tone="navy">✓ Verified</Pill>}
              <Pill tone={a.cost_tier === 'free' ? 'forest' : 'gold'}>{BUDGET_LABELS[a.cost_tier]}</Pill>
              <Pill tone="sky">{pretty(a.setting)}</Pill>
              {a.ages.map((x) => <Pill key={x} tone="navy">{x}</Pill>)}
            </div>
            <DetailStrip a={a} />
            <p className="mt-3 text-ink/90 flex-1">{a.description}</p>
            <ul className="mt-3 text-sm space-y-1">{a.accessibility_notes.slice(0, 2).map((n) => <li key={n}>✓ {n}</li>)}</ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary !py-2 !px-4 text-sm" onClick={() => setOpen(a)}>See details & website</button>
            </div>
          </article>
        ))}
        {!rows.length && <div className="card p-8 col-span-full text-center"><p className="text-lg">Nothing matches every filter yet. Try loosening one, or let Joy Compass get creative.</p></div>}
      </div>


      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name || ''}>
        {open && (
          <div>
            <p className="label">{pretty(open.category)} · {open.verified ? 'Verified listing · confirm hours before you go' : 'Sample listing, confirm before you go'}</p>
            <h3 className="font-display text-3xl text-navy mt-1">{CAT_EMOJI[open.category] || '✨'} {open.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Pill tone={open.cost_tier === 'free' ? 'forest' : 'gold'}>{BUDGET_LABELS[open.cost_tier]}</Pill>
              <Pill tone="sky">{pretty(open.setting)}</Pill>
              {open.ages.map((x) => <Pill key={x} tone="navy">Ages {x}</Pill>)}
            </div>
            <DetailStrip a={open} />
            {open.schedule?.notes && <p className="mt-2 text-sm">🗓️ {open.schedule.notes}</p>}
            {open.how_to_join && <p className="mt-1 text-sm">👋 <strong>How to join:</strong> {open.how_to_join}</p>}
            <WebLinks className="mt-4" url={open.website} name={open.name} place={`${open.city}, ${open.state}`}
              similar={open.website ? null : `${pretty(open.category).toLowerCase()} for kids with disabilities ${open.city} ${open.state}`}
              map={[open.venue, open.neighborhood, open.city, open.state].filter(Boolean).join(', ')} />
            {open.schedule && <button className="btn-ghost !py-1.5 !px-3.5 text-sm mt-2" onClick={() => addToCalendar(open)}>📅 Add to my calendar</button>}
            <p className="mt-5 text-ink/90 text-[17px]">{open.description}</p>
            <p className="label mt-5 mb-1">Accessibility</p>
            <ul className="space-y-1">{open.accessibility_notes.map((n) => <li key={n}>✓ {n}</li>)}</ul>
            <p className="mt-2 text-sm text-ink/80">Good for: {open.access.map((x) => ACCESS_LABELS[x]).join(' · ')}</p>
            {open.caregiver_tip && <p className="mt-4 rounded-xl bg-marigold-soft p-3">💡 {open.caregiver_tip}</p>}
            <button className="btn-compass mt-5" onClick={() => { setOpen(null); askCopilot(`Help me plan a visit to "${open.name}" in ${open.city}, ${open.state} (${whenText(open)}). What should I know and bring?`) }}>Plan this visit with Joy Compass 🧭</button>
          </div>
        )}
      </Sheet>

      <div className="grid lg:grid-cols-[1fr_auto] gap-6 mt-10">
        <section className="card p-6" aria-labelledby="kbyg">
          <h3 id="kbyg" className="font-display text-2xl text-navy">Know-before-you-go checklist</h3>
          <p className="text-sm text-ink/80">Saved on this device.</p>
          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((c, i) => (
              <li key={c}><label className="flex gap-3 items-start cursor-pointer"><input type="checkbox" className="mt-1 w-5 h-5 accent-[#1F4D3A]" checked={checked.includes(i)} onChange={() => toggle(i)} /><span className={checked.includes(i) ? 'line-through text-ink/80' : ''}>{c}</span></label></li>
            ))}
          </ul>
        </section>
        <div className="card p-6 bg-sky-soft lg:w-80 flex flex-col justify-center">
          <p className="font-display text-xl text-navy">Want a whole weekend planned?</p>
          <p className="mt-2">The Scout agent builds a budget-aware plan around your kid's needs and naps.</p>
          <button className="btn-primary mt-4" onClick={() => askCopilot(`Plan a joyful, budget-friendly weekend${city ? ' in ' + cities.find(([k]) => k === city)?.[1] : ''} for my ${age ? age.replace('-', '–') + '-year-old' : 'child'}${access.length ? ' who uses ' + access.join(' and ') + ' supports' : ''}${budget ? ', budget ' + BUDGET_LABELS[budget] : ''}.`)}>Plan my weekend ✨</button>
        </div>
      </div>
    </div>
  )
}
