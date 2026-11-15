import { useEffect, useMemo, useRef, useState } from 'react'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import us from 'us-atlas/states-10m.json'
import { ModuleHeader, ScoreBar, Pill, WebLinks } from '../components/ui.jsx'

const W = 975, H = 610
const projection = geoAlbersUsa().scale(1300).translate([W / 2, H / 2])
const path = geoPath(projection)
const STATES = feature(us, us.objects.states).features
const BORDERS = path(mesh(us, us.objects.states, (a, b) => a !== b))

const FACTORS = [
  ['transit_curb_cuts', 'Curb cuts & accessible transit'],
  ['inclusive_playgrounds', 'Inclusive playgrounds'],
  ['medicaid_waiver', 'Medicaid / waiver generosity'],
  ['pediatric_specialty', 'Pediatric specialty care'],
  ['inclusive_schools', 'Inclusive school districts'],
]
const color = (v) => (v >= 78 ? '#1F4D3A' : v >= 70 ? '#4A90C2' : v >= 60 ? '#E8A317' : '#C8553D')       // map dots (graphics)
// Darker shades for text and score badges so every number meets WCAG AAA (7:1+)
const ink = (v) => (v >= 78 ? '#1F4D3A' : v >= 70 ? '#1A4E73' : v >= 60 ? '#6B4700' : '#8A2F1C')

