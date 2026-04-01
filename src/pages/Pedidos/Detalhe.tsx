import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Clock, CheckCircle, XCircle, Loader, MapPin, CreditCard, AlertTriangle, Star } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { usePedido } from '@/hooks/usePedidos'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosService } from '@/services/api/pedidos'
import { avaliacoesService } from '@/services/api/avaliacoes'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PENDENTE: { label: 'Pendente', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  'aguardando pagamento': { label: 'Aguardando Pagamento', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  CONFIRMADO: { label: 'Confirmado', color: 'text-info', bg: 'bg-info-light', Icon: Loader },
  confirmado: { label: 'Confirmado', color: 'text-info', bg: 'bg-info-light', Icon: Loader },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-info', bg: 'bg-info-light', Icon: Loader },
  'em andamento': { label: 'Em andamento', color: 'text-info', bg: 'bg-info-light', Icon: Loader },
  CONCLUIDO: { label: 'Concluído', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  concluido: { label: 'Concluído', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  CANCELADO: { label: 'Cancelado', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
  cancelado: { label: 'Cancelado', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
}

const TIMELINE_STEPS: { status: string; label: string; desc: string }[] = [
  { status: 'PENDENTE', label: 'Pedido realizado', desc: 'Aguardando confirmação' },
  { status: 'CONFIRMADO', label: 'Confirmado', desc: 'Prestador confirmou o serviço' },
  { status: 'EM_ANDAMENTO', label: 'Em execução', desc: 'Serviço sendo realizado' },
  { status: 'CONCLUIDO', label: 'Concluído', desc: 'Serviço finalizado' },
]

const ORDER = ['PENDENTE', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO']

// ---------------------------------------------------------------------------
// ModalAvaliacao
// ---------------------------------------------------------------------------

function ModalAvaliacao({
  pedidoId,
  servicoId,
  onClose,
  onSuccess: onSuccessCallback,
}: {
  pedidoId: string
  servicoId: string
  onClose: () => void
  onSuccess?: () => void
}) {
  const [nota, setNota] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comentario, setComentario] = useState('')
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      avaliacoesService.criar({
        alvo_id: servicoId,
        pedido_id: pedidoId,
        tipo: 'servico',
        nota,
        comentario: comentario.trim() || undefined,
      }),
    onSuccess: () => {
      localStorage.setItem(`arcaika_avaliado_${pedidoId}`, '1')
      qc.invalidateQueries({ queryKey: ['pedidos', pedidoId] })
      addToast({ type: 'success', title: 'Avaliação enviada! Obrigado.' })
      onSuccessCallback?.()
      onClose()
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao enviar avaliação.' }),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-5">
        <div className="text-center">
          <h3 className="text-lg font-bold text-neutral-900">Avaliar serviço</h3>
          <p className="text-sm text-neutral-500 mt-0.5">Como foi sua experiência?</p>
        </div>

        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setNota(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                size={32}
                className={cn(
                  'transition-colors',
                  star <= (hovered || nota)
                    ? 'fill-warning text-warning'
                    : 'fill-neutral-100 text-neutral-300',
                )}
              />
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Comentário</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Conte como foi o serviço..."
            rows={3}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border py-2 rounded-xl text-sm">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={nota === 0 || mutation.isPending} className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-bold">
            {mutation.isPending ? <Spinner size="sm" color="white" /> : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PedidoDetalhe() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [showAvaliacao, setShowAvaliacao] = useState(false)

  const { data: pedido, isLoading } = usePedido(id)

  const cancelarPedido = useMutation({
    mutationFn: () => pedidosService.cancelar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      qc.invalidateQueries({ queryKey: ['pedidos', id] })
      addToast({ type: 'success', title: 'Pedido cancelado.' })
      setShowConfirmCancel(false)
    },
  })

  if (isLoading) return <PageWrapper><Container><div className="flex justify-center py-20"><Spinner size="lg" /></div></Container></PageWrapper>
  if (!pedido) return <PageWrapper><Container><div className="text-center py-20"><p>Pedido não encontrado.</p></div></Container></PageWrapper>

  const statusStr = (pedido.status || '').toString();
  const config = STATUS_CONFIG[statusStr] || STATUS_CONFIG[statusStr.toUpperCase()] || { label: statusStr, color: 'text-neutral-500', bg: 'bg-neutral-100', Icon: AlertTriangle }
  const StatusIcon = config.Icon
  const currentIdx = ORDER.indexOf(statusStr.toUpperCase())
  
  const podeConselar = ['PENDENTE', 'CONFIRMADO', 'aguardando pagamento'].includes(statusStr)
  const servicoId = (pedido as any).linhas?.[0]?.referencia_id ?? ''
  const jaAvaliadoLocal = localStorage.getItem(`arcaika_avaliado_${id}`) === '1'
  const podeAvaliar = statusStr.toUpperCase() === 'CONCLUIDO' && !pedido.avaliado && !jaAvaliadoLocal

  const address = pedido.endereco_entrega;
  const items = (pedido as any).linhas || [];

  return (
    <PageWrapper>
      <Container>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Pedido #{pedido.codigo || pedido.id.slice(0, 8).toUpperCase()}</h1>
          <span className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1", config.bg, config.color)}>
            <StatusIcon size={14} /> {config.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            {statusStr.toUpperCase() !== 'CANCELADO' && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">Acompanhamento</h2>
                <div className="space-y-4">
                  {TIMELINE_STEPS.map((ts, i) => (
                    <div key={ts.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", currentIdx >= i ? 'bg-success text-white' : 'bg-neutral-100 text-neutral-300')}>
                          {currentIdx >= i ? <CheckCircle size={16} /> : <div className="h-2 w-2 rounded-full bg-neutral-300" />}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && <div className={cn("w-0.5 flex-1 my-1", currentIdx > i ? 'bg-success' : 'bg-neutral-100')} />}
                      </div>
                      <div>
                        <p className={cn("text-sm font-bold", currentIdx >= i ? 'text-neutral-900' : 'text-neutral-400')}>{ts.label}</p>
                        <p className="text-xs text-neutral-400">{ts.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itens */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">Itens do pedido</h2>
              <div className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-lg bg-neutral-50 flex items-center justify-center text-xl">🔧</div>
                       <div>
                         <p className="text-sm font-bold text-neutral-900">{item.titulo}</p>
                         <p className="text-xs text-neutral-400">Qtd: {item.quantidade}</p>
                       </div>
                    </div>
                    <span className="font-bold text-neutral-900">{formatCurrency(parseFloat(item.subtotal))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {address && (
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} /> Local</h3>
                <div className="text-sm text-neutral-600">
                  <p className="font-bold text-neutral-900">{address.rua}, {address.numero}</p>
                  <p>{address.bairro} — {address.cidade}/{address.estado}</p>
                </div>
              </div>
            )}

            <div className="bg-neutral-900 text-white rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60"><span>Subtotal</span><span>{formatCurrency(parseFloat(pedido.subtotal))}</span></div>
              {parseFloat(pedido.desconto) > 0 && <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-success-light"><span>Desconto</span><span>-{formatCurrency(parseFloat(pedido.desconto))}</span></div>}
              <div className="flex justify-between items-end border-t border-white/10 pt-4">
                <span className="text-xs font-black uppercase opacity-60">Total</span>
                <span className="text-2xl font-black">{formatCurrency(parseFloat(pedido.total))}</span>
              </div>
            </div>

            <div className="space-y-3">
              {podeAvaliar && (
                <button onClick={() => setShowAvaliacao(true)} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg">Avaliar serviço</button>
              )}
              {podeConselar && (
                <button onClick={() => setShowConfirmCancel(true)} className="w-full border border-neutral-200 text-neutral-400 py-3 rounded-xl hover:bg-neutral-50">Cancelar pedido</button>
              )}
            </div>
          </div>
        </div>

        {showAvaliacao && <ModalAvaliacao pedidoId={id} servicoId={servicoId} onClose={() => setShowAvaliacao(false)} />}
        {showConfirmCancel && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="font-bold text-neutral-900">Deseja cancelar o pedido?</h3>
                <div className="flex gap-3">
                   <button onClick={() => setShowConfirmCancel(false)} className="flex-1 py-2 rounded-xl border">Não</button>
                   <button onClick={() => cancelarPedido.mutate()} className="flex-1 py-2 rounded-xl bg-error text-white font-bold">Sim, cancelar</button>
                </div>
             </div>
           </div>
        )}
      </Container>
    </PageWrapper>
  )
}
