import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, Download, FileText, Layers3, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useOrcamentoDetalhes } from '@/hooks/useCotacoes'
import { cn, formatCurrency } from '@/lib/utils'
import { cotacoesService } from '@/services/api/cotacoes'
import { useUIStore } from '@/stores/uiStore'
import type { CotacaoStatus, Orcamento } from '@/types/domain'

type ConfirmAction = 'aceitar' | 'rejeitar'

function toDetalhamentoNumber(value: string | number) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function sumDetalhamentoItems(itens: Record<string, string | number>) {
  return Object.values(itens).reduce<number>((total, value) => total + toDetalhamentoNumber(value), 0)
}

export function DetalhamentoProposta({ detalhamento }: { detalhamento?: Orcamento['detalhamento'] }) {
  const ambientes = detalhamento ? Object.entries(detalhamento) : []
  if (ambientes.length === 0) return null

  const totalGeral = ambientes.reduce<number>((total, [, itens]) => total + sumDetalhamentoItems(itens), 0)

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers3 size={16} className="text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Itens e valores</h4>
        </div>
        <span className="text-xs font-bold text-primary">Total {formatCurrency(totalGeral)}</span>
      </div>
      <div className="space-y-3">
        {ambientes.map(([ambiente, itens]) => {
          const subtotal = sumDetalhamentoItems(itens)

          return (
            <div key={ambiente} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h5 className="text-sm font-semibold text-neutral-900">{ambiente}</h5>
                <span className="text-xs font-bold text-primary">{formatCurrency(subtotal)}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(itens).map(([nome, valor]) => (
                  <div key={`${ambiente}-${nome}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-neutral-600">{nome}</span>
                    <span className="text-right font-medium text-neutral-900">
                      {formatCurrency(toDetalhamentoNumber(valor))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrcamentoDetalhesModal({
  cotacaoId,
  orcamentoId,
  onClose,
}: {
  cotacaoId: string
  orcamentoId: string
  onClose: () => void
}) {
  const { data: orcDetalhes, isLoading } = useOrcamentoDetalhes(cotacaoId, orcamentoId, true)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-neutral-900">Detalhes da proposta</h3>
          <button onClick={onClose} className="text-neutral-400 transition-colors hover:text-neutral-600" aria-label="Fechar detalhes">
            <XCircle size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : orcDetalhes ? (
          <div className="space-y-6">
            <div>
              <h4 className="mb-1 font-semibold text-neutral-900">Prestador</h4>
              <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light font-bold text-primary">
                  {orcDetalhes.organizacao?.nome?.charAt(0) || orcDetalhes.provedor_nome?.charAt(0) || '?'}
                </div>
                <p className="font-semibold">{orcDetalhes.organizacao?.nome || orcDetalhes.provedor_nome || 'Prestador desconhecido'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="mb-1 text-sm text-neutral-500">Valor proposto</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(orcDetalhes.valor)}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="mb-1 text-sm text-neutral-500">Validade da proposta</p>
                <p className="font-semibold text-neutral-700">
                  {orcDetalhes.prazo_dias ? `${orcDetalhes.prazo_dias} dias` : 'Não informado'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-neutral-900">Mensagem do prestador</h4>
              <div className="rounded-lg bg-neutral-50 p-4">
                {orcDetalhes.descricao ? (
                  <p className="whitespace-pre-line text-sm text-neutral-700">{orcDetalhes.descricao}</p>
                ) : (
                  <p className="text-sm italic text-neutral-500">Nenhuma mensagem adicional.</p>
                )}
              </div>
            </div>

            <DetalhamentoProposta detalhamento={orcDetalhes.detalhamento} />

            {orcDetalhes.anexos && orcDetalhes.anexos.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold text-neutral-900">Anexos ({orcDetalhes.anexos.length})</h4>
                <div className="space-y-2">
                  {orcDetalhes.anexos.map((anexo: any) => (
                    <div key={anexo.id} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-primary-light p-2 text-primary">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-700">{anexo.nome_arquivo}</p>
                          <p className="text-xs text-neutral-400">{new Date(anexo.criado_em).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a href={anexo.url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-primary transition-colors hover:bg-primary-light" title="Download">
                        <Download size={18} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-10 text-center text-neutral-500">Erro ao carregar detalhes</div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-xl bg-neutral-100 px-6 py-2 font-semibold text-neutral-700 transition-colors hover:bg-neutral-200">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function OrcamentoConfirmacaoModal({
  action,
  orcamento,
  isPending,
  onCancel,
  onConfirm,
}: {
  action: ConfirmAction
  orcamento: Orcamento
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const isAccept = action === 'aceitar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', isAccept ? 'bg-success-light' : 'bg-error-light')}>
            {isAccept ? <CheckCircle size={24} className="text-success" /> : <XCircle size={24} className="text-error" />}
          </div>
          <h3 className="text-lg font-bold text-neutral-900">{isAccept ? 'Aceitar proposta?' : 'Recusar proposta?'}</h3>
        </div>
        <p className="text-sm leading-relaxed text-neutral-600">
          {isAccept
            ? `Você está aceitando a proposta de ${formatCurrency(orcamento.valor)} da empresa ${orcamento.organizacao.nome}. O prestador será notificado para dar andamento.`
            : 'Tem certeza que deseja recusar permanentemente esta proposta? Esta ação não pode ser desfeita.'}
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border-2 border-neutral-200 py-3 font-bold text-neutral-700 transition-colors hover:bg-neutral-50">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-colors disabled:opacity-60',
              isAccept ? 'bg-success hover:bg-green-700' : 'bg-error hover:bg-red-700',
            )}
          >
            {isPending ? <Spinner size="sm" color="white" /> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OrcamentoCard({
  orc,
  cotacaoId,
  cotacaoStatus,
  showPageLink = false,
  onAction,
}: {
  orc: Orcamento
  cotacaoId: string
  cotacaoStatus: CotacaoStatus
  showPageLink?: boolean
  onAction?: () => void
}) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()

  const aceitar = useMutation({
    mutationFn: () => cotacoesService.aceitarOrcamento(cotacaoId, orc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotacoes', cotacaoId] })
      qc.invalidateQueries({ queryKey: ['cotacoes'] })
      addToast({ type: 'success', title: 'Orçamento aceito! O prestador será notificado.' })
      setConfirmAction(null)
      onAction?.()
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao aceitar orçamento.' }),
  })

  const rejeitar = useMutation({
    mutationFn: () => cotacoesService.rejeitarOrcamento(cotacaoId, orc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotacoes', cotacaoId] })
      qc.invalidateQueries({ queryKey: ['cotacoes'] })
      addToast({ type: 'success', title: 'Proposta rejeitada.' })
      setConfirmAction(null)
      onAction?.()
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao rejeitar orçamento.' }),
  })

  const podeAgir = !['orcamento_aceito', 'em_contato', 'em_execucao', 'finalizado', 'cancelado'].includes(cotacaoStatus) && orc.status === 'aguardando_aprovacao'
  const statusOrc = {
    aguardando_aprovacao: { label: 'Aguardando decisão', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
    aprovado: { label: 'Proposta aceita', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
    rejeitado: { label: 'Proposta rejeitada', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
    cancelado: { label: 'Cancelada', color: 'text-neutral-500', bg: 'bg-neutral-100', Icon: XCircle },
  }[orc.status] || { label: 'Desconhecido', color: 'text-neutral-500', bg: 'bg-neutral-100', Icon: Clock }
  const StatusIcon = statusOrc.Icon

  return (
    <div className={cn(
      'space-y-4 rounded-xl border p-5 shadow-sm transition-colors',
      orc.status === 'aprovado' ? 'border-success/30 bg-success-light/30' : 'border-neutral-100 bg-white',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
            {orc.organizacao.nome.charAt(0)}
          </div>
          <div>
            <p className="font-bold leading-tight text-neutral-900">{orc.organizacao.nome}</p>
            {orc.titulo && <p className="mt-0.5 text-xs text-neutral-500">{orc.titulo}</p>}
            {orc.organizacao.avaliacao_media > 0 && (
              <p className="mt-0.5 text-xs text-neutral-500">{orc.organizacao.avaliacao_media.toFixed(1)} ({orc.organizacao.total_avaliacoes} avaliações)</p>
            )}
          </div>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', statusOrc.bg, statusOrc.color)}>
          <StatusIcon size={12} />
          {statusOrc.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Valor proposto</p>
          <p className="text-xl font-extrabold text-primary">{formatCurrency(orc.valor)}</p>
        </div>
        {orc.prazo_dias && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Validade da proposta</p>
            <p className="mt-0.5 flex items-center gap-1 font-semibold text-neutral-700">
              <Clock size={14} className="text-neutral-400" />
              {orc.prazo_dias} dias
            </p>
          </div>
        )}
      </div>

      {orc.descricao && (
        <div className="rounded-lg border border-neutral-100/50 bg-neutral-50 p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{orc.descricao}</p>
        </div>
      )}

      {podeAgir && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setConfirmAction('rejeitar')}
            disabled={rejeitar.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-error/20 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error-light"
          >
            {rejeitar.isPending ? <Spinner size="sm" /> : <XCircle size={16} />}
            Recusar
          </button>
          <button
            onClick={() => setConfirmAction('aceitar')}
            disabled={aceitar.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-sm font-semibold text-white shadow-lg shadow-success/20 transition-colors hover:bg-green-700"
          >
            {aceitar.isPending ? <Spinner size="sm" color="white" /> : <CheckCircle size={16} />}
            Aceitar proposta
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setShowDetalhes(true)}
          className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Ver detalhes
        </button>
        {showPageLink && (
          <Link
            to={`/orcamentos/${cotacaoId}`}
            className="flex flex-[0.3] items-center justify-center rounded-xl border border-neutral-200 py-2.5 text-neutral-500 transition-colors hover:text-primary"
            title="Ver na página inteira"
          >
            <FileText size={18} />
          </Link>
        )}
      </div>

      {showDetalhes && <OrcamentoDetalhesModal cotacaoId={cotacaoId} orcamentoId={orc.id} onClose={() => setShowDetalhes(false)} />}
      {confirmAction && (
        <OrcamentoConfirmacaoModal
          action={confirmAction}
          orcamento={orc}
          isPending={aceitar.isPending || rejeitar.isPending}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => (confirmAction === 'aceitar' ? aceitar.mutate() : rejeitar.mutate())}
        />
      )}
    </div>
  )
}
