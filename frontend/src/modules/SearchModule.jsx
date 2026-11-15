import { useEffect, useMemo, useRef } from 'react'
import { Pill, WebLinks, BUDGET_LABELS, SPECIALTY_LABELS, pretty } from '../components/ui.jsx'

// Site-wide search across every bundled dataset (runs in the browser, instant, no AI cost).
// All words must match somewhere (falling back to any word); matches in names count most.

const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function buildIndex(data) {
  const rows = []
  const add = (group, id, title, sub, body, extra = {}) =>
    rows.push({ group, id, title, sub, body, hay: norm([title, sub, body].join(' ')), name: norm(title), ...extra })
  data.activities.activities.forEach((a) => add('Things to do', a.id, a.name, `${a.city}, ${a.state} · ${pretty(a.category)} · ${BUDGET_LABELS[a.cost_tier]}`,
    [a.description, a.venue, a.neighborhood, a.access.join(' '), a.accessibility_notes.join(' '), a.price_note].join(' '), { module: 'play', item: a }))
  data.hotspots.hotspots.forEach((h) => add('Cities', h.id, `${h.city}, ${h.state}`, `${h.region} · overall ${h.overall}`,
    [h.tagline, h.highlights.join(' '), h.pediatric_hospitals.join(' '), h.waiver_notes, (h.aliases || []).join(' ')].join(' '), { module: 'map' }))
  data.providers.providers.forEach((p) => add('Providers', p.id, `${p.name}, ${p.credentials}`, `${SPECIALTY_LABELS[p.specialty]} · ${p.city}, ${p.state} · sample listing`,
    [p.practice, p.insurance.join(' '), p.languages.join(' '), p.green_flags.join(' ')].join(' '), { module: 'providers', item: p }))
  data.equipment.equipment.forEach((e) => add('Equipment guides', e.id, `${e.emoji} ${e.name}`, 'Gear Navigator',
    [e.who_it_helps, e.funding_paths.join(' '), e.who_prescribes.join(' ')].join(' '), { module: 'equipment' }))
  data.equipment.lmn_glossary.forEach((g, i) => add('Glossary', `gloss-${i}`, g.term, 'Letter of Medical Necessity term', [g.plain, g.why_it_matters].join(' '), { module: 'equipment' }))
  data.equipment_programs.programs.forEach((p) => add('Funding, loans & swaps', p.id, p.name, `${pretty(p.type)} · ${p.scope === 'national' ? 'National' : p.states.join(', ')}${p.real_org ? '' : ' · sample listing'}`,
    [p.what_they_offer, p.how_to_apply, p.covers.join(' ')].join(' '), { module: 'equipment', item: p }))
  data.policies.policies.forEach((p) => add('Rights & laws', p.id, p.title, `${p.law} · ${p.citation}`, [p.plain_language, p.use_it_when, p.topics.join(' ')].join(' '), { module: 'iep', item: p }))
  data.accommodations.accommodations.forEach((a) => add('IEP / 504 accommodations', a.id, a.label, pretty(a.category), a.language.replaceAll('{child}', 'your child'), { module: 'iep' }))
  data.sanctuary.support_groups.forEach((g) => add('Support groups', g.id, g.name, [pretty(g.format), g.city, g.state].filter(Boolean).join(' · '), [g.description, g.audience.join(' '), g.schedule].join(' '), { module: 'sanctuary', item: g }))
  data.sanctuary.respite_grants.forEach((r) => add('Respite & caregiver help', r.id, r.name, r.scope === 'national' ? 'National' : r.states.join(', '), [r.what_they_offer, r.eligibility, r.how_to_apply].join(' '), { module: 'sanctuary', item: r }))
  data.sanctuary.resets.forEach((r) => add('5-minute resets', r.id, r.title, 'Caregiver Sanctuary', [r.best_for, r.steps.join(' ')].join(' '), { module: 'sanctuary' }))
  return rows
}

export function search(index, q) {
  const words = norm(q).split(/[^a-z0-9$]+/).filter((w) => w.length > 1)
  if (!words.length) return []
  const scoreOf = (r) => words.reduce((s, w) => s + (r.name.includes(w) ? 3 : 0) + (r.hay.includes(w) ? 1 : 0), 0)
  let hits = index.filter((r) => words.every((w) => r.hay.includes(w)))
  if (!hits.length) hits = index.filter((r) => words.some((w) => r.hay.includes(w)))
  return hits.map((r) => ({ ...r, score: scoreOf(r) })).sort((a, b) => b.score - a.score)
}

