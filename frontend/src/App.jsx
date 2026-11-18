import { useCallback, useEffect, useState } from 'react'
import { getJSON, runCopilot } from './api.js'
import Home from './modules/Home.jsx'
import MapModule from './modules/MapModule.jsx'
import PlayModule from './modules/PlayModule.jsx'
import EquipmentModule from './modules/EquipmentModule.jsx'
import IEPModule from './modules/IEPModule.jsx'
import ProvidersModule from './modules/ProvidersModule.jsx'
import SanctuaryModule from './modules/SanctuaryModule.jsx'
import Copilot from './modules/Copilot.jsx'
import SearchModule from './modules/SearchModule.jsx'
import Privacy from './modules/Privacy.jsx'
import TelemetryDrawer from './components/TelemetryDrawer.jsx'
import BreathePopup from './components/BreathePopup.jsx'
import { LANGS, getLang, setLang, onLangChange } from './i18n.js'

export const NAV = [
  ['home', 'Home'], ['map', 'Places to Thrive'], ['play', 'Joy & Play'], ['equipment', 'Gear Navigator'],
  ['iep', 'IEP & 504'], ['providers', 'Providers'], ['sanctuary', 'Sanctuary'], ['copilot', 'Ask Hope 🧭'],
]

const pageFromHash = () => {
  const h = window.location.hash.replace('#', '')
  return NAV.some(([k]) => k === h) || h === 'search' || h === 'privacy' ? h : 'home'
}

// Shared Ask Hope state so Ask Hope page and the Telemetry drawer see the same live run.
function useCopilot(dataset) {
  const [state, setState] = useState({ running: false, steps: {}, events: [], result: null, error: null, message: '' })
  const [history, setHistory] = useState([])
  const [last, setLast] = useState(null)
  const run = useCallback(async ({ message, redteam }) => {
    setLast({ message, redteam })
    setState({ running: true, steps: {}, events: [], result: null, error: null, message: message || '' })
    try {
      await runCopilot({ message, dataset, redteam, lang: getLang() }, (ev) => {
        setState((s) => {
          if (ev.type === 'step') return { ...s, steps: { ...s.steps, [ev.step.id]: ev.step } }
          if (ev.type === 'tool') {
            const st = s.steps[ev.step] || { id: ev.step, tool_calls: [] }
            return { ...s, steps: { ...s.steps, [ev.step]: { ...st, tool_calls: [...(st.tool_calls || []), ev.tool] } } }
          }
          if (ev.type === 'safety') return { ...s, events: [...s.events, ev.event] }
          if (ev.type === 'result') return { ...s, result: ev.data, message: ev.data.message_preview }
          if (ev.type === 'error') return { ...s, error: ev.message }
          return s
        })
        if (ev.type === 'result') setHistory((h) => [ev.data, ...h].slice(0, 20))
      })
    } catch (e) {
      setState((s) => ({ ...s, error: String(e) }))
    } finally {
      setState((s) => ({ ...s, running: false }))
    }
  }, [dataset])
  const retry = useCallback(() => last && run(last), [last, run])
  return { ...state, history, run, retry }
}

