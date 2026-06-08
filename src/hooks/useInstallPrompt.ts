import { useCallback, useEffect, useState } from 'react'

/**
 * Evento `beforeinstallprompt` (Chromium). Não faz parte do lib.dom padrão,
 * então declaramos a forma mínima que usamos.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt: () => Promise<void>
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIPhoneIPad = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ se identifica como "Mac"; diferencia pelo touch.
  const isIPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1
  return isIPhoneIPad || isIPadOS
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches
  // Safari iOS expõe navigator.standalone quando aberto da tela inicial.
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true
  return Boolean(displayModeStandalone || iosStandalone)
}

export interface InstallPromptState {
  /** Pode disparar o prompt nativo (Android/Chromium). */
  canInstall: boolean
  /** Está rodando em iOS/Safari (sem API de instalação — exige passo manual). */
  isIOS: boolean
  /** Já está aberto como app instalado (não faz sentido mostrar convite). */
  isStandalone: boolean
  /** Dispara o prompt nativo. Retorna o desfecho ('accepted' | 'dismissed' | 'unavailable'). */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

/**
 * Encapsula a lógica de "instalar o PWA".
 *
 * - Android/Chromium: captura `beforeinstallprompt` e permite acionar o prompt
 *   nativo programaticamente (instalação real com um clique).
 * - iOS/Safari: NÃO existe API de instalação. Apenas sinalizamos `isIOS` para
 *   que a UI mostre instruções manuais (Compartilhar → Adicionar à Tela de Início).
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone)
  const isIOS = detectIOS()

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Impede o mini-infobar padrão do Chrome; guardamos o evento p/ disparo manual.
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setDeferred(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    // Atualiza se o usuário trocar para display-mode standalone em runtime.
    const mql = window.matchMedia?.('(display-mode: standalone)')
    const onDisplayModeChange = (ev: MediaQueryListEvent) => setIsStandalone(ev.matches)
    mql?.addEventListener?.('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      mql?.removeEventListener?.('change', onDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable' as const
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // O evento só pode ser usado uma vez.
    setDeferred(null)
    return outcome
  }, [deferred])

  return {
    canInstall: deferred !== null,
    isIOS,
    isStandalone,
    promptInstall,
  }
}
