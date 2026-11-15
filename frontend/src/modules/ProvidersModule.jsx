import { useMemo, useState } from 'react'
import { ModuleHeader, Chips, Select, Pill, WebLinks, SPECIALTY_LABELS } from '../components/ui.jsx'

export default function ProvidersModule({ data, askCopilot }) {
  const { providers, green_flag_questions: gfq } = data.providers
  const [q, setQ] = useState('')
  const [spec, setSpec] = useState(null)
  const [ins, setIns] = useState(null)
  const [lang, setLang] = useState(null)
  const [city, setCity] = useState(null)
  const [tele, setTele] = useState(false)
  const [open, setOpen] = useState(false)
  const insurers = useMemo(() => [...new Set(providers.flatMap((p) => p.insurance))].sort(), [providers])
  const langs = useMemo(() => [...new Set(providers.flatMap((p) => p.languages))].sort(), [providers])
  const cities = useMemo(() => [...new Map(providers.map((p) => [p.hotspot_id, `${p.city}, ${p.state}`])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [providers])

  const rows = providers.filter((p) => (!spec || p.specialty === spec) && (!ins || p.insurance.includes(ins)) && (!lang || p.languages.includes(lang)) &&
    (!city || p.hotspot_id === city) && (!tele || p.telehealth) && (!open || p.accepting_new) &&
    (!q || `${p.name} ${p.practice} ${p.city} ${p.green_flags.join(' ')}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <div className="space-y-10">
      <ModuleHeader kind="providers" eyebrow="Module 5 · Inclusive Pediatric Physician & Therapist Finder" title="Care that sees your whole kid">
        Pediatricians, physiatrists, PTs, OTs and orthotists vetted for disability-competent, culturally responsive care, with Medicaid and insurance filters.
      </ModuleHeader>

      <div className="card p-5 md:p-6 space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <label className="block md:col-span-1"><span className="label block mb-1">Search</span><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ceiling lift, ASL, seating…" /></label>
          <Select label="City" value={city} onChange={setCity} options={[['', 'Anywhere'], ...cities]} />
          <Select label="Insurance" value={ins} onChange={setIns} options={[['', 'Any insurance'], ...insurers.map((i) => [i, i])]} />
          <Select label="Language" value={lang} onChange={setLang} options={[['', 'Any language'], ...langs.map((l) => [l, l])]} />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Chips label="Specialty" value={spec} onChange={setSpec} options={Object.entries(SPECIALTY_LABELS)} />
          <label className="flex items-center gap-2 font-medium"><input type="checkbox" className="w-5 h-5 accent-[#1F4D3A]" checked={tele} onChange={(e) => setTele(e.target.checked)} />Telehealth</label>
          <label className="flex items-center gap-2 font-medium"><input type="checkbox" className="w-5 h-5 accent-[#1F4D3A]" checked={open} onChange={(e) => setOpen(e.target.checked)} />Accepting new patients</label>
        </div>
      </div>

      <div>
        <p className="mb-3 font-semibold text-navy" aria-live="polite">{rows.length} providers · <span className="font-normal text-ink/80">fictional sample listings for this demo</span></p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rows.map((p) => (
            <article key={p.id} data-id={p.id} className="card p-5 flex flex-col">
              <div className="flex flex-wrap gap-1.5"><Pill tone="navy">{SPECIALTY_LABELS[p.specialty]}</Pill>{p.accepting_new && <Pill tone="forest">Accepting new</Pill>}{p.telehealth && <Pill tone="sky">Telehealth</Pill>}</div>
              <h3 className="font-display text-xl text-navy mt-2">{p.name}, {p.credentials}</h3>
              <p className="text-sm">{p.practice} · {p.city}, {p.state}</p>
              <p className="mt-2 italic text-ink/90">“{p.care_philosophy}”</p>
              <p className="label mt-3">Green flags</p>
              <ul className="mt-1 space-y-1 text-[15px] flex-1">{p.green_flags.map((g) => <li key={g}>🟢 {g}</li>)}</ul>
              <p className="mt-3 text-sm"><strong>Insurance:</strong> {p.insurance.join(', ')}</p>
              <p className="text-sm"><strong>Languages:</strong> {p.languages.join(', ')}</p>
              <WebLinks className="mt-3" name={p.name} place={p.city} similar={`pediatric ${SPECIALTY_LABELS[p.specialty].toLowerCase()} accepting ${ins || (p.insurance.includes('Medicaid') ? 'Medicaid' : p.insurance[0])} ${p.city} ${p.state}`} />
            </article>
          ))}
        </div>
      </div>

      <section className="card p-6 md:p-8 bg-sky-soft !border-sky" aria-labelledby="gf">
        <h3 id="gf" className="font-display text-3xl text-navy">Green Flag Questions to ask at your first visit</h3>
        <p className="mt-1">Print these, screenshot them, or read them from your phone in the waiting room. Good providers love these questions.</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
          {gfq.map((c) => (
            <div key={c.category} className="rounded-2xl bg-white p-5">
              <p className="font-display text-lg text-navy">{c.category}</p>
              <p className="text-sm text-forest font-medium mt-1">{c.why}</p>
              <ul className="mt-2 space-y-1.5">{c.questions.map((x) => <li key={x}>💬 {x}</li>)}</ul>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-6" onClick={() => askCopilot('Help me find a disability-competent physiatrist who takes Medicaid and speaks Spanish, and tell me what to ask at the first visit.')}>Ask the Scout to find my match ✨</button>
      </section>
    </div>
  )
}
