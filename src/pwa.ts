/**
 * Registro do service worker do PWA.
 *
 * `registerType: 'autoUpdate'` (vite.config.ts) faz o Workbox publicar uma nova
 * versão automaticamente. Aqui apenas registramos e, quando há atualização,
 * aplicamos na próxima navegação — sem prompt, para não atrapalhar o fluxo mobile.
 *
 * Em desenvolvimento o módulo virtual `virtual:pwa-register` ainda existe
 * (devOptions.enabled = false faz o registro virar no-op), então é seguro importar.
 */
import { registerSW } from 'virtual:pwa-register'

export function registerPWA() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      // Verifica atualização periodicamente (a cada 1h) enquanto o app fica aberto.
      if (!registration) return
      setInterval(
        () => {
          registration.update().catch(() => {})
        },
        60 * 60 * 1000,
      )
    },
    onRegisterError(error) {
      console.error('Falha ao registrar o service worker do PWA:', error)
    },
  })
}
