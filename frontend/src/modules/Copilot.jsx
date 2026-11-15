import { useEffect, useRef, useState } from 'react'
import { Markdown, Pill, CopyButton } from '../components/ui.jsx'
import { fmtInt, fmtUSD } from '../api.js'

const SUGGESTIONS = [
  "I'm an aunt raising my 7-year-old nephew who uses a manual wheelchair in Denver. Money is tight. What can we do this weekend that's free and genuinely fun?",
  "My granddaughter (5) starts kindergarten in a power wheelchair in Atlanta. What accommodations should we ask for in her first IEP, and can you draft the meeting request email?",
  "Our foster son (11) needs a stander and Medicaid denied it. How do we appeal, and are there loan closets or grants in Texas?",
  "We're thinking about moving from Phoenix. Our teen uses a power chair. Compare Seattle and Minneapolis for us.",
  "My daughter is 17, blind, and uses a white cane. What should her transition plan include before she turns 18?",
]

// Plain-English names for caregivers (Joy Compass page); the technical names stay in the Telemetry drawer.
export const PLAIN = {
  guard: ['Step 1', 'Safety check', 'Making sure your question is safe to answer'],
  intake: ['Step 2', 'Understanding your question', 'Figuring out what you need most'],
  advocate: ['Helper', 'Rights & equipment helper', 'Looking up school rights, gear and funding'],
  scout: ['Helper', 'Fun, places & doctors helper', 'Finding activities, cities and providers'],
  editor: ['Step 3', 'Friendly editor', 'Making it warm, clear and accurate'],
  verify: ['Step 4', 'Fact check', 'Keeping only info from our trusted guides'],
}
const PLAIN_STATUS = { running: 'Working…', done: 'Done ✓', blocked: 'Stopped for safety', skipped: 'Not needed', error: 'Hiccup', idle: 'Waiting', notrun: 'Not needed' }

export const PIPELINE = [
  ['guard', 'Layer 0', 'Code guardrails', 'Budget, runaway, injection & medical pre-checks'],
  ['intake', 'Agent 1', 'Intake & Safety Router', 'Detects intent, flags attacks, routes'],
  ['advocate', 'Agent 2', 'Rights, IEP & Equipment Advocate', 'Policy, accommodation & grant tools'],
  ['scout', 'Agent 3', 'Joy, Play & Hotspot Scout', 'Activity, city & provider tools'],
  ['editor', 'Agent 4', 'Empathy & Verification Editor', 'Warm, inclusive, no diagnoses'],
  ['verify', 'Layer 5', 'Code verification', 'Allowed sources only, scrubbers'],
]

const STATUS = {
  running: ['bg-dodger-soft border-dodger', 'Working…'], done: ['bg-forest text-cream border-forest', 'Done'],
  blocked: ['bg-terracotta text-white border-terracotta', 'Blocked'], skipped: ['bg-cream-2 border-sand text-ink/85', 'Skipped'],
  error: ['bg-terracotta-soft border-terracotta', 'Error'], idle: ['bg-white border-sand', 'Waiting'],
  notrun: ['bg-cream-2 border-sand text-ink/85 border-dashed', 'Not run'],
}

