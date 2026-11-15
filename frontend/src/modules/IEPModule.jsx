import { useMemo, useRef, useState } from 'react'
import { ModuleHeader, Chips, Pill, CopyButton, pretty } from '../components/ui.jsx'

const STAGES = [
  ['ifsp', 'Early Intervention (IFSP)', '0–3', 'IDEA Part C: services in natural environments like home and childcare, built around your family.'],
  ['iep', 'IEP (K–12 special education)', '3–21', 'IDEA Part B: specially designed instruction, related services and accommodations.'],
  ['504', 'Section 504 Plan', 'K–12+', 'Equal access and accommodations when a child doesn’t need specialized instruction.'],
  ['transition', 'Transition to adulthood', '14–21', 'Postsecondary goals, travel training, self-advocacy and the age-of-majority conversation.'],
]

export default function IEPModule({ data, askCopilot }) {
  const { accommodations, checklists } = data.accommodations
  const policies = data.policies.policies
  const polById = useMemo(() => Object.fromEntries(policies.map((p) => [p.id, p])), [policies])
  const [stage, setStage] = useState('iep')
  const [child, setChild] = useState('')
  const [cats, setCats] = useState(['adaptive_pe', 'field_trip_transport', 'evacuation', 'passing_time', 'assistive_tech'])
  const [chosen, setChosen] = useState(null)
  const [done, setDone] = useState([])
  const [law, setLaw] = useState(null)
  const [pq, setPq] = useState('')
  const builderRef = useRef(null)
  // after picking a stage, glide down to the builder so it's obvious something happened
  const goToBuilder = () => setTimeout(() => builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)

  const inStage = accommodations.filter((a) => a.stages.includes(stage))
  const catOptions = [...new Set(inStage.map((a) => a.category))]
  const visible = inStage.filter((a) => cats.includes(a.category))
  const selectedIds = chosen ?? visible.map((a) => a.id)
  const picked = inStage.filter((a) => selectedIds.includes(a.id) && cats.includes(a.category))
  const name = child.trim() || '[Child’s name]'

  const doc = useMemo(() => {
    const lines = [`PROPOSED ACCOMMODATIONS & SERVICES: ${name}`, `Plan type: ${STAGES.find((s) => s[0] === stage)[1]}`, '']
    picked.forEach((a, i) => {
      lines.push(`${i + 1}. ${a.label}`)
      lines.push(`   ${a.language.replaceAll('{child}', name)}`)
      const cites = a.legal_basis.map((id) => polById[id]?.citation).filter(Boolean)
      if (cites.length) lines.push(`   Legal basis: ${cites.join('; ')}`)
      lines.push('')
    })
    lines.push('This is general information to support a collaborative team conversation, not legal advice.')
    return lines.join('\n')
  }, [picked, name, stage, polById])

  const lawOptions = [...new Set(policies.map((p) => p.law))]
  const polRows = policies.filter((p) => (!law || p.law === law) && (!pq || `${p.title} ${p.plain_language} ${p.citation}`.toLowerCase().includes(pq.toLowerCase())))

  return (
    <div className="space-y-10">
      <ModuleHeader kind="iep" eyebrow="Module 4 · IEP & 504 Advocacy Powerhouse" title="Champion your child’s rights, ages 0 to 21">
        From Early Intervention to the transition years. Build accommodation language grounded in federal law, prep for the meeting, and walk in knowing your rights. Grandparents, foster and kinship caregivers: under IDEA, you can count as the “parent” too.
      </ModuleHeader>

      <div>
      <p className="font-semibold text-navy mb-3">👇 Tap your child's stage. Your accommodation builder opens below.</p>
      <ol className="grid md:grid-cols-4 gap-3" aria-label="Plan stages">
        {STAGES.map(([k, t, ages, d]) => (
          <li key={k}>
            <button onClick={() => { setStage(k); setChosen(null); setCats([...new Set(accommodations.filter((a) => a.stages.includes(k)).map((a) => a.category))].slice(0, 5)); goToBuilder() }}
              aria-pressed={stage === k} className={`card w-full h-full p-4 text-left transition ${stage === k ? '!bg-forest text-cream !border-forest' : 'hover:-translate-y-0.5'}`}>
              <span className={`text-xs font-bold ${stage === k ? 'text-marigold-soft' : 'text-forest'}`}>AGES {ages}</span>
              <p className="font-display text-lg mt-1">{t}</p>
              <p className={`text-sm mt-1 ${stage === k ? 'text-cream/90' : 'text-ink/85'}`}>{d}</p>
              <p className={`text-sm mt-2 font-semibold ${stage === k ? 'text-marigold-soft' : 'text-forest'}`}>{stage === k ? 'Selected ✓ · see your builder below ↓' : 'Tap to choose →'}</p>
            </button>
          </li>
        ))}
      </ol>
      </div>

      <section ref={builderRef} className="card p-6 md:p-8 scroll-mt-28" aria-labelledby="iepb">
        <p className="label">Accommodation & Meeting Prep Builder</p>
        <h3 id="iepb" className="font-display text-3xl text-navy mt-1" aria-live="polite">Building your {STAGES.find((x) => x[0] === stage)[1]}</h3>
        <div className="grid md:grid-cols-[260px_1fr] gap-5 mt-5">
          <label className="block"><span className="label block mb-1">Child's first name</span><input className="input" value={child} onChange={(e) => setChild(e.target.value)} placeholder="e.g. Rosa" /></label>
          <div><p className="label mb-2">Areas to cover</p><Chips multi label="Accommodation areas" value={cats} onChange={(v) => { setCats(v); setChosen(null) }} options={catOptions.map((c) => [c, pretty(c)])} /></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div tabIndex={0} aria-label="Scrollable list" className="space-y-3 max-h-[560px] overflow-auto pr-1">
            {visible.map((a) => (
              <label key={a.id} data-id={a.id} className={`block rounded-2xl border p-4 cursor-pointer transition ${selectedIds.includes(a.id) ? 'border-forest bg-forest/5' : 'border-sand bg-white'}`}>
                <div className="flex gap-3">
                  <input type="checkbox" className="mt-1 w-5 h-5 accent-[#1F4D3A]" checked={selectedIds.includes(a.id)} onChange={() => setChosen(selectedIds.includes(a.id) ? selectedIds.filter((x) => x !== a.id) : [...selectedIds, a.id])} />
                  <div>
                    <p className="font-semibold text-navy">{a.label} <Pill tone="sky">{pretty(a.category)}</Pill></p>
                    <p className="mt-1 text-[15px]">{a.language.replaceAll('{child}', name)}</p>
                    <p className="mt-2 text-xs text-forest font-semibold">{a.legal_basis.map((id) => polById[id]?.citation).filter(Boolean).join(' · ')}</p>
                    <p className="mt-1 text-xs text-ink/80">Bring: {a.data_to_bring.join('; ').replaceAll('{child}', name)}</p>
                  </div>
                </div>
              </label>
            ))}
            {!visible.length && <p>Pick at least one area above.</p>}
          </div>
          <div>
            <p className="label mb-2">Your draft ({picked.length} items)</p>
            {document.documentElement.lang !== 'en' && <p className="text-sm mb-2">This draft stays in English so you can share it with your school.</p>}
            <pre tabIndex={0} className="whitespace-pre-wrap rounded-2xl bg-cream-2 p-5 text-[15px] leading-relaxed font-sans max-h-[460px] overflow-auto">{doc}</pre>
            <div className="flex flex-wrap gap-3 mt-3">
              <CopyButton text={doc} label="Copy accommodations" />
              <button className="btn-primary !py-1.5 text-sm" onClick={() => askCopilot(`Draft a warm, firm email requesting an ${stage === '504' ? 'Section 504' : stage.toUpperCase()} meeting for ${child.trim() || 'my child'} to discuss: ${picked.map((a) => a.label).join('; ')}. Cite the relevant federal rights.`)}>Draft my meeting-request email ✨</button>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 md:p-8 bg-marigold-soft !border-marigold" aria-labelledby="chk">
        <h3 id="chk" className="font-display text-2xl text-navy">Pre-meeting checklist · {STAGES.find((s) => s[0] === stage)[1]}</h3>
        <ul className="mt-4 grid md:grid-cols-2 gap-x-8 gap-y-2">
          {(checklists[stage] || []).map((c) => (
            <li key={c}><label className="flex gap-3 items-start cursor-pointer"><input type="checkbox" className="mt-1 w-5 h-5 accent-[#1F4D3A]" checked={done.includes(c)} onChange={() => setDone(done.includes(c) ? done.filter((x) => x !== c) : [...done, c])} /><span className={done.includes(c) ? 'line-through text-ink/80' : ''}>{c}</span></label></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lib">
        <h3 id="lib" className="font-display text-3xl text-navy">Know your rights library</h3>
        <div className="flex flex-wrap gap-4 items-end mt-4">
          <label className="block w-72"><span className="label block mb-1">Search</span><input className="input" value={pq} onChange={(e) => setPq(e.target.value)} placeholder="transportation, assistive tech…" /></label>
          <Chips label="Law" value={law} onChange={setLaw} options={lawOptions.map((l) => [l, l])} />
        </div>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
          {polRows.map((p) => (
            <article key={p.id} data-id={p.id} className="card p-5">
              <div className="flex flex-wrap gap-1.5"><Pill tone="navy">{p.law}</Pill><Pill tone="gold">Ages {p.ages}</Pill></div>
              <h4 className="font-display text-xl text-navy mt-2">{p.title}</h4>
              <p className="text-sm font-semibold text-forest">{p.citation}</p>
              <p className="mt-2">{p.plain_language}</p>
              <p className="mt-2 text-sm"><strong>Use it when:</strong> {p.use_it_when}</p>
              <div className="mt-3 rounded-xl bg-cream-2 p-3 text-sm"><p className="italic">“{p.sample_language}”</p><div className="mt-2"><CopyButton text={p.sample_language} label="Copy language" /></div></div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink/80">General information, not legal advice. For disputes, your state's Parent Training and Information Center or a special education advocate can help.</p>
      </section>
    </div>
  )
}
