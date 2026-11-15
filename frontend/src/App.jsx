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
import TelemetryDrawer from './components/TelemetryDrawer.jsx'
import BreathePopup from './components/BreathePopup.jsx'

export const NAV = [
  ['home', 'Home'], ['map', 'Places to Thrive'], ['play', 'Joy & Play'], ['equipment', 'Gear Navigator'],
  ['iep', 'IEP & 504'], ['providers', 'Providers'], ['sanctuary', 'Sanctuary'], ['copilot', 'Co-Pilot ✨'],
]

const pageFromHash = () => {
  const h = window.location.hash.replace('#', '')
  return NAV.some(([k]) => k === h) ? h : 'home'
}

// Shared Co-Pilot state so the Co-Pilot page and the Telemetry drawer see the same live run.
function useCopilot(dataset) {
  const [state, setState] = useState({ running: false, steps: {}, events: [], result: null, error: null, message: '' })
  const [history, setHistory] = useState([])
  const [last, setLast] = useState(null)
  const run = useCallback(async ({ message, redteam }) => {
    setLast({ message, redteam })
    setState({ running: true, steps: {}, events: [], result: null, error: null, message: message || '' })
    try {
      await runCopilot({ message, dataset, redteam }, (ev) => {
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
  const [dataset, setDataset] = useState(() => new URLSearchParams(location.search).get('dataset') || localStorage.getItem('jr-dataset') || null)
  const [data, setData] = useState(null)
  const [config, setConfig] = useState(null)
  const [drawer, setDrawer] = useState(false)
  const [prefill, setPrefill] = useState('')
  const copilot = useCopilot(dataset)

  useEffect(() => { const f = () => setPage(pageFromHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  useEffect(() => { getJSON('/api/health').then((c) => { setConfig(c); if (!dataset) setDataset(c.dataset) }).catch(() => setConfig({ provider: 'unreachable' })) }, [])
  useEffect(() => { if (!dataset) return; localStorage.setItem('jr-dataset', dataset); setData(null); getJSON(`/api/data?dataset=${dataset}`).then(setData) }, [dataset])

  const go = (p) => { window.location.hash = p; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const askCopilot = (text) => { setPrefill(text); go('copilot') }

  const props = { data, go, askCopilot }
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 btn-gold z-50">Skip to content</a>
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <button onClick={() => go('home')} className="flex items-center gap-2.5 shrink-0" aria-label="Joy Risers home">
            <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#1F4D3A" /><path d="M14 40 Q32 8 50 40" stroke="#E8A317" strokeWidth="6" fill="none" strokeLinecap="round" /><circle cx="32" cy="44" r="6" fill="#FBF6EC" /></svg>
            <span className="font-display text-2xl text-forest font-semibold">Joy Risers</span>
          </button>
          <nav aria-label="Modules" className="hidden xl:flex flex-1 justify-center gap-0.5">
            {NAV.slice(1).map(([k, t]) => (
              <button key={k} onClick={() => go(k)} aria-current={page === k ? 'page' : undefined}
                className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${page === k ? 'bg-forest text-cream' : 'text-navy hover:bg-cream-2'}`}>{t}</button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <label className="hidden md:flex items-center gap-2 text-xs font-semibold text-navy">
              <span>Data</span>
              <select aria-label="Dataset" className="rounded-full border border-sand bg-white px-2 py-1" value={dataset || ''} onChange={(e) => setDataset(e.target.value)}>
                <option value="full">Full (nationwide)</option><option value="test">Test (small)</option>
              </select>
            </label>
            <button onClick={() => setDrawer(true)} className="btn-gold !px-4 !py-2 text-sm whitespace-nowrap" aria-haspopup="dialog">
              <span aria-hidden="true">🔍</span> How it works
            </button>
          </div>
        </div>
        <nav aria-label="Modules (mobile)" className="xl:hidden flex gap-1 overflow-x-auto px-4 pb-2">
          {NAV.slice(1).map(([k, t]) => (
            <button key={k} onClick={() => go(k)} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold ${page === k ? 'bg-forest text-cream' : 'bg-white text-navy border border-sand'}`}>{t}</button>
          ))}
        </nav>
        <div className="brand-ribbon" aria-hidden="true" />
      </header>

      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {!data && page !== 'copilot' ? <Loading /> : (
          <>
            {page === 'home' && <Home {...props} />}
            {page === 'map' && <MapModule {...props} />}
            {page === 'play' && <PlayModule {...props} />}
            {page === 'equipment' && <EquipmentModule {...props} />}
            {page === 'iep' && <IEPModule {...props} />}
            {page === 'providers' && <ProvidersModule {...props} />}
            {page === 'sanctuary' && <SanctuaryModule {...props} />}
            {page === 'copilot' && <Copilot copilot={copilot} prefill={prefill} setPrefill={setPrefill} openDrawer={() => setDrawer(true)} config={config} />}
          </>
        )}
      </main>

      <footer className="bg-forest text-cream mt-12">
        <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <p className="font-display text-2xl">Joy Risers</p>
            <p className="mt-2 text-cream/90">For the grandparents, aunts, uncles, foster and kinship families, guardians and parents raising joyful kids who roll, stride and explore their own way.</p>
          </div>
          <div className="text-cream/90 space-y-2">
            <p><strong>Not medical or legal advice.</strong> Joy Risers shares general information and questions to bring to your child's care team. In an emergency call 911. For crisis support call or text 988.</p>
            <p>Directory listings are curated demo data: national programs are real organizations; local listings, providers, hours, prices and scores are illustrative. Always confirm.</p>
          </div>
          <div className="text-cream/90">
            <p>MGT 409 · AI Foundations for Managers · Final Project</p>
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
