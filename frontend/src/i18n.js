// Whole-page translation into the 5 most-spoken non-English languages in U.S. homes.
// We walk the visible text (and placeholders / aria-labels / alt text), ask the backend for
// translations (served from a pre-translated cache; new strings are translated once by gpt-6-luna),
// and swap them in. A MutationObserver keeps up as React re-renders. Anything inside an element with
// translate="no" stays as-is (e.g. Joy Compass answer already written in the caregiver's language,
// or IEP letters meant for the school). Switching back to English restores the originals.

export const LANGS = [
  ['en', 'English', 'ltr'], ['es', 'Español', 'ltr'], ['zh', '中文', 'ltr'],
  ['tl', 'Tagalog', 'ltr'], ['vi', 'Tiếng Việt', 'ltr'], ['ar', 'العربية', 'rtl'],
]
const ATTRS = ['placeholder', 'aria-label', 'alt', 'title']
const HAS_LETTERS = /[A-Za-z]/
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'svg', 'SVG'])

let lang = localStorage.getItem('jr-lang') || 'en'
const memo = {}                      // lang -> Map(english -> translated)
const original = new WeakMap()       // text node -> latest English text
const shown = new WeakMap()          // text node -> the translation we put there
const attrOriginal = new WeakMap()   // element -> {attr: english}
let pending = new Set()
let timer = null
let observer = null
const listeners = new Set()

export const getLang = () => lang
export const onLangChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

function skipped(el) {
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName) || e.getAttribute?.('translate') === 'no') return true
  }
  return false
}

function collect(root) {
  const out = []
  if (root.nodeType === Node.TEXT_NODE) { out.push(root); return out }
  if (root.nodeType !== Node.ELEMENT_NODE || skipped(root)) return out
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => (n.nodeType === Node.ELEMENT_NODE
      ? (SKIP_TAGS.has(n.tagName) || n.getAttribute('translate') === 'no' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP)
      : NodeFilter.FILTER_ACCEPT),
  })
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n)
  root.querySelectorAll?.('[placeholder],[aria-label],[alt],[title]').forEach((el) => { if (!skipped(el)) out.push(el) })
  if (ATTRS.some((a) => root.hasAttribute?.(a))) out.push(root)
  return out
}

function englishOf(node) {
  const cur = node.nodeValue
  if (shown.get(node) !== cur) original.set(node, cur)    // React (or the user) changed it: new English
  return original.get(node)
}

async function fetchMissing(strings) {
  const m = (memo[lang] ||= new Map())
  const need = [...new Set(strings)].filter((s) => !m.has(s))
  for (let i = 0; i < need.length; i += 150) {
    const chunk = need.slice(i, i + 150)
    try {
      const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, strings: chunk }) })
      const { translations = {} } = await r.json()
      chunk.forEach((s) => m.set(s, translations[s] ?? s))
    } catch { chunk.forEach((s) => m.set(s, s)) }
  }
  return m
}

function split(text) {                       // keep surrounding whitespace exactly
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/)
  return [m[1], m[2], m[3]]
}

async function apply(nodes) {
  if (lang === 'en') return
  const texts = [], attrs = []
  for (const n of nodes) {
    if (!n.isConnected) continue
    if (n.nodeType === Node.TEXT_NODE) {
      if (n.parentElement && skipped(n.parentElement)) continue
      const core = split(englishOf(n) || '')[1]
      if (core && HAS_LETTERS.test(core)) texts.push([n, core])
    } else {
      const o = attrOriginal.get(n) || {}
      for (const a of ATTRS) {
        const v = n.getAttribute(a)
        if (!v) continue
        if (o[a]?.shown !== v) o[a] = { en: v }
        if (HAS_LETTERS.test(o[a].en)) attrs.push([n, a, o[a].en])
      }
      attrOriginal.set(n, o)
    }
  }
  const m = await fetchMissing([...texts.map((t) => t[1]), ...attrs.map((a) => a[2])])
  if (lang === 'en') return
  // Grab changes React made while we were waiting (disconnect() would silently drop them).
  const missed = observer ? nodesFrom(observer.takeRecords()) : []
  observer?.disconnect()
  for (const [n, core] of texts) {
    const [pre, , post] = split(original.get(n) || '')
    const t = m.get(core)
    if (t && t !== core && n.isConnected) { const v = pre + t + post; shown.set(n, v); n.nodeValue = v }
  }
  for (const [el, a, en] of attrs) {
    const t = m.get(en)
    if (t && t !== en) { el.setAttribute(a, t); attrOriginal.get(el)[a].shown = t }
  }
  observe()
  if (missed.length) schedule(missed)
}

function nodesFrom(muts) {
  const nodes = []
  for (const mu of muts) {
    if (mu.type === 'characterData' || mu.type === 'attributes') nodes.push(mu.target)
    else mu.addedNodes.forEach((n) => nodes.push(...collect(n)))
  }
  return nodes
}

function schedule(nodes) {
  nodes.forEach((n) => pending.add(n))
  clearTimeout(timer)
  timer = setTimeout(() => { const batch = [...pending]; pending = new Set(); apply(batch) }, 120)
}

function observe() {
  observer ||= new MutationObserver((muts) => {
    const nodes = nodesFrom(muts)
    if (nodes.length) schedule(nodes)
  })
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS })
}

function restoreEnglish() {
  observer?.disconnect()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (original.has(n) && shown.get(n) === n.nodeValue) n.nodeValue = original.get(n)
  }
  document.querySelectorAll('[placeholder],[aria-label],[alt],[title]').forEach((el) => {
    const o = attrOriginal.get(el); if (!o) return
    for (const a of ATTRS) if (o[a] && el.getAttribute(a) === o[a].shown) el.setAttribute(a, o[a].en)
  })
}

export function setLang(next) {
  lang = next
  localStorage.setItem('jr-lang', next)
  const meta = LANGS.find(([k]) => k === next) || LANGS[0]
  document.documentElement.lang = next === 'zh' ? 'zh-Hans' : next
  document.documentElement.dir = meta[2]
  listeners.forEach((fn) => fn(next))
  if (next === 'en') { restoreEnglish(); return }
  observe()
  schedule(collect(document.body))
}

export function initI18n() { if (lang !== 'en') setTimeout(() => setLang(lang), 50) }
