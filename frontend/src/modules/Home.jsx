import { HeroScene, FamilyPortrait } from '../components/Illustrations.jsx'

// [key, emoji, menu label (matches the top menu button exactly), card title, description, color]
const MODULES = [
  ['map', '🗺️', 'Places to Thrive', 'Best Places to Live & Thrive', "See which cities make life easier for kids who roll, stroll or walk with help: curb cuts, inclusive playgrounds, Medicaid waivers, children's hospitals and schools.", 'bg-sky-soft'],
  ['play', '🎈', 'Joy & Play', 'Joy & Play Finder', 'Free and low-cost fun your kid can actually join: adaptive sports, sensory-friendly museum hours, rollable trails and splash pads.', 'bg-marigold-soft'],
  ['equipment', '🦽', 'Gear Navigator', 'Equipment & Gear Navigator', 'What to ask for, who to ask, what that Letter of Medical Necessity really means, and where to borrow, swap or get help paying.', 'bg-terracotta-soft'],
  ['iep', '📚', 'IEP & 504', 'IEP & 504 Powerhouse', "From early intervention to age 21: the right words for your child's IEP or 504, backed by the law, plus a checklist for meeting day.", 'bg-sky-soft'],
  ['providers', '🩺', 'Providers', 'Inclusive Provider Finder', 'Doctors and therapists who get it, speak your language and take your insurance, plus questions to ask at the first visit.', 'bg-marigold-soft'],
  ['sanctuary', '🌿', 'Sanctuary', 'Caregiver Sanctuary', 'Because you matter too: respite help, people who understand (grandparents, foster families, dads and uncles, and more) and 5-minute resets.', 'bg-terracotta-soft'],
]

// Light up the matching top-menu button while a card is hovered or focused.
const glow = (k, on) => document.querySelectorAll(`[data-nav="${k}"]`).forEach((el) => el.classList.toggle('nav-glow', on))

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
            Whether you're a grandparent, an aunt or uncle, a foster or kinship family, a guardian, or a parent, this is your place.
            Find something fun for Saturday, the right gear, a doctor who gets it, and the words for your next IEP meeting, all in one spot.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="btn-primary text-lg" onClick={() => go('copilot')}>Ask Joy Compass 🧭</button>
            <button className="btn-ghost text-lg" onClick={() => go('play')}>Find something fun this weekend</button>
          </div>
          <p className="mt-4 text-sm text-ink/80">Ask a question in your own words and get a clear, kind response in about 30 seconds. We double-check every answer for safety and accuracy.</p>
        </div>
        <div className="card p-3 anim-pop" style={{ animationDelay: '.1s' }}><HeroScene /></div>
      </section>

      <section aria-labelledby="founder" className="card p-7 md:p-9 grid md:grid-cols-[auto_1fr] gap-6 items-start !bg-white">
        <div className="w-16 h-16 rounded-full bg-forest text-cream font-display text-2xl flex items-center justify-center" aria-hidden="true">LD</div>
        <div>
          <p className="label">A note from our founder</p>
          <h2 id="founder" className="font-display text-2xl md:text-3xl text-navy mt-1">I built this for you, because I needed it too.</h2>
          <div className="mt-3 space-y-3 text-[17px] leading-relaxed text-ink/90 max-w-3xl">
            <p>As a working mom and a caregiver to our son, who lives with cerebral palsy and uses a wheelchair, I know what it's like to need a little help. Even the small things, like finding a playground he can actually roll onto or planning a fun Saturday, can feel like a second job.</p>
            <p>I created Joy Risers to take a little of that weight off your shoulders. A bit of extra time and support can mean everything.</p>
            <p>Some days we do this with grace, and some days in a beautiful mess. Both count. You're not alone.</p>
          </div>
          <p className="mt-4 font-display text-xl text-forest" translate="no">Laila Dreidame</p>
          <p className="text-sm text-ink/80">Founder, Joy Risers</p>
        </div>
      </section>

      <section aria-labelledby="mods">
        <h2 id="mods" className="font-display text-3xl text-navy mb-6">Six ways we've got your back</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(([k, emoji, menu, title, text, bg], i) => (
            <button key={k} onClick={() => go(k)} onMouseEnter={() => glow(k, true)} onMouseLeave={() => glow(k, false)} onFocus={() => glow(k, true)} onBlur={() => glow(k, false)}
              className="card text-left p-6 hover:-translate-y-1 hover:shadow-xl hover:border-dodger transition group anim-pop" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex w-12 h-12 items-center justify-center rounded-2xl text-2xl ${bg}`} aria-hidden="true">{emoji}</span>
                {/* Same look as the top menu button, so the card and menu match one-to-one */}
                <span className="rounded-full bg-forest text-cream px-3 py-1.5 text-sm font-semibold whitespace-nowrap">{menu}<span className="sr-only"> in the top menu</span></span>
              </div>
              <h3 className="font-display text-xl text-navy mt-4">{title}</h3>
              <p className="mt-2 text-ink/90">{text}</p>
              <span className="mt-3 inline-block font-semibold text-forest group-hover:underline">Open {menu} →</span>
            </button>
          ))}
        </div>
      </section>

      {profiles.length > 0 && (
        <section aria-labelledby="fams">
          <h2 id="fams" className="font-display text-3xl text-navy">Families like yours</h2>
          <p className="text-ink/80 mt-1 mb-6 text-sm">Illustrated, fictional families, inspired by the many kinds of families we built this for.</p>
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
