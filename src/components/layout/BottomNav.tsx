import { NavLink } from 'react-router-dom'
import { Home, Search, FileText, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', icon: Home, label: 'Início', end: true },
  { to: '/marketplace', icon: Search, label: 'Buscar', end: false },
  { to: '/conta/orcamentos', icon: FileText, label: 'Orçamentos', end: false },
  { to: '/conta/pedidos', icon: ShoppingBag, label: 'Pedidos', end: false },
  { to: '/conta/perfil', icon: User, label: 'Perfil', end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-100 md:hidden">
      <div className="flex items-stretch">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium gap-0.5 transition-colors',
                isActive ? 'text-primary-600' : 'text-neutral-400 hover:text-neutral-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
