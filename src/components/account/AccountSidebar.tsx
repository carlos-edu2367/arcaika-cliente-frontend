import { Link, useLocation } from 'react-router-dom';
import { User, Lock, MapPin, Star, FileText, Package} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/conta/perfil', Icon: User, label: 'Perfil' },
  { to: '/conta/senha', Icon: Lock, label: 'Senha' },
  { to: '/conta/enderecos', Icon: MapPin, label: 'Endereços' },
  { to: '/conta/avaliacoes', Icon: Star, label: 'Avaliações' },
  { to: '/conta/orcamentos', Icon: FileText, label: 'Meus Orçamentos' },
  {to: '/conta/pedidos', Icon: Package, label: 'Meus Pedidos'}
];

export function AccountSidebar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden">
      {NAV_ITEMS.map(({ to, Icon, label }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
            pathname === to
              ? 'bg-primary-light text-primary border-l-2 border-primary'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
          )}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </nav>
  );
}