import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    const shouldRefresh = window.confirm('A new version is available. Refresh now to update?')
    if (shouldRefresh) {
      updateSW(true)
    }
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    const checkForUpdates = () => registration.update()
    window.addEventListener('focus', checkForUpdates)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates()
      }
    })
    setInterval(checkForUpdates, 60 * 1000)
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