export default function App() {
  const [page, setPage] = useState(pageFromHash())
  const [dataset, setDataset] = useState(() => new URLSearchParams(location.search).get('dataset') || localStorage.getItem('hc-dataset') || null)
  const [data, setData] = useState(null)
  const [config, setConfig] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [prefill, setPrefill] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [focus, setFocus] = useState(null)   // {module, id}: what a search result should open
  const copilot = useCopilot(dataset)
  const [uiLang, setUiLang] = useState(getLang())
  useEffect(() => onLangChange(setUiLang), [])

  useEffect(() => { const f = () => setPage(pageFromHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  useEffect(() => { getJSON('/api/health').then((c) => { setConfig(c); if (!dataset) setDataset(c.dataset) }).catch(() => setConfig({ provider: 'unreachable' })) }, [])
  useEffect(() => { if (!dataset) return; localStorage.setItem('hc-dataset', dataset); setData(null); getJSON(`/api/data?dataset=${dataset}`).then(setData) }, [dataset])

  const go = (p) => { window.location.hash = p; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const askCopilot = (text) => { setPrefill(text); go('copilot') }

  const openResult = (r) => { setFocus({ module: r.module, id: r.id }); go(r.module) }
  // Generic fallback for search results: scroll to the card with data-id and highlight it briefly.
  useEffect(() => {
    if (!focus || page !== focus.module || !data) return
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-id="${focus.id}"]`)
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('search-hit'); setTimeout(() => el.classList.remove('search-hit'), 2600) }
    }, 450)
    return () => clearTimeout(t)
  }, [focus, page, data])
  const props = { data, go, askCopilot, focus, clearFocus: () => setFocus(null) }
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 btn-gold z-50">Skip to content</a>
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-sand">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 flex items-center gap-2 sm:gap-4">
          <button onClick={() => go('home')} className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Logo className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
            <span className="font-display text-xl sm:text-2xl text-navy font-semibold whitespace-nowrap max-[379px]:hidden" translate="no">Hope Compass</span>
            {' '}<span translate="no" className="rounded-full bg-marigold-soft text-navy text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 border border-marigold" title="Hope Compass is new and still growing">Beta</span><span className="sr-only">, home</span>
          </button>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => go('search')} className={`chip ${page === 'search' ? 'chip-on' : 'chip-off'} !py-1.5`} aria-label="Search the whole site">
              <span aria-hidden="true">🔍</span><span className="hidden lg:inline">Search</span>
            </button>
            <label className="flex items-center gap-1 text-xs font-semibold text-navy" title="Language">
              <span aria-hidden="true" className="hidden sm:inline">🌐</span>
              <select aria-label="Language" translate="no" className="rounded-full border border-sand bg-white ps-3 py-1 max-w-[6.5rem] sm:max-w-[8.5rem]" value={uiLang} onChange={(e) => setLang(e.target.value)}>
                {LANGS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </label>
            <label className="hidden lg:flex items-center gap-2 text-xs font-semibold text-navy">
              <span>Data</span>
              <select aria-label="Dataset" className="rounded-full border border-sand bg-white ps-3 py-1" value={dataset || ''} onChange={(e) => setDataset(e.target.value)}>
                <option value="full">Full (nationwide)</option><option value="test">Test (small)</option>
              </select>
            </label>
            <button onClick={() => setDrawer(true)} className="btn-gold !px-3 sm:!px-4 !py-2 text-sm whitespace-nowrap" aria-haspopup="dialog" aria-label="How it works: telemetry and safety">
              <span aria-hidden="true">🛡️</span><span className="hidden sm:inline">How it works</span>
            </button>
          </div>
        </div>
        <nav aria-label="Modules" className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto px-4 md:px-6 pt-1.5 pb-2.5 lg:justify-center">
          {NAV.slice(1).map(([k, t]) => (
            <button key={k} data-nav={k} onClick={() => go(k)} aria-current={page === k ? 'page' : undefined}
              className={k === 'copilot'
                ? `shrink-0 max-lg:order-first px-4 py-1 rounded-full text-[19px] leading-tight font-bold bg-dodger text-navy hover:brightness-95 ${page === k ? 'ring-[3px] ring-navy ring-offset-2 ring-offset-cream' : ''}`
                : `shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold ${page === k ? 'bg-forest text-cream' : 'bg-white text-navy border border-sand'}`}>{t}</button>
          ))}
        </nav>
        <div className="brand-ribbon" aria-hidden="true" />
        {uiLang !== 'en' && (
          <p className="bg-dodger-soft text-dodger-ink text-xs md:text-sm text-center px-4 py-1.5">
            Translated by AI and may contain errors. Names of laws, programs, and places stay in English so you can look them up.
            <button className="underline ml-2" onClick={() => setLang('en')}>English</button>
          </p>
        )}
      </header>

      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Every page gets a top-level heading for screen readers (Home shows its own visible h1) */}
        {page !== 'home' && <h1 className="sr-only">{page === 'search' ? 'Search' : page === 'privacy' ? 'Privacy' : NAV.find(([k]) => k === page)?.[1]} · Hope Compass</h1>}
        {!data && page !== 'copilot' && page !== 'privacy' ? <Loading /> : (
          <>
            {page === 'home' && <Home {...props} />}
            {page === 'map' && <MapModule {...props} />}
            {page === 'play' && <PlayModule {...props} />}
            {page === 'equipment' && <EquipmentModule {...props} />}
            {page === 'iep' && <IEPModule {...props} />}
            {page === 'providers' && <ProvidersModule {...props} />}
            {page === 'sanctuary' && <SanctuaryModule {...props} />}
            {page === 'privacy' && <Privacy go={go} />}
            {page === 'search' && <SearchModule data={data} q={searchQ} setQ={setSearchQ} openResult={openResult} askCopilot={askCopilot} />}
            {page === 'copilot' && <Copilot copilot={copilot} prefill={prefill} setPrefill={setPrefill} openDrawer={() => setDrawer(true)} config={config} />}
          </>
        )}
      </main>

      <footer className="bg-forest text-cream mt-12">
        <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <p className="font-display text-2xl flex items-center gap-2.5"><Logo className="w-9 h-9 shrink-0" /><span translate="no">Hope Compass</span></p>
            <p className="mt-2 text-cream/90">For the grandparents, aunts, uncles, foster and kinship families, guardians, and parents raising joyful kids who roll, stride, and explore their own way.</p>
          </div>
          <div className="text-cream/90 space-y-2">
            <p><strong>Not medical or legal advice.</strong> Hope Compass shares general information and questions to bring to your child's care team. In an emergency call 911. For crisis support call or text 988.</p>
            <p>Directory listings are curated demo data: national programs are real organizations; local listings, providers, hours, prices, and scores are illustrative. Always confirm.</p>
          </div>
          <div className="text-cream/90">
            <p><strong>Beta:</strong> Hope Compass is new and still growing, so some listings are samples. Always confirm details.</p>
            <p className="mt-2"><button className="underline font-semibold" onClick={() => go('privacy')}>Privacy note</button></p>
            <p className="mt-2">MGT 409 · AI Foundations for Managers · Final Project</p>
            <p className="mt-1">Model: {config?.model || 'gpt-6-luna'} via {config?.provider || '…'} · dataset: {dataset}</p>
          </div>
        </div>
      </footer>

      <TelemetryDrawer open={drawer} onClose={() => setDrawer(false)} copilot={copilot} config={config} go={go} />
      <BreathePopup />
    </div>
  )
}

function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-12 w-2/3 rounded-2xl shimmer bg-cream-2" />
      <div className="h-64 rounded-3xl shimmer bg-cream-2" />
      <p className="text-forest font-semibold">Gathering joyful things…</p>
    </div>
  )
}

function Logo({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#1E90FF" />
      <path d="M32 8l5 19 19 5-19 5-5 19-5-19-19-5 19-5z" fill="#FBF6EC" />
      <circle cx="32" cy="32" r="7" fill="#E8A317" />
    </svg>
  )
}
