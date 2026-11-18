import { useEffect, useRef, useState } from 'react'

// Breathing break schedule (counts only *active* time: tab visible + mouse/keyboard/touch/scroll in
// the last 2 minutes):
//   1st pop-up after 30 active minutes  →  2nd pop-up after another 60 active minutes  →  then none,
//   at most TWO pop-ups per 24 hours (the 24 h window starts when the first one appears).
// Either button (or Escape) closes it. State is saved in localStorage, so refreshing the page,
// switching pages or closing the tab doesn't restart the clock or re-show it early.
// Demo / screenshot shortcut: ?breathe=5 → 1st after 5 s, 2nd after 10 more s, then none (not saved).
const IDLE_MS = 2 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const KEY = 'hc-breathe-v2'
const MAX_PER_DAY = 2

const fresh = () => ({ active: 0, shown: 0, windowStart: null })

function load(demo) {
  if (demo) return fresh()
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') || fresh()
    if (s.windowStart && Date.now() - s.windowStart >= DAY_MS) return fresh()   // 24 h passed: start over
    return s
  } catch { return fresh() }
}

export default function BreathePopup() {
  const demo = (() => { const s = new URLSearchParams(location.search).get('breathe'); return s ? Math.max(1, +s) : null })()
  const FIRST = demo ?? 30 * 60          // seconds of active use before the 1st pop-up
  const SECOND = demo ? demo * 2 : 60 * 60  // seconds of active use after the 1st, before the 2nd
  const [show, setShow] = useState(false)
  const st = useRef(load(demo))
  const lastInput = useRef(Date.now())
  const audio = useRef(null)
  const closeBtn = useRef(null)
  const showing = useRef(false)

  const persist = () => { if (!demo) localStorage.setItem(KEY, JSON.stringify(st.current)) }
  const dismiss = () => {
    showing.current = false
    setShow(false)
    st.current.active = 0                // the next one (if any) needs another full hour of active use
    persist()
  }

  useEffect(() => {
    const mark = () => { lastInput.current = Date.now() }
    const evs = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart']
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    const tick = setInterval(() => {
      const s = st.current
      if (s.windowStart && Date.now() - s.windowStart >= DAY_MS) { st.current = fresh(); persist(); return }
      if (showing.current || s.shown >= MAX_PER_DAY) return     // done for today
      if (document.visibilityState === 'visible' && Date.now() - lastInput.current < IDLE_MS) s.active += 1
      if (s.active % 15 === 0) persist()
      if (s.active >= (s.shown === 0 ? FIRST : SECOND)) {
        s.shown += 1
        if (!s.windowStart) s.windowStart = Date.now()
        persist()
        showing.current = true
        setShow(true)
        try { audio.current = audio.current || new Audio('/ding_ding_ding.wav'); audio.current.volume = 0.6; audio.current.currentTime = 0; audio.current.play().catch(() => {}) } catch { /* sound is optional */ }
      }
    }, 1000)
    return () => { clearInterval(tick); evs.forEach((e) => window.removeEventListener(e, mark)) }
  }, [])

  useEffect(() => { if (show) closeBtn.current?.focus() }, [show])
  useEffect(() => { const f = (e) => e.key === 'Escape' && showing.current && dismiss(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [])
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/45" role="dialog" aria-modal="true" aria-labelledby="breathe-title">
      <div className="relative w-full max-w-lg rounded-[2rem] bg-cream p-8 text-center shadow-2xl anim-pop border-4 border-marigold-soft">
        <div className="relative w-40 h-40 mx-auto" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-dodger-soft anim-breathe" />
          <div className="absolute inset-5 rounded-full bg-marigold-soft anim-breathe" style={{ animationDelay: '.4s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-5xl">💛</div>
        </div>
        <p className="label mt-5">You've been at this for a while</p>
        <h2 id="breathe-title" className="font-display text-3xl text-navy mt-2">Pause. Breathe with me.</h2>
        <p className="mt-3 text-lg text-ink/90">In for four… hold… out for six. Let your shoulders drop.</p>
        <p className="mt-4 text-[17px] leading-relaxed text-ink">
          The person who built this has been in your shoes. You will get through this, sometimes with grace,
          and other times in a beautiful mess. Both count. Both are love.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button ref={closeBtn} className="btn-primary" onClick={dismiss}>I took a breath 🌿</button>
          <a className="btn-ghost" href="#sanctuary" onClick={dismiss}>Take me to a 5-minute reset</a>
        </div>
      </div>
    </div>
  )
}
