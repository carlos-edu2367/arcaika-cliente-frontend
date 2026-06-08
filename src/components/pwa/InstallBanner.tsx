import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { IOSInstallSheet } from './IOSInstallSheet'

const DISMISS_KEY = 'arcaika:pwa-install-dismissed'

// Rotas onde o banner não deve aparecer (fluxos sem distração).
const HIDDEN_PREFIXES = ['/auth', '/checkout']

/**
 * Banner dispensável que convida o usuário a instalar o PWA, com UM botão.
 *
 * - Android/Chromium: o botão dispara o prompt nativo de instalação.
 * - iOS/Safari: o botão abre instruções (não há API de instalação na plataforma).
 * - Já instalado (standalone) ou dispensado: não renderiza.
 *
 * Fica no fluxo do documento, acima do TopBar (sticky), então rola junto com a
 * página e libera espaço quando dispensado.
 */
export function InstallBanner() {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useLocalStorage<boolean>(DISMISS_KEY, false)
  const [iosSheetOpen, setIosSheetOpen] = useState(false)
  const { pathname } = useLocation()

  const onHiddenRoute = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  // Só faz sentido oferecer instalação se há um caminho real para isso.
  const installable = canInstall || isIOS
  const visible = installable && !isStandalone && !dismissed && !onHiddenRoute

  if (!visible) {
    // Ainda montamos o sheet para permitir animação de saída futura; aqui é no-op.
    return null
  }

  const handleClick = async () => {
    if (canInstall) {
      const outcome = await promptInstall()
      // Se instalou ou recusou, não insistimos.
      if (outcome === 'accepted' || outcome === 'dismissed') setDismissed(true)
      return
    }
    if (isIOS) setIosSheetOpen(true)
  }

  return (
    <>
      <div className="bg-primary-light/80 border-b border-primary-100">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <img src="/icons/pwa-192x192.png" alt="" className="h-6 w-6 rounded" />
            </span>
            <p className="min-w-0 text-xs sm:text-sm text-primary-800 leading-tight">
              <span className="font-semibold">Instale o app Arcaika</span>
              <span className="hidden sm:inline"> — acesso rápido direto da tela inicial.</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleClick}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <Download size={15} />
            Instalar
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dispensar"
            className="shrink-0 rounded-full p-1.5 text-primary-500 hover:bg-primary-100 hover:text-primary-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {isIOS && <IOSInstallSheet open={iosSheetOpen} onClose={() => setIosSheetOpen(false)} />}
    </>
  )
}
