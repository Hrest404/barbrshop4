import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import WebApp from './telegram.ts'
import './index.css'
import App from './App.tsx'

if (typeof WebApp.ready === 'function') {
  WebApp.ready()
}
if (typeof WebApp.expand === 'function') {
  WebApp.expand()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