export default function MapModule({ data, askCopilot, focus, clearFocus }) {
  const hotspots = data.hotspots.hotspots
  const [weights, setWeights] = useState(Object.fromEntries(FACTORS.map(([k]) => [k, 3])))
  const [selected, setSelected] = useState(null)
  const [compare, setCompare] = useState([])
  const dossierRef = useRef(null)
  useEffect(() => { if (focus?.module === 'map') { setSelected(focus.id); clearFocus() } }, [focus])
  useEffect(() => { if (selected) setTimeout(() => dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60) }, [selected])

  const ranked = useMemo(() => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1
    return hotspots.map((h) => ({ ...h, score: Math.round(FACTORS.reduce((s, [k]) => s + h.scores[k] * weights[k], 0) / total) }))
      .sort((a, b) => b.score - a.score)
  }, [hotspots, weights])
  const sel = ranked.find((h) => h.id === selected) || null
  const rank = (id) => ranked.findIndex((h) => h.id === id) + 1

  return (
    <div>
      <ModuleHeader kind="map" eyebrow="Module 1 · Best Places to Live & Thrive" title="Where could your family thrive?">
        Tell us what matters most and the map re-ranks every city. Click a glowing hotspot for the dossier: scores, children's hospitals, waivers and insider tips from caregivers who live there.
      </ModuleHeader>

      <div className="grid xl:grid-cols-[1fr_380px] gap-6">
        <div className="card p-4 md:p-6 self-start">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="group" aria-label="Map of U.S. inclusion hotspots">
            <g>{STATES.map((s) => <path key={s.id} d={path(s)} fill="#F4EBDA" />)}</g>
            <path d={BORDERS} fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
            {ranked.map((h) => {
              const p = projection([h.lon, h.lat]); if (!p) return null
              const isSel = h.id === selected
              return (
                <g key={h.id} transform={`translate(${p[0]},${p[1]})`} className="cursor-pointer" tabIndex={0} role="button"
                  aria-label={`${h.city} · ${h.score}, ${h.state}, rank ${rank(h.id)}`}
                  onClick={() => setSelected(h.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(h.id)}>
                  <circle r="6" fill={color(h.score)} className="pulse-ring" style={{ animationDelay: `${(rank(h.id) % 7) * 0.3}s` }} />
                  {isSel && <circle r="18" fill="none" stroke="#1E90FF" strokeWidth="3" strokeDasharray="4 3" className="anim-wheel" style={{ animationDuration: '8s' }} />}
                  <circle r={isSel ? 11 : 4 + h.score / 18} fill={color(h.score)} stroke="#fff" strokeWidth={isSel ? 3 : 1.5} />
                  {(isSel || rank(h.id) <= 5) && (
                    <text y={-14} x={p[0] < 160 ? -6 : p[0] > W - 160 ? 6 : 0} textAnchor={p[0] < 160 ? 'start' : p[0] > W - 160 ? 'end' : 'middle'} className="font-sans" fontSize="15" fontWeight="700" fill="#14213D" stroke="#FBF6EC" strokeWidth="4" paintOrder="stroke">{h.city} · {h.score}</text>
                  )}
                </g>
              )
            })}
          </svg>
          <div className="flex flex-wrap gap-4 text-sm mt-2" aria-label="Legend">
            {[[85, '78+ Thriving'], [74, '70–77 Strong'], [65, '60–69 Growing'], [50, 'Under 60 Watch-outs']].map(([v, t]) => (
              <span key={t} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: color(v) }} />{t}</span>
            ))}
            <span className="text-ink/80 ml-auto">Illustrative demo scores; verify locally.</span>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h3 className="font-display text-xl text-navy">What matters most to your family?</h3>
            <div className="mt-4 space-y-4">
              {FACTORS.map(([k, label]) => (
                <label key={k} className="block">
                  <span className="flex justify-between text-sm font-medium"><span>{label}</span><span className="text-forest">{['Skip', 'Nice', 'Matters', 'Big deal', 'Must-have', 'Everything'][weights[k]]}</span></span>
                  <input type="range" min="0" max="5" value={weights[k]} onChange={(e) => setWeights({ ...weights, [k]: +e.target.value })} className="w-full accent-[#1E90FF]" />
                </label>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-display text-xl text-navy">Your top 8</h3>
            <ol className="mt-3 space-y-2">
              {ranked.slice(0, 8).map((h, i) => (
                <li key={h.id}>
                  <button onClick={() => setSelected(h.id)} className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${selected === h.id ? 'bg-forest text-cream' : 'hover:bg-cream-2'}`}>
                    <span className="font-display text-lg w-6">{i + 1}</span>
                    <span className="flex-1 font-semibold">{h.city}, {h.state}</span>
                    <span className="rounded-full px-2 py-0.5 text-sm font-bold text-white" style={{ background: ink(h.score) }}>{h.score}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {sel && (
        <section ref={dossierRef} className="card p-6 md:p-8 mt-6 anim-pop scroll-mt-24" aria-live="polite" aria-labelledby="dossier">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-64">
              <p className="label">City dossier · #{rank(sel.id)} for your family · {sel.region}</p>
              <h3 id="dossier" className="font-display text-4xl text-navy mt-1">{sel.city}, {sel.state}</h3>
              <p className="text-lg mt-2 text-ink/90">{sel.tagline}</p>
            </div>
            <div className="text-center"><div className="font-display text-5xl" style={{ color: ink(sel.score) }}>{sel.score}</div><div className="text-sm">your weighted score</div></div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="space-y-3">{FACTORS.map(([k, l]) => <ScoreBar key={k} label={l} value={sel.scores[k]} />)}
              <p className="text-sm pt-2">Cost of living: <Pill tone={sel.cost_of_living === 'high' ? 'terra' : sel.cost_of_living === 'low' ? 'forest' : 'gold'}>{sel.cost_of_living}</Pill></p>
            </div>
            <div className="space-y-4 text-[15px]">
              <div><p className="label">Highlights</p><ul className="list-disc pl-5 mt-1 space-y-1">{sel.highlights.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><p className="label">Pediatric hospitals</p><p>{sel.pediatric_hospitals.join(' · ')}</p></div>
              <div><p className="label">Inclusive playgrounds</p><p>{sel.inclusive_playgrounds.join(' · ')}</p></div>
              <div><p className="label">Getting around</p><p>{sel.transit_notes}</p></div>
              <div><p className="label">Waivers & Medicaid</p><p>{sel.waiver_notes}</p></div>
              <div><p className="label">Schools</p><p>{sel.school_notes}</p></div>
            </div>
            <div className="space-y-3">
              <p className="label">Caregiver insider tips</p>
              {sel.insider_tips.map((t) => (
                <blockquote key={t.tip} className="rounded-2xl bg-marigold-soft p-4"><p>“{t.tip}”</p><footer className="text-sm mt-1 font-semibold text-navy">— {t.from}</footer></blockquote>
              ))}
              <div className="rounded-2xl bg-terracotta-soft p-4"><p className="label !text-terracotta-ink">Honest watch-outs</p><ul className="list-disc pl-5 mt-1">{sel.watch_outs.map((w) => <li key={w}>{w}</li>)}</ul></div>
              <div><p className="label mb-1">Explore {sel.city} online</p>
                <WebLinks name={`${sel.city} inclusive playgrounds`} similar={`inclusive accessible playgrounds ${sel.city} ${sel.state}`} label="Inclusive playgrounds" />
                <WebLinks className="mt-2" name={`${sel.city} paratransit`} similar={`${sel.city} ${sel.state} paratransit accessible transit`} label="Paratransit & accessible transit" />
                {sel.pediatric_hospitals[0] && <WebLinks className="mt-2" name={`${sel.pediatric_hospitals[0]} ${sel.city}`} real label={sel.pediatric_hospitals[0]} />}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => setCompare((c) => (c.includes(sel.id) ? c : [...c, sel.id].slice(-3)))}>＋ Add to comparison</button>
            <button className="btn-ghost" onClick={() => askCopilot(`We're thinking about moving to ${sel.city}, ${sel.state}. Our child uses a wheelchair. What should we know, and what's fun to do there on a budget?`)}>Ask the Co-Pilot about {sel.city}</button>
          </div>
        </section>
      )}

      {compare.length > 0 && (
        <section className="card p-6 mt-6 overflow-x-auto" aria-labelledby="cmp">
          <div className="flex items-center justify-between"><h3 id="cmp" className="font-display text-2xl text-navy">Side-by-side</h3><button className="text-sm underline" onClick={() => setCompare([])}>Clear</button></div>
          <table className="w-full mt-4 text-left">
            <thead><tr><th className="py-2">Factor</th>{compare.map((id) => { const h = ranked.find((x) => x.id === id); return <th key={id} className="py-2">{h.city}</th> })}</tr></thead>
            <tbody>
              {[...FACTORS, ['score', 'Your weighted score']].map(([k, l]) => (
                <tr key={k} className="border-t border-sand"><td className="py-2 pr-4">{l}</td>{compare.map((id) => { const h = ranked.find((x) => x.id === id); const v = k === 'score' ? h.score : h.scores[k]; return <td key={id} className="py-2 font-semibold" style={{ color: ink(v) }}>{v}</td> })}</tr>
              ))}
            </tbody>
          </table>
          {compare.length >= 2 && <button className="btn-gold mt-4" onClick={() => askCopilot(`Compare ${compare.map((id) => { const h = ranked.find((x) => x.id === id); return `${h.city}, ${h.state}` }).join(' vs ')} for a family whose child uses a power wheelchair. Which fits better and why?`)}>Ask the Co-Pilot to compare these ✨</button>}
        </section>
      )}
    </div>
  )
}
