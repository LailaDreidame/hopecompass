import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'
import { initI18n } from './i18n.js'

createRoot(document.getElementById('root')).render(<App />)
initI18n()
