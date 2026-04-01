import { MessageCircle, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

const HIDDEN_ROUTES = ['/checkout']

export function ArkyFAB() {
  const { isArkyOpen, toggleArky } = useUIStore()
  const location = useLocation()

  if (HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r))) return null

  return (
    <button
      onClick={toggleArky}
      aria-label={isArkyOpen ? 'Fechar Arky' : 'Abrir Arky'}
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
