import { HeroScene, FamilyPortrait } from '../components/Illustrations.jsx'

const MODULES = [
  ['map', '🗺️', 'Best Places to Live & Thrive', 'An interactive U.S. hotspot map scoring curb cuts, inclusive playgrounds, waivers, pediatric specialists and schools.', 'bg-sky-soft'],
  ['play', '🎈', 'Joy & Play Finder', 'Free and low-cost adaptive sports, sensory-friendly hours, rollable trails and splash pads, filtered for your kid.', 'bg-marigold-soft'],
  ['equipment', '🦽', 'Equipment & Gear Navigator', 'What to ask for, who to ask, a Letter of Medical Necessity decoder, and where to borrow, swap or fund gear.', 'bg-terracotta-soft'],
  ['iep', '📚', 'IEP & 504 Powerhouse', 'From Early Intervention to transition at 21: accommodation language grounded in the law, plus a meeting-prep checklist.', 'bg-sky-soft'],
  ['providers', '🩺', 'Inclusive Provider Finder', 'Disability-competent, culturally responsive clinicians with Medicaid filters and green-flag questions for visit one.', 'bg-marigold-soft'],
  ['sanctuary', '🌿', 'Caregiver Sanctuary', 'Respite grants, support circles for grandparents, foster, BIPOC and male caregivers, and 5-minute resets.', 'bg-terracotta-soft'],
]

export default function Home({ data, go, askCopilot }) {
  const profiles = data?.profiles?.profiles || []
  return (
    <div className="space-y-16">
      <section className="grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
        <div className="anim-pop">
          <p className="label mb-3">For every caregiver of a child 0–21 with a physical disability</p>
          <h1 className="font-display text-5xl md:text-6xl text-navy leading-[1.05]">
            Raise them <span className="text-forest italic">joyfully</span>.<br />Rest a little, too.
          </h1>
          <p className="mt-5 text-xl text-ink/90 leading-relaxed max-w-xl">
            Grandparents, aunts and uncles, foster and kinship families, guardians, parents of every shape: this is your sanctuary.
            Find places to thrive, things to do this Saturday, the gear your kid needs, and the words for your next IEP meeting.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="btn-primary text-lg" onClick={() => go('copilot')}>Ask the Co-Pilot ✨</button>
            <button className="btn-ghost text-lg" onClick={() => go('play')}>Find something fun this weekend</button>
          </div>
          <p className="mt-4 text-sm text-ink/80">Ask a question in your own words and get a clear, kind plan back in about 30 seconds. Every answer is double-checked for safety and accuracy.</p>
        </div>
        <div className="card p-3 anim-pop" style={{ animationDelay: '.1s' }}><HeroScene /></div>
      </section>

      <section aria-labelledby="mods">
        <h2 id="mods" className="font-display text-3xl text-navy mb-6">Six ways we've got your back</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(([k, emoji, title, text, bg], i) => (
            <button key={k} onClick={() => go(k)} className="card text-left p-6 hover:-translate-y-1 hover:shadow-xl hover:border-dodger transition group anim-pop" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className={`inline-flex w-12 h-12 items-center justify-center rounded-2xl text-2xl ${bg}`} aria-hidden="true">{emoji}</span>
              <h3 className="font-display text-xl text-navy mt-4">{title}</h3>
              <p className="mt-2 text-ink/90">{text}</p>
              <span className="mt-3 inline-block font-semibold text-forest group-hover:underline">Open →</span>
            </button>
          ))}
        </div>
      </section>

      {profiles.length > 0 && (
        <section aria-labelledby="fams">
          <h2 id="fams" className="font-display text-3xl text-navy">Families like yours</h2>
          <p className="text-ink/80 mt-1 mb-6 text-sm">Illustrated personas (fictional), the many shapes of the families we built this for.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {profiles.map((p) => (
              <figure key={p.id} className="card p-5 flex flex-col">
                <FamilyPortrait avatar={p.avatar} mobility={p.child_mobility} />
                <blockquote className="mt-3 text-ink/90 italic flex-1">“{p.quote}”</blockquote>
                <figcaption className="mt-3 text-sm"><strong className="text-navy">{p.caregiver_name}</strong> · {p.caregiver_role}<br /><span className="text-ink/80">{p.child_name}, {p.child_age} · {p.child_mobility}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="card p-8 md:p-10 bg-forest text-cream grid md:grid-cols-[1fr_auto] gap-6 items-center !border-forest">
        <div>
          <h2 className="font-display text-3xl">Tell us what's on your plate. We'll take a piece of it.</h2>
          <p className="mt-2 text-cream/90 text-lg">“My granddaughter starts kindergarten in a power chair. What should be in her IEP?”</p>
        </div>
        <button className="btn-gold text-lg" onClick={() => askCopilot("My granddaughter (5) starts kindergarten in a power wheelchair in Atlanta. What accommodations should we ask for in her first IEP, and can you draft the meeting request email?")}>Try this question →</button>
      </section>
    </div>
  )
}
