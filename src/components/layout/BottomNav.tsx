import { NavLink } from 'react-router-dom'
import { Home, Search, FileText, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const items = [
  { to: '/', icon: Home, label: 'Início', end: true, protected: false },
  { to: '/marketplace', icon: Search, label: 'Buscar', end: false, protected: false },
  { to: '/conta/orcamentos', icon: FileText, label: 'Orçamentos', end: false, protected: true },
  { to: '/conta/pedidos', icon: ShoppingBag, label: 'Pedidos', end: false, protected: true },
  { to: '/conta/perfil', icon: User, label: 'Perfil', end: false, protected: true },
]

export function BottomNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openLoginModal = useUIStore((s) => s.openLoginModal)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-100 md:hidden safe-bottom"
    >
      <div className="flex items-stretch">
        {items.map(({ to, icon: Icon, label, end, protected: requiresAuth }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={(e) => {
              if (requiresAuth && !isAuthenticated) {
                e.preventDefault()
                openLoginModal()
              }
            }}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium gap-0.5 transition-colors',
                isActive && isAuthenticated ? 'text-primary-600' : 'text-neutral-400 hover:text-neutral-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive && isAuthenticated ? 2.5 : 1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
