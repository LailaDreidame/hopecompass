import { useMemo, useRef, useState } from 'react'
import { ModuleHeader, Chips, Select, Pill, CopyButton, WebLinks, pretty } from '../components/ui.jsx'

const SAMPLE_LMN = `To Whom It May Concern: I am writing to document the medical necessity of a power wheelchair with tilt-in-space for my patient, age 9, who has spastic quadriplegic cerebral palsy. Her functional limitation prevents safe self-propulsion of a manual chair, limiting MRADLs at home and school. A least costly alternative (manual chair with attendant) was trialed and was insufficient. Tilt-in-space is required to manage pressure injury risk during a 7-hour school day. Seat-to-floor height must allow transfers. Please include a growth kit. A home assessment confirmed access. HCPCS codes are attached for prior authorization.`

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default function EquipmentModule({ data, askCopilot }) {
  const { equipment, roles, lmn_glossary: glossary } = data.equipment
  const programs = data.equipment_programs.programs
  const [eqId, setEqId] = useState(equipment[0].id)
  const [picked, setPicked] = useState(['pediatrician', 'pt', 'ot'])
  const [child, setChild] = useState('')
  const [lmn, setLmn] = useState('')
  const [ptype, setPtype] = useState(null)
  const [pstate, setPstate] = useState(null)
  const eq = equipment.find((e) => e.id === eqId)
  const guideRef = useRef(null)
  const name = child.trim() || 'my child'

  const script = useMemo(() => picked.map((rid) => {
    const r = roles.find((x) => x.id === rid)
    const qs = (eq.questions[rid] || []).map((q) => '  • ' + (child.trim() ? q.replace(/\b(my|your) child\b/gi, child.trim()) : q))
    const lmnBits = ['pediatrician', 'pt', 'ot'].includes(rid) ? ['  Please make sure the Letter of Medical Necessity includes:', ...eq.lmn_must_include.map((x) => '    ☐ ' + x)] : []
    return [`── ${r.label} ──`, `“${r.script_opener.replace(/my child/gi, name)}”`, `About the ${eq.name.toLowerCase()} for ${name}:`, ...qs, ...lmnBits].join('\n')
  }).join('\n\n'), [picked, eq, child])

  const found = useMemo(() => {
    const t = lmn.toLowerCase()
    return glossary.filter((g) => g.flag_words.some((w) => t.includes(w.toLowerCase())))
  }, [lmn, glossary])
  const highlighted = useMemo(() => {
    if (!lmn) return ''
    const words = glossary.flatMap((g) => g.flag_words).sort((a, b) => b.length - a.length)
    const esc = lmn.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    return esc.replace(new RegExp(`(${words.map(escapeRe).join('|')})`, 'gi'), '<mark class="bg-marigold-soft text-navy rounded px-0.5 font-semibold">$1</mark>')
  }, [lmn, glossary])

  const states = [...new Set(programs.flatMap((p) => p.states).filter((s) => s !== 'ALL'))].sort()
  const progRows = programs.filter((p) => (!ptype || p.type === ptype) && (!pstate || p.states.includes('ALL') || p.states.includes(pstate)))

  return (
    <div className="space-y-10">
      <ModuleHeader kind="equipment" eyebrow="Module 3 · Equipment & Mobility Gear Navigator" title="What to ask for & how to get it">
        Custom chairs, power chairs, canes, standers, ramps and bath chairs, with the exact questions to ask, a Letter of Medical Necessity decoder, and where to borrow, swap or get help paying.
      </ModuleHeader>

      <p className="font-semibold text-navy -mb-6">👇 Tap a piece of equipment. Its step-by-step guide opens below.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group" aria-label="Choose equipment">
        {equipment.map((e) => (
          <button key={e.id} onClick={() => { setEqId(e.id); setTimeout(() => guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120) }} aria-pressed={e.id === eqId} className={`card p-4 text-left transition ${e.id === eqId ? '!bg-forest text-cream !border-forest' : 'hover:-translate-y-0.5'}`}>
            <span className="text-3xl" aria-hidden="true">{e.emoji}</span>
            <p className="font-semibold mt-1">{e.name}</p>
            {e.id === eqId && <p className="text-xs mt-1 text-marigold font-semibold">Selected ✓ · guide below ↓</p>}
          </button>
        ))}
      </div>

      <section ref={guideRef} className="card p-6 md:p-8 grid lg:grid-cols-3 gap-8 scroll-mt-28" aria-labelledby="eqname" aria-live="polite">
        <div className="lg:col-span-2">
          <h3 id="eqname" className="font-display text-3xl text-navy">{eq.emoji} {eq.name}</h3>
          <p className="mt-2 text-lg">{eq.who_it_helps}</p>
          <p className="label mt-6 mb-2">The path, step by step · {eq.typical_timeline}</p>
          <ol className="relative border-l-2 border-marigold ml-3 space-y-3">
            {eq.typical_steps.map((s, i) => <li key={s} className="pl-5 relative"><span className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-marigold text-navy text-xs font-bold flex items-center justify-center">{i + 1}</span>{s}</li>)}
          </ol>
          <p className="mt-5 rounded-2xl bg-sky-soft p-4"><strong>Growing kids:</strong> {eq.growth_tips}</p>
        </div>
        <div className="space-y-5">
          <div><p className="label">Who prescribes</p><ul className="mt-1 space-y-1">{eq.who_prescribes.map((x) => <li key={x}>• {x}</li>)}</ul></div>
          <div><p className="label">A strong LMN includes</p><ul className="mt-1 space-y-1">{eq.lmn_must_include.map((x) => <li key={x}>☐ {x}</li>)}</ul></div>
          <div><p className="label">Ways to pay</p><ul className="mt-1 space-y-1">{eq.funding_paths.map((x) => <li key={x}>💛 {x}</li>)}</ul></div>
        </div>
      </section>

      <section className="card p-6 md:p-8" aria-labelledby="builder">
        <h3 id="builder" className="font-display text-3xl text-navy">Checklist & Script Builder</h3>
        <p className="mt-1 text-ink/90">Pick who you're talking to. We'll write what to say and what to ask, ready to copy or print.</p>
        <div className="grid md:grid-cols-[260px_1fr] gap-4 mt-5">
          <label className="block"><span className="label block mb-1">Your child's first name (optional)</span><input className="input" value={child} onChange={(e) => setChild(e.target.value)} placeholder="e.g. Amani" /></label>
          <div><p className="label mb-2">Who are you talking to?</p><Chips multi label="Care team roles" value={picked} onChange={setPicked} options={roles.map((r) => [r.id, r.label])} /></div>
        </div>
        <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-cream-2 p-5 text-[15px] leading-relaxed font-sans max-h-[460px] overflow-auto" aria-live="polite">{script || 'Pick at least one person to talk to.'}</pre>
        <div className="flex flex-wrap gap-3 mt-4">
          <CopyButton text={script} label="Copy script" />
          <button className="btn-ghost !py-1.5 !px-3 text-sm" onClick={() => { const w = window.open('', '_blank'); w.document.write(`<pre style="font:15px/1.5 system-ui;white-space:pre-wrap;padding:24px">${script.replace(/</g, '&lt;')}</pre>`); w.print() }}>Print</button>
          <button className="btn-primary !py-1.5 text-sm" onClick={() => askCopilot(`Help me get a ${eq.name.toLowerCase()} for ${name}. Who do I ask, what goes in the Letter of Medical Necessity, and what grants or loan closets could help? Draft an email to our PT.`)}>Have the Advocate agent draft my email ✨</button>
        </div>
      </section>

      <section className="card p-6 md:p-8 grid lg:grid-cols-2 gap-8" aria-labelledby="decoder">
        <div>
          <h3 id="decoder" className="font-display text-3xl text-navy">Letter of Medical Necessity decoder</h3>
          <p className="mt-1 text-ink/90">Paste a letter (or try our sample). We'll highlight the insurance language and translate it. Nothing leaves your browser.</p>
          <textarea className="input mt-4 h-56" value={lmn} onChange={(e) => setLmn(e.target.value)} placeholder="Paste the letter here…" aria-label="Letter of Medical Necessity text" />
          <div className="flex gap-3 mt-3"><button className="btn-ghost !py-1.5 text-sm" onClick={() => setLmn(SAMPLE_LMN)}>Try a sample letter</button>{lmn && <button className="text-sm underline" onClick={() => setLmn('')}>Clear</button>}</div>
          {lmn && <div className="mt-4 rounded-2xl bg-white border border-sand p-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlighted }} />}
        </div>
        <div>
          <p className="label mb-2">{lmn ? `${found.length} terms found in your letter` : 'Glossary'}</p>
          <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
            {(lmn ? found : glossary).map((g) => (
              <div key={g.term} className="rounded-2xl bg-cream-2 p-4"><p className="font-semibold text-navy">{g.term}</p><p className="mt-1">{g.plain}</p><p className="mt-1 text-sm text-forest font-medium">Why it matters: {g.why_it_matters}</p></div>
            ))}
            {lmn && !found.length && <p>No insurance terms spotted. That may mean the letter needs more detail; compare it to the “strong LMN” list above.</p>}
          </div>
        </div>
      </section>

      <section aria-labelledby="progs">
        <h3 id="progs" className="font-display text-3xl text-navy">Loan closets, grants & swaps</h3>
        <div className="flex flex-wrap gap-4 items-end mt-4">
          <div><p className="label mb-2">Type</p><Chips label="Program type" value={ptype} onChange={setPtype} options={[['loan_closet', 'Loan closet'], ['grant', 'Grant'], ['swap', 'Swap'], ['reuse', 'Reuse']]} /></div>
          <Select className="w-56" label="State" value={pstate} onChange={setPstate} options={[['', 'All states'], ...states.map((s) => [s, s])]} />
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
          {progRows.map((p) => (
            <article key={p.id} className="card p-5">
              <div className="flex flex-wrap gap-1.5"><Pill tone="gold">{pretty(p.type)}</Pill><Pill tone="sky">{p.scope === 'national' ? 'National' : p.states.join(', ')}</Pill>{p.real_org ? <Pill tone="forest">Real organization</Pill> : <Pill tone="terra">Sample listing</Pill>}</div>
              <h4 className="font-display text-xl text-navy mt-2">{p.name}</h4>
              <p className="mt-1">{p.what_they_offer}</p>
              <p className="mt-2 text-sm"><strong>How to apply:</strong> {p.how_to_apply}</p>
              <p className="mt-2 text-xs text-ink/75">Covers: {p.covers.map(pretty).join(', ')}</p>
              <WebLinks className="mt-3" url={p.url} name={p.name} real={p.real_org} place={p.scope === 'national' ? '' : p.states.join(', ')} similar={p.real_org ? null : `${pretty(p.type).toLowerCase()} pediatric ${p.covers.map(pretty).join(' ').toLowerCase()} ${p.states.filter((x) => x !== 'ALL').join(' ')}`} />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
