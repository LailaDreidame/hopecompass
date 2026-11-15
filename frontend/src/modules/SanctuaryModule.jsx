import { useEffect, useState } from 'react'
import { ModuleHeader, Chips, Pill, WebLinks, pretty } from '../components/ui.jsx'

const AUD = [['grandparents', 'Grandparents'], ['foster_resource', 'Foster & resource'], ['kinship', 'Kinship'], ['bipoc', 'BIPOC caregivers'], ['male_caregivers', 'Dads, granddads & uncles'], ['spanish_speaking', 'En español'], ['lgbtq', 'LGBTQ+ families'], ['siblings', 'Siblings'], ['young_adult_transition', 'Young-adult transition']]

function ResetPlayer({ reset }) {
  const [left, setLeft] = useState(null)
  useEffect(() => {
    if (left === null || left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const running = left !== null && left > 0
  const stepIdx = running ? Math.min(reset.steps.length - 1, Math.floor(((300 - left) / 300) * reset.steps.length)) : -1
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6 items-center">
      <div className="relative w-52 h-52 mx-auto" aria-hidden="true">
        <div className={`absolute inset-0 rounded-full bg-marigold-soft ${running ? 'anim-breathe' : ''}`} />
        <div className={`absolute inset-8 rounded-full bg-marigold/70 ${running ? 'anim-breathe' : ''}`} style={{ animationDelay: '.3s' }} />
        <div className="absolute inset-0 flex items-center justify-center font-display text-3xl text-navy">
          {running ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : left === 0 ? 'You did it 💛' : '5:00'}
        </div>
      </div>
      <div>
        <h4 className="font-display text-2xl text-navy">{reset.title}</h4>
        <p className="text-sm text-forest font-medium">Best for: {reset.best_for}</p>
        <ol className="mt-3 space-y-1.5">{reset.steps.map((s, i) => <li key={s} className={`rounded-xl px-3 py-1.5 transition ${i === stepIdx ? 'bg-forest text-cream' : ''}`}>{i + 1}. {s}</li>)}</ol>
        <div className="mt-4 flex gap-3">
          <button className="btn-primary" onClick={() => setLeft(300)}>{running ? 'Restart' : 'Start 5 minutes'}</button>
          {running && <button className="btn-ghost" onClick={() => setLeft(null)}>Stop</button>}
        </div>
        <p className="sr-only" aria-live="polite">{running ? `Step ${stepIdx + 1}: ${reset.steps[stepIdx]}` : ''}</p>
      </div>
    </div>
  )
}

export default function SanctuaryModule({ data, askCopilot }) {
  const { respite_grants: respite, support_groups: groups, resets } = data.sanctuary
  const [aud, setAud] = useState(null)
  const [ri, setRi] = useState(0)
  const rows = groups.filter((g) => !aud || g.audience.includes(aud))

  return (
    <div className="space-y-10">
      <ModuleHeader kind="sanctuary" eyebrow="Module 6 · Caregiver Sanctuary" title="Putting your oxygen mask on first">
        You carry so much. Here's respite money, people who get it, and five-minute resets you can do in the car line.
      </ModuleHeader>

      <section className="card p-6 md:p-8" aria-labelledby="resets">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="resets" className="font-display text-3xl text-navy">Quick 5-minute resets</h3>
          <div className="flex flex-wrap gap-2">{resets.map((r, i) => <button key={r.id} onClick={() => setRi(i)} className={`chip ${i === ri ? 'chip-on' : 'chip-off'}`}>{r.title}</button>)}</div>
        </div>
        <div className="mt-6"><ResetPlayer key={resets[ri].id} reset={resets[ri]} /></div>
      </section>

      <section aria-labelledby="groups">
        <h3 id="groups" className="font-display text-3xl text-navy">Your people: support circles</h3>
        <p className="mt-1">Dedicated spaces, because a grandmother raising a grandson and a young foster dad need different rooms sometimes.</p>
        <div className="mt-4"><Chips label="Audience" value={aud} onChange={setAud} options={AUD} /></div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
          {rows.map((g) => (
            <article key={g.id} data-id={g.id} className="card p-5">
              <div className="flex flex-wrap gap-1.5"><Pill tone="sky">{pretty(g.format)}</Pill>{g.real_org ? <Pill tone="forest">Real organization</Pill> : <Pill tone="terra">Sample listing</Pill>}</div>
              <h4 className="font-display text-xl text-navy mt-2">{g.name}</h4>
              <p className="text-sm text-ink/85">{[g.city, g.state].filter(Boolean).join(', ') || 'Online'} · {g.schedule}</p>
              <p className="mt-2">{g.description}</p>
              <p className="mt-2 text-xs text-forest font-semibold">{g.audience.map((a) => AUD.find(([k]) => k === a)?.[1] || pretty(a)).join(' · ')}</p>
              <WebLinks className="mt-3" url={g.url} name={g.name} real={g.real_org} place={[g.city, g.state].filter(Boolean).join(', ')} similar={g.real_org ? null : `${g.audience.map((a) => AUD.find(([k]) => k === a)?.[1] || a).join(' ')} support group caregivers children disabilities ${g.format === 'virtual' ? 'online' : [g.city, g.state].filter(Boolean).join(' ')}`} />
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="respite">
        <h3 id="respite" className="font-display text-3xl text-navy">Respite care grant finder</h3>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
          {respite.map((r) => (
            <article key={r.id} data-id={r.id} className="card p-5">
              <div className="flex flex-wrap gap-1.5"><Pill tone="gold">{r.scope === 'national' ? 'National' : r.states.join(', ')}</Pill>{r.real_org ? <Pill tone="forest">Real organization</Pill> : <Pill tone="terra">Sample listing</Pill>}</div>
              <h4 className="font-display text-xl text-navy mt-2">{r.name}</h4>
              <p className="mt-1">{r.what_they_offer}</p>
              <p className="mt-2 text-sm"><strong>Who qualifies:</strong> {r.eligibility}</p>
              <p className="mt-1 text-sm"><strong>How to apply:</strong> {r.how_to_apply}</p>
              <WebLinks className="mt-3" url={r.url} name={r.name} real={r.real_org} place={r.scope === 'national' ? '' : r.states.join(', ')} similar={r.real_org ? null : `respite care grant children with disabilities ${r.states.filter((x) => x !== 'ALL').join(' ')}`} />
            </article>
          ))}
        </div>
      </section>

      <section className="card p-8 bg-terracotta-soft !border-terracotta grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h3 className="font-display text-2xl text-navy">Running on empty?</h3>
          <p className="mt-1">Tell Joy Compass who you are and where you live. It will find respite funding and a circle of people who get it. If you are in crisis, call or text <strong>988</strong> any time.</p>
        </div>
        <button className="btn-primary" onClick={() => askCopilot("I'm a grandfather raising my grandson who uses a power chair in Philadelphia. I'm exhausted. Where can I find respite help and other grandparents to talk to?")}>Find me some support 💛</button>
      </section>
    </div>
  )
}