export function PipelineView({ steps, compact = false, finished = false, plain = false }) {
  return (
    <ol className={`grid gap-2 ${compact ? 'grid-cols-1' : plain ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3 xl:grid-cols-6'}`} aria-label="Agent pipeline">
      {PIPELINE.map(([id, ...tech]) => {
        const [tag, name, desc] = plain ? PLAIN[id] : tech
        const s = steps[id]; const st = s?.status || (finished ? 'notrun' : 'idle'); const [cls, techWord] = STATUS[st] || STATUS.idle
        const word = plain ? PLAIN_STATUS[st] : techWord
        const calls = s?.model_calls || []
        const tok = calls.reduce((a, c) => a + c.input_tokens + c.output_tokens, 0)
        return (
          <li key={id} className={`rounded-2xl border-2 ${plain ? 'p-2.5 md:p-3' : 'p-3'} transition ${cls} ${st === 'running' ? 'shimmer' : ''}`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider"><span>{tag}</span><span>{word}</span></div>
            <p className={`font-display leading-tight mt-1 ${plain ? 'text-[15px] md:text-[17px]' : 'text-[17px]'}`}>{name}</p>
            {!compact && <p className={`text-xs mt-1 opacity-90 ${plain ? 'hidden sm:block' : ''}`}>{desc}</p>}
            {!plain && s?.summary && <p className="text-xs mt-1.5 font-medium break-words">{s.summary}</p>}
            {!plain && (s?.tool_calls || []).map((t, i) => <p key={i} className="text-[11px] mt-1 font-mono break-all opacity-95">🔧 {t.tool} → {t.result_count}</p>)}
            {!plain && calls.length > 0 && <p className="text-[11px] mt-1 font-mono opacity-95">{calls.length} call{calls.length > 1 ? 's' : ''} · {fmtInt(tok)} tok · {s.latency_ms ?? '…'} ms</p>}
            {plain && (s?.tool_calls || []).length > 0 && <p className="text-xs mt-1">Checked {s.tool_calls.reduce((n, t) => n + t.result_count, 0)} trusted listings</p>}
          </li>
        )
      })}
    </ol>
  )
}

function Cards({ cards }) {
  if (!cards) return null
  const block = (title, rows, render) => rows?.length ? <div><p className="label mb-2">{title}</p><div className="grid sm:grid-cols-2 gap-3">{rows.map(render)}</div></div> : null
  return (
    <div className="space-y-5 mt-6">
      {block('Your plan', cards.plan, (p) => (
        <div key={p.source_id + p.when} className="rounded-2xl bg-marigold-soft p-4"><p className="text-xs font-bold text-forest">{p.when} · {p.cost}</p><p className="font-display text-lg text-navy">{p.activity}</p><p className="text-sm mt-1">{p.why_it_fits}</p><p className="text-xs mt-1">♿ {p.access_notes}</p></div>))}
      {block('City comparison', cards.city_comparison, (c) => (
        <div key={c.source_id} className="rounded-2xl bg-sky-soft p-4"><p className="font-display text-lg text-navy">{c.city} <span className="text-forest">· {c.overall}</span></p><p className="text-sm">⭐ {c.standout}</p><p className="text-sm">⚠️ {c.watch_out}</p></div>))}
      {block('Provider matches (sample listings)', cards.provider_matches, (p) => (
        <div key={p.source_id} className="rounded-2xl bg-white border border-sand p-4"><p className="font-semibold text-navy">{p.name}</p><p className="text-sm">{p.why}</p></div>))}
      {block('Support for you', cards.support_matches, (p) => (
        <div key={p.source_id} className="rounded-2xl bg-terracotta-soft p-4"><p className="font-semibold text-navy">{p.name}</p><p className="text-sm">{p.why}</p></div>))}
      {block('Programs, grants & loan closets', cards.program_matches, (p) => (
        <div key={p.source_id} className="rounded-2xl bg-white border border-sand p-4"><p className="font-semibold text-navy">{p.name}</p><p className="text-sm">{p.why}</p></div>))}
      {block('Your rights', cards.legal_citations, (c) => (
        <div key={c.source_id + c.citation} className="rounded-2xl bg-cream-2 p-4"><p className="font-semibold text-forest">{c.citation}</p><p className="text-sm">{c.plain}</p></div>))}
      {cards.know_before_you_go?.length > 0 && cards.plan?.length > 0 && <div><p className="label mb-2">Know before you go</p><ul className="grid sm:grid-cols-2 gap-1.5">{cards.know_before_you_go.map((k) => <li key={k}>✓ {k}</li>)}</ul></div>}
    </div>
  )
}

export default function Copilot({ copilot, prefill, setPrefill, openDrawer, config }) {
  const [text, setText] = useState(prefill || '')
  const ref = useRef(null)
  const answerRef = useRef(null)
  const [showIdeas, setShowIdeas] = useState(false)
  useEffect(() => { if (prefill) { setText(prefill); setPrefill(''); ref.current?.focus() } }, [prefill])
  const { running, steps, result, events, error } = copilot
  const asked = running || !!result || !!error   // once a question is sent, tuck the examples away
  const ans = result?.answer
  const t = result?.totals
  useEffect(() => { if (ans) setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150) }, [result])
  const submit = (e) => { e?.preventDefault(); if (text.trim() && !running) copilot.run({ message: text.trim() }) }

  return (
    <div className="space-y-8">
      <header className="grid lg:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <p className="label mb-2">Joy Compass · your caregiving guide</p>
          <h2 className="font-display text-4xl md:text-5xl text-navy">Ask anything. Get a clear next step.</h2>
          <p className="mt-3 text-lg max-w-3xl">Type your question the way you'd say it to a friend. We'll look it up in our trusted guides and send back a warm, clear answer: next steps, an email you can send if you need one, and where the information came from.</p>
          <p className="mt-2 text-ink/80">It takes about 15–30 seconds. We never give medical diagnoses or medication advice. For that, we'll point you to the right person.</p>
        </div>
        <button className="btn-ghost text-sm" onClick={openDrawer}>🔍 See how your answer was made</button>
      </header>
      {config?.provider === 'offline' && <p className="card p-4 bg-terracotta-soft">No API key found, so Joy Compass is in <strong>offline mode</strong> (local data only). Add PORTKEY_API_KEY or OPENAI_API_KEY to <code>.env</code> or <code>../.env</code> for the full 4-agent run.</p>}

      <form onSubmit={submit} className="card p-5 md:p-6">
        <label htmlFor="ask" className="label">What's on your plate? Ask in your own words</label>
        <textarea id="ask" ref={ref} className="input mt-2 h-28 text-lg" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
          enterKeyHint="send"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e) }}
          placeholder="e.g. My grandson uses a walker. What's fun and free near Chicago this Saturday?" />
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button className="btn-compass" disabled={running || !text.trim()}>{running ? 'Agents at work…' : 'Ask Joy Compass 🧭'}</button>
          <span className="text-sm text-ink/85">{text.length}/2000 · Press Enter to send · Shift + Enter for a new line</span>
        </div>
        <p className="mt-3 text-sm text-ink/85">🔒 Please don't include names, birthdays or medical record details. Your question goes to our AI providers (Portkey and OpenAI) to write your answer, and we keep a temporary record for safety and cost. <a href="#privacy" className="underline font-semibold">Privacy note</a></p>
        {(!asked || showIdeas) ? (
          <div className="mt-4">
            {asked && <p className="label mb-2">Example questions</p>}
            <div className="flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <button type="button" key={s} onClick={() => { setText(s); setShowIdeas(false); ref.current?.focus() }} className="chip chip-off text-left">{s.length > 70 ? s.slice(0, 68) + '…' : s}</button>)}</div>
          </div>
        ) : (
          <button type="button" className="mt-3 text-sm font-semibold text-forest underline" onClick={() => setShowIdeas(true)}>💡 Show example questions</button>
        )}
      </form>

      {(running || result) && <section aria-live="polite" aria-label="Progress"><PipelineView plain steps={steps} finished={!running && !!result} /></section>}
      {events.some((e) => ['prompt_injection', 'runaway', 'budget', 'answer_blocked', 'secret_leak', 'medical_advice_request', 'crisis'].includes(e.type)) && (
        <p className="text-sm text-terracotta-ink">🛡️ Our safety check stepped in on this one. <button className="underline" onClick={openDrawer}>See why</button></p>
      )}
      {error && !running && (
        <div className="card p-5 bg-terracotta-soft !border-terracotta flex flex-wrap items-center gap-4" role="alert">
          <div className="flex-1 min-w-60">
            <p className="font-display text-xl text-navy">We lost the connection for a moment 🌿</p>
            <p className="mt-1">Your question is safe in the box above. This can happen if the Wi‑Fi blips or the phone screen locks while the agents are working (it takes about 15–30 seconds).</p>
          </div>
          <button className="btn-primary" onClick={copilot.retry}>Try again</button>
        </div>
      )}

      {ans && (
        <article ref={answerRef} className={`card p-6 md:p-8 anim-pop scroll-mt-28 ${ans.mode === 'blocked' ? '!bg-terracotta-soft' : ''}`}>
          <div className="flex flex-wrap gap-2 mb-2">
            {ans.mode === 'safe_redirect' && <Pill tone="terra">Medical question: here's who can help</Pill>}
            {ans.mode === 'blocked' && <Pill tone="terra">Kept you safe</Pill>}
            {ans.mode === 'offline' && <Pill tone="gold">Offline mode</Pill>}
            {ans.sources?.length > 0 && <Pill tone="forest">✓ Checked against our trusted listings</Pill>}
          </div>
          <div translate={ans.lang && ans.lang !== 'en' ? 'no' : undefined}>
          <h3 className="font-display text-3xl text-navy">{ans.headline}</h3>
          <div className="mt-3 text-[17px]"><Markdown text={ans.message_markdown} /></div>
          </div>
          {ans.draft_email && (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-forest p-5 bg-white" translate="no">
              <div className="flex items-center justify-between gap-3"><p className="label">Draft email · review before sending</p><CopyButton text={`Subject: ${ans.draft_email.subject}\n\n${ans.draft_email.body}`} label="Copy email" /></div>
              <p className="font-semibold mt-2">Subject: {ans.draft_email.subject}</p>
              <pre className="whitespace-pre-wrap font-sans mt-2 leading-relaxed">{ans.draft_email.body}</pre>
            </div>
          )}
          {ans.action_checklist?.length > 0 && (
            <div className="mt-6"><p className="label mb-2">Your next steps</p>
              <ul className="space-y-1.5" translate={ans.lang && ans.lang !== 'en' ? 'no' : undefined}>{ans.action_checklist.map((a) => <li key={a}><label className="flex gap-3 items-start"><input type="checkbox" className="mt-1 w-5 h-5 accent-[#1F4D3A]" /><span>{a}</span></label></li>)}</ul>
            </div>
          )}
          <Cards cards={ans.cards} />
          {ans.sources?.length > 0 && (
            <div className="mt-6"><p className="label mb-2">Where this came from (tap to open)</p>
              <div className="flex flex-wrap gap-2">{ans.sources.map((s) => <a key={s.source_id} href={`#${s.module}`} className="chip bg-dodger-soft text-dodger-ink border-dodger/40 hover:underline">📎 {s.label}</a>)}</div>
            </div>
          )}
          {t && <p className="mt-6 text-sm text-ink/80">Answered in {(result.latency_ms / 1000).toFixed(0)} seconds · <button className="underline" onClick={openDrawer}>see how it was made</button></p>}
        </article>
      )}
    </div>
  )
}
