import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Build identifier injected by vite.config.ts at build time.
const BUILD_ID: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : `dev-${Date.now()}`

const BUILD_ID_STORAGE_KEY = 'hipvaa_build_id'

// Killswitch: when BUILD_ID changes between loads, drop all caches and
// force-update any registered service workers so the user gets a fresh build.
function runBuildKillswitch() {
  try {
    const previous = localStorage.getItem(BUILD_ID_STORAGE_KEY)
    if (previous !== BUILD_ID) {
      localStorage.setItem(BUILD_ID_STORAGE_KEY, BUILD_ID)

      if (previous !== null && 'caches' in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch((err) => console.warn('[Killswitch] cache cleanup failed:', err))
      }

      if (previous !== null && 'serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.update())))
          .catch((err) => console.warn('[Killswitch] SW update failed:', err))
      }
    }
  } catch (err) {
    console.warn('[Killswitch] failed:', err)
  }
}

runBuildKillswitch()

// Workbox-managed precache SW (vite-plugin-pwa). registerType is 'prompt',
// so Wave 2-B's UpdateBanner consumes onNeedRefresh / onOfflineReady.
if (typeof window !== 'undefined') {
  registerSW({
    onNeedRefresh() {
      console.log('[PWA] new content available — waiting for user prompt')
    },
    onOfflineReady() {
      console.log('[PWA] app ready to work offline')
    },
    onRegisteredSW(swUrl) {
      console.log('[PWA] precache SW registered:', swUrl)
    },
    onRegisterError(error) {
      console.error('[PWA] precache SW registration failed:', error)
    },
  })

  // Dedicated push-notification service worker (separate from workbox).
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw-push.js', { scope: '/' })
        .then((registration) => {
          console.log('[SW-Push] registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('[SW-Push] registration failed:', error)
        })
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
