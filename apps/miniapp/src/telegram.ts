import WebApp from '@twa-dev/sdk'

// Normalizes WebApp export to safely support both ESM default export and window.Telegram.WebApp fallback
const getWebApp = () => {
  const sdk = (WebApp as any)?.default || WebApp
  if (sdk && typeof sdk.ready === 'function') {
    return sdk
  }
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp
  }
  return sdk || {}
}

export const tg = getWebApp()
export default tg
