import { MessageCircle, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const HIDDEN_ROUTES = ['/checkout']

export function ArkyFAB() {
  const { isArkyOpen, toggleArky, openLoginModal } = useUIStore()
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r))) return null

  const handleClick = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    toggleArky()
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isArkyOpen ? 'Fechar Arky' : 'Abrir Arky — assistente virtual'}
      className={cn(
        'fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6',
        'h-14 w-14 rounded-full shadow-lg flex items-center justify-center',
        'bg-primary hover:bg-primary-hover text-white transition-all duration-200',
        'hover:scale-110 active:scale-95',
      )}
    >
      {isArkyOpen ? <X size={24} /> : <MessageCircle size={24} />}
    </button>
  )
}
