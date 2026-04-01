import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, MapPin, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCarrinhoStore } from '@/stores/carrinhoStore'
import { useUIStore } from '@/stores/uiStore'
import { useLocationStore } from '@/stores/locationStore'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'

export function TopBar() {
  const { isAuthenticated, logout } = useAuth()
  const { itemCount } = useCarrinhoStore()
  const { openLoginModal } = useUIStore()
  const { localidade, openPicker } = useLocationStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      navigate(`/busca?q=${encodeURIComponent(q.trim())}`)
      setQ('')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center" aria-label="Arcaika — início">
          <img src={logo} alt="Arcaika" className="h-8 w-auto" />
        </Link>

        {/* Localidade — desktop */}
        <button
          onClick={openPicker}
          className={cn(
            'hidden md:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full border transition-colors text-sm',
            localidade
              ? 'border-primary-200 text-primary-700 bg-primary-light hover:bg-primary-100'
              : 'border-neutral-200 text-neutral-500 hover:border-primary-300 hover:text-primary-600',
          )}
          aria-label="Alterar localidade"
        >
          <MapPin size={13} className={localidade ? 'text-primary' : 'text-neutral-400'} />
          <span className="max-w-[140px] truncate font-medium">
            {localidade ? localidade.cidade : 'Selecionar cidade'}
          </span>
          <ChevronDown size={12} className="opacity-60" />
        </button>

        {/* Campo de busca — desktop */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              localidade
                ? `Buscar em ${localidade.cidade}...`
                : 'Buscar serviços...'
            }
            className="w-full rounded-full border border-neutral-200 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow"
          />
        </form>

        {/* Ações */}
        <div className="flex items-center gap-1">
          {/* Localidade — mobile */}
          <button
            onClick={openPicker}
            className="md:hidden p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
            aria-label="Selecionar cidade"
          >
            <MapPin size={20} className={localidade ? 'text-primary' : 'text-neutral-400'} />
          </button>

          {/* Carrinho */}
          <Link
            to="/carrinho"
            className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span aria-label={`${itemCount} itens no carrinho`} className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* Perfil / Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-0.5">
              <Link
                to="/conta/perfil"
                className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Minha conta"
              >
                <User size={20} />
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-red-500"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="text-sm font-semibold text-primary-600 hover:underline px-2 py-1"
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      {/* Faixa de localidade ativa — mobile (abaixo do TopBar) */}
      {localidade && (
        <div className="md:hidden border-t border-neutral-100 bg-primary-light/60 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-primary-700">
            <MapPin size={11} />
            <span className="font-medium">{localidade.label}</span>
          </div>
          <button
            onClick={openPicker}
            className="text-xs text-primary-600 font-medium hover:underline"
          >
            Alterar
          </button>
        </div>
      )}
    </header>
  )
}