const ORDER = ['Things to do', 'Cities', 'Funding, loans & swaps', 'Rights & laws', 'IEP / 504 accommodations', 'Equipment guides',
  'Providers', 'Support groups', 'Respite & caregiver help', 'Glossary', '5-minute resets']
const MODULE_LABEL = { play: 'Joy & Play', map: 'Places to Thrive', providers: 'Providers', equipment: 'Gear Navigator', iep: 'IEP & 504', sanctuary: 'Sanctuary' }

export default function SearchModule({ data, q, setQ, openResult, askCopilot }) {
  const index = useMemo(() => buildIndex(data), [data])
  const results = useMemo(() => search(index, q), [index, q])
  // Sections ordered by their best match (ties keep the usual order), so the most relevant comes first.
  const groups = ORDER.map((g) => [g, results.filter((r) => r.group === g)]).filter(([, rs]) => rs.length)
    .sort((a, b) => b[1][0].score - a[1][0].score || ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]))
  const input = useRef(null)
  useEffect(() => { input.current?.focus() }, [])

  return (
    <div className="space-y-8">
      <header>
        <p className="label mb-2">Search all of Joy Risers</p>
        <h2 className="font-display text-4xl md:text-5xl text-navy">What are you looking for?</h2>
        <form onSubmit={(e) => e.preventDefault()} className="mt-5" role="search">
          <label htmlFor="site-search" className="sr-only">Search</label>
          <input id="site-search" ref={input} type="search" className="input text-lg !py-3.5" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Try: sled hockey, Oakland, stander, field trip, respite, Medicaid, Spanish-speaking pediatrician…" />
        </form>
        {q.trim() && <p className="mt-3 font-semibold text-navy" aria-live="polite">{results.length} {results.length === 1 ? 'result' : 'results'} for “{q.trim()}”</p>}
      </header>

      {groups.map(([g, rs]) => (
        <section key={g} aria-labelledby={`sg-${g}`}>
          <h3 id={`sg-${g}`} className="font-display text-2xl text-navy mb-3">{g} <span className="text-base font-sans text-ink/85">({rs.length})</span></h3>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rs.slice(0, 9).map((r) => (
              <article key={r.group + r.id} className="card p-5 flex flex-col">
                <p className="text-xs font-semibold text-forest">{r.sub}</p>
                <h4 className="font-display text-lg text-navy mt-1">{r.title}</h4>
                <p className="mt-1 text-[15px] text-ink/90 line-clamp-3 flex-1">{r.body.slice(0, 220)}{r.body.length > 220 ? '…' : ''}</p>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <button className="btn-primary !py-1.5 !px-4 text-sm" onClick={() => openResult(r)}>Open in {MODULE_LABEL[r.module]} →</button>
                  {r.item && 'url' in r.item && (r.item.url || r.item.real_org) && <WebLinks url={r.item.url} name={r.item.name} real={r.item.real_org} />}
                  {r.item?.website && <WebLinks url={r.item.website} name={r.item.name} />}
                  {r.module === 'play' && r.item?.cost_tier === 'free' && <Pill tone="forest">Free</Pill>}
                </div>
              </article>
            ))}
          </div>
          {rs.length > 9 && <p className="mt-2 text-sm text-ink/80">Showing 9 of {rs.length}. Add another word to narrow it down.</p>}
        </section>
      ))}

      {q.trim() ? (
        <section className="card p-6 bg-sky-soft !border-sky grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <p className="font-display text-xl text-navy">{results.length ? 'Want a plan built around this?' : 'No exact matches, but Joy Compass can help.'}</p>
            <p className="mt-1">Joy Compass understands questions in your own words, in any language, and searches everything for you.</p>
          </div>
          <button className="btn-primary" onClick={() => askCopilot(q.trim())}>Ask Joy Compass 🧭</button>
        </section>
      ) : (
        <div className="flex flex-wrap gap-2">
          {['sled hockey', 'free', 'Oakland', 'New Haven', 'stander', 'field trip', 'respite', 'grandparents', 'Medicaid', 'power soccer'].map((s) => (
            <button key={s} className="chip chip-off" onClick={() => setQ(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}
