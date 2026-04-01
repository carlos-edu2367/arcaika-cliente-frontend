import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { usePedidos } from '@/hooks/usePedidos'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import type { Pedido, PedidoStatus } from '@/types/domain'

const STATUS_TABS: { value: PedidoStatus | 'TODOS'; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluídos' },
  { value: 'CANCELADO', label: 'Cancelados' },
]

const STATUS_CONFIG: Record<PedidoStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PENDENTE: { label: 'Pendente', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  PAGO: { label: 'Pago', color: 'text-info', bg: 'bg-info-light', Icon: Loader },
  CONFIRMADO: { label: 'Confirmado', color: 'text-info', bg: 'bg-info-light', Icon: Loader },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-info', bg: 'bg-info-light', Icon: Loader },
  CONCLUIDO: { label: 'Concluído', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  CANCELADO: { label: 'Cancelado', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
}

function PedidoCard({ pedido }: { pedido: Pedido }) {
  const config = STATUS_CONFIG[pedido.status]
  const Icon = config.Icon
  return (
    <Link
      to={`/pedidos/${pedido.id}`}
      className="flex items-center gap-4 bg-white border border-neutral-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
        <Package size={22} className="text-neutral-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-neutral-400 font-mono">#{pedido.id.slice(0, 8).toUpperCase()}</p>
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
            <Icon size={10} />
            {config.label}
          </span>
        </div>
        <p className="text-sm font-semibold text-neutral-900 mt-0.5 truncate">
          {pedido.linhas.length > 0 ? pedido.linhas[0]?.titulo : 'Pedido'}
          {pedido.linhas.length > 1 ? ` +${pedido.linhas.length - 1}` : ''}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">{formatDate(pedido.criado_em)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary">{formatCurrency(Number(pedido.total))}</p>
        <ChevronRight size={16} className="text-neutral-300 mt-1 ml-auto" />
      </div>
    </Link>
  )
}

export default function Pedidos() {
  const [tab, setTab] = useState<PedidoStatus | 'TODOS'>('TODOS')
  const [page, setPage] = useState(1)
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([])
  const { data: pedidos, isLoading, hasNext, total } = usePedidos(page, 10)

  // Acumula pedidos ao carregar mais páginas
  useEffect(() => {
    if (pedidos.length > 0) {
      if (page === 1) {
        setAllPedidos(pedidos)
      } else {
        setAllPedidos((prev) => {
          const ids = new Set(prev.map((p) => p.id))
          return [...prev, ...pedidos.filter((p: Pedido) => !ids.has(p.id))]
        })
      }
    }
  }, [pedidos, page])

  // Reseta ao trocar tab
  const handleTabChange = (value: PedidoStatus | 'TODOS') => {
    setTab(value)
    setPage(1)
    setAllPedidos([])
  }

  const filtered = allPedidos.filter((p) => tab === 'TODOS' || p.status === tab)

  return (
    <PageWrapper>
      <Container>
        <h1 className="text-2xl font-bold text-neutral-900 mb-6 font-poppins">Meus pedidos</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === value
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading && page === 1 ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-neutral-200 mb-3" />
            <p className="font-semibold text-neutral-600">Nenhum pedido encontrado</p>
            <p className="text-sm text-neutral-400 mt-1">Explore o marketplace e contrate serviços</p>
            <Link to="/marketplace" className="mt-4 inline-block text-primary text-sm font-medium hover:underline">
              Explorar serviços
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map((p) => <PedidoCard key={p.id} pedido={p} />)}
            </div>
            {total > 0 && (
              <p className="text-sm text-neutral-400 text-center mt-4">
                Mostrando {allPedidos.length} de {total} pedidos
              </p>
            )}
            {hasNext && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoading}
                  className="flex items-center gap-2 border border-neutral-200 text-neutral-700 font-semibold px-6 py-3 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  Carregar mais pedidos
                </button>
              </div>
            )}
          </>
        )}
      </Container>
    </PageWrapper>
  )
}
