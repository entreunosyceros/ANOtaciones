import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const desktop = new URLSearchParams(location.search).get('app') === '1'
    // Dev o escritorio: nunca registrar SW (caché de index/assets → pantalla blanca).
    if (import.meta.env.DEV || desktop) {
      void navigator.serviceWorker.getRegistrations().then((regs) =>
        Promise.all(regs.map((r) => r.unregister())),
      )
      return
    }
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore SW errors */
    })
  })
}
