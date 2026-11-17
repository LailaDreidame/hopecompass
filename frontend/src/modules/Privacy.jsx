// Plain-language privacy note. Keep it accurate to how the app actually works (see backend/telemetry.py,
// backend/i18n.py, backend/safety.py and the localStorage keys in the frontend).
export default function Privacy({ go }) {
  const H = ({ children }) => <h2 className="font-display text-2xl text-navy mt-8 mb-2">{children}</h2>
  return (
    <article className="max-w-3xl">
      <p className="label mb-2">Privacy · Beta</p>
      <h2 className="font-display text-4xl md:text-5xl text-navy">Your privacy, in plain words</h2>
      <p className="mt-2 text-sm text-ink/85">Last updated: November 15, 2026</p>

      <div className="card p-6 mt-6 !bg-sky-soft">
        <p className="font-semibold text-navy text-lg">The short version</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5 text-[17px]">
          <li>No accounts, no ads, no tracking cookies or analytics, and we never sell anything about you.</li>
          <li>Please don't type names, birthdays, addresses or medical record details into Ask Hope. Describe the situation instead ("my 8-year-old who uses a wheelchair").</li>
          <li>Ask Hope is general information, not medical or legal advice. In an emergency call 911; for crisis support call or text 988.</li>
        </ul>
      </div>

      <H>When you ask Hope a question</H>
      <p className="text-[17px] leading-relaxed">Your question is sent through our AI gateway (Portkey) to an OpenAI language model, which writes the answer. Those companies process the text under their own terms. Our server keeps a record of each question (a short excerpt of your question, the answer, the helpers' working notes, and cost and safety details) so we can watch costs and catch problems. On our current host these records are temporary: they are cleared when the server restarts.</p>

      <H>When you switch languages</H>
      <p className="text-[17px] leading-relaxed">The text on the page, not your personal information, is sent to the same AI to be translated. Translations are saved so the site is faster for everyone. Translations are machine-made and may contain mistakes.</p>

      <H>What stays on your device</H>
      <p className="text-[17px] leading-relaxed">Your browser remembers your language, your dataset choice, checklist ticks and the breathing-break timer so the site feels the same next time. A random session number (cleared when you close the tab) is sent with Ask Hope questions only to enforce fair-use limits. You can clear all of this anytime by clearing your browser's site data.</p>

      <H>Safety and fair use</H>
      <p className="text-[17px] leading-relaxed">To prevent abuse and runaway costs, we briefly use your IP address to limit how many questions one visitor can ask per hour. Our hosting provider (Render) also keeps standard server logs, such as IP addresses, for security.</p>

      <H>Links to other websites</H>
      <p className="text-[17px] leading-relaxed">Website, map and search buttons open other sites (such as program websites, Google Maps or Google Search), which have their own privacy policies.</p>

      <H>Who this is for</H>
      <p className="text-[17px] leading-relaxed">Hope Compass is for adult caregivers. Please don't let children type personal details into the site.</p>

      <H>About this beta</H>
      <p className="text-[17px] leading-relaxed">Hope Compass began as a student project (MGT 409, Yale School of Management) and is still growing. Some listings are samples, so always confirm details before you go. We'll update this note as the site changes.</p>

      <button className="btn-primary mt-8" onClick={() => go('home')}>Back to Hope Compass</button>
    </article>
  )
}
