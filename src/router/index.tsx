import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ArkyFAB } from '@/components/arky/ArkyFAB'
import { ArkyDrawer } from '@/components/arky/ArkyDrawer'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { LoginModal } from '@/components/auth/LoginModal'
import { LocationPicker } from '@/components/location/LocationPicker'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Toaster } from '@/components/ui/Toast'
import { useUIStore } from '@/stores/uiStore'

// Páginas públicas
const Home = lazy(() => import('@/pages/Home'))
const Marketplace = lazy(() => import('@/pages/Marketplace'))
const ServicoDetalhe = lazy(() => import('@/pages/Marketplace/ServicoDetalhe'))
const ItemDetalhe = lazy(() => import('@/pages/Marketplace/ItemDetalhe'))
const OrganizacaoMarketplace = lazy(() => import('@/pages/Marketplace/Organizacao'))
const Login = lazy(() => import('@/pages/Auth/Login'))
const Cadastro = lazy(() => import('@/pages/Auth/Cadastro'))
const RecuperarSenha = lazy(() => import('@/pages/Auth/RecuperarSenha'))
const Busca = lazy(() => import('@/pages/Busca'))

// Páginas protegidas
const Carrinho = lazy(() => import('@/pages/Carrinho'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const Pedidos = lazy(() => import('@/pages/Conta/Pedidos'))
const PedidoDetalhe = lazy(() => import('@/pages/Pedidos/Detalhe'))
const CotacaoDetalhe = lazy(() => import('@/pages/Orcamentos/Detalhe'))
const Perfil = lazy(() => import('@/pages/Conta/Perfil'))
const Senha = lazy(() => import('@/pages/Conta/Senha'))
const Enderecos = lazy(() => import('@/pages/Conta/Enderecos'))
const Avaliacoes = lazy(() => import('@/pages/Conta/Avaliacoes'))
const ContaIndex = lazy(() => import('@/pages/Conta'))
const OrcamentosConta = lazy(() => import ('@/pages/Conta/Orcamentos'))

// ---------------------------------------------------------------------------
// Ouve evento de 401 e redireciona sem hard reload
// ---------------------------------------------------------------------------

function AuthEventListener() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => navigate('/auth/login', { replace: true })
    window.addEventListener('arcaika:unauthorized', handler)
    return () => window.removeEventListener('arcaika:unauthorized', handler)
  }, [navigate])

  return null
}

// ---------------------------------------------------------------------------
// Scroll para o topo a cada navegação (substitui <ScrollRestoration />
// que exige um data router — createBrowserRouter — e não funciona com BrowserRouter)
// ---------------------------------------------------------------------------

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

// ---------------------------------------------------------------------------
// Fallback de carregamento de página
// ---------------------------------------------------------------------------

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 404
// ---------------------------------------------------------------------------

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 p-8">
      <p className="text-6xl font-bold text-neutral-200">404</p>
      <p className="text-xl font-semibold text-neutral-700">Página não encontrada</p>
      <p className="text-sm text-neutral-400">A página que você procura não existe ou foi movida.</p>
      <a
        href="/"
        className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
      >
        Voltar ao início
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Router principal
// ---------------------------------------------------------------------------

// PERF-05: ArkyDrawer renderizado condicionalmente para evitar re-renders em toda navegação
function ArkyCondicional() {
  const isArkyOpen = useUIStore((s) => s.isArkyOpen)
  return isArkyOpen ? <ArkyDrawer /> : null
}

export function AppRouter() {
  return (
    <BrowserRouter>
      {/* Listener de 401 — deve estar dentro de BrowserRouter para usar useNavigate */}
      <AuthEventListener />

      {/* Volta ao topo a cada navegação */}
      <ScrollToTop />

      <TopBar />

      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/servicos/:id" element={<ServicoDetalhe />} />
            <Route path="/marketplace/item/:id" element={<ItemDetalhe />} />
            <Route path="/marketplace/org/:id" element={<OrganizacaoMarketplace />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/cadastro" element={<Cadastro />} />
            <Route path="/auth/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/busca" element={<Busca />} />

            {/* Protegidas */}
            <Route path="/carrinho" element={<RequireAuth><Carrinho /></RequireAuth>} />
            <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
            <Route path="/conta/pedidos" element={<RequireAuth><Pedidos /></RequireAuth>} />
            <Route path="/pedidos/:id" element={<RequireAuth><PedidoDetalhe /></RequireAuth>} />
            <Route path="/orcamentos/:id" element={<RequireAuth><CotacaoDetalhe /></RequireAuth>} />
            <Route path="/conta" element={<RequireAuth><ContaIndex /></RequireAuth>} />
            <Route path="/conta/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />
            <Route path="/conta/senha" element={<RequireAuth><Senha /></RequireAuth>} />
            <Route path="/conta/enderecos" element={<RequireAuth><Enderecos /></RequireAuth>} />
            <Route path="/conta/avaliacoes" element={<RequireAuth><Avaliacoes /></RequireAuth>} />
            <Route path="/conta/orcamentos" element={<RequireAuth><OrcamentosConta /></RequireAuth>} />

            {/* Compatibilidade */}
            <Route path="/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <BottomNav />
      <ArkyFAB />
      <ArkyCondicional />
      <LoginModal />
      <LocationPicker firstVisit />
      <Toaster />
    </BrowserRouter>
  )
}
