import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, MapPin, Calendar, DollarSign, Star, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useCotacao, useOrcamentoDetalhes } from '@/hooks/useCotacoes'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { Stars } from '@/components/ui/Stars'
import { FileText, Download } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cotacoesService } from '@/services/api/cotacoes'
import { useUIStore } from '@/stores/uiStore'
import type { Orcamento, CotacaoStatus } from '@/types/domain'

const STATUS_CONFIG: Record<CotacaoStatus, { label: string; color: string; bg: string }> = {
  ABERTA: { label: 'Aguardando propostas', color: 'text-warning', bg: 'bg-warning-light' },
  COM_PROPOSTAS: { label: 'Com propostas recebidas', color: 'text-info', bg: 'bg-info-light' },
  ACEITA: { label: 'Aceita', color: 'text-success', bg: 'bg-success-light' },
  CANCELADA: { label: 'Cancelada', color: 'text-error', bg: 'bg-error-light' },
  EXPIRADA: { label: 'Expirada', color: 'text-neutral-500', bg: 'bg-neutral-100' },
}

function OrcamentoCard({
  orc,
  cotacaoId,
  cotacaoStatus,
}: {
  orc: Orcamento
  cotacaoId: string
  cotacaoStatus: CotacaoStatus
}) {
  const [confirmAceitar, setConfirmAceitar] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)

  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()

  const aceitar = useMutation({
    mutationFn: () => cotacoesService.aceitarOrcamento(cotacaoId, orc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotacoes', cotacaoId] })
      qc.invalidateQueries({ queryKey: ['cotacoes'] })
      addToast({ type: 'success', title: 'Orçamento aceito! O prestador será notificado.' })
      setConfirmAceitar(false)
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao aceitar orçamento.' }),
  })

  const rejeitar = useMutation({
    mutationFn: () => cotacoesService.rejeitarOrcamento(cotacaoId, orc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotacoes', cotacaoId] })
      addToast({ type: 'success', title: 'Proposta rejeitada.' })
    },
  })

  const podeAgir = cotacaoStatus !== 'ACEITA' && cotacaoStatus !== 'CANCELADA' && cotacaoStatus !== 'EXPIRADA' && orc.status === 'PENDENTE'

  const { data: orcDetalhes, isLoading: loadingDetalhes } = useOrcamentoDetalhes(cotacaoId, orc.id, showDetalhes)

  const statusOrc = {
    PENDENTE: { label: 'Aguardando decisão', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
    ACEITO: { label: 'Aceito', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
    REJEITADO: { label: 'Rejeitado', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
    aguardando_aprovacao: { label: 'Aguardando aprovação', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  }[orc.status] || { label: 'Desconhecido', color: 'text-neutral-500', bg: 'bg-neutral-100', Icon: Clock }

  const StatusIcon = statusOrc.Icon

  return (
    <div className="bg-white border border-neutral-100 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0 text-xl font-bold text-primary">
          {orc.organizacao.nome.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 truncate">{orc.organizacao.nome}</p>
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <Stars rating={orc.organizacao.avaliacao_media} size="sm" showValue />
            <span>({orc.organizacao.total_avaliacoes})</span>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusOrc.bg} ${statusOrc.color} shrink-0`}>
          <StatusIcon size={10} />
          {statusOrc.label}
        </span>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-sm">
        <div className="flex items-center gap-1 text-neutral-600">
          <DollarSign size={14} className="text-primary" />
          <span className="font-bold text-lg text-primary">{formatCurrency(orc.valor)}</span>
        </div>
        {orc.prazo_dias && (
          <div className="flex items-center gap-1 text-neutral-500">
            <Clock size={14} />
            <span>Prazo: {orc.prazo_dias} dias</span>
          </div>
        )}
      </div>

      {orc.descricao && (
        <p className="text-sm text-neutral-600 leading-relaxed">{orc.descricao}</p>
      )}

      {podeAgir && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => rejeitar.mutate()}
            disabled={rejeitar.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 border border-error text-error font-semibold py-2.5 rounded-xl hover:bg-error-light transition-colors text-sm"
          >
            {rejeitar.isPending ? <Spinner size="sm" /> : <XCircle size={15} />}
            Rejeitar
          </button>
          <button
            onClick={() => setConfirmAceitar(true)}
            disabled={aceitar.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 bg-success hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {aceitar.isPending ? <Spinner size="sm" color="white" /> : <CheckCircle size={15} />}
            Aceitar proposta
          </button>
        </div>
      )}

      {/* Botoes de acao da proposta */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setShowDetalhes(true)}
          className="flex-1 border border-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-sm"
        >
          Ver detalhes
        </button>
      </div>

      {/* Modal de Detalhes da Proposta */}
      {showDetalhes && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4" onClick={() => setShowDetalhes(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900">Detalhes da Proposta</h3>
              <button onClick={() => setShowDetalhes(false)} className="text-neutral-400 hover:text-neutral-600">
                <XCircle size={24} />
              </button>
            </div>

            {loadingDetalhes ? (
               <div className="flex justify-center py-10"><Spinner /></div>
            ) : orcDetalhes ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-1">Prestador</h4>
                  <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg">
                     <div className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center font-bold text-primary">
                      {orcDetalhes.organizacao?.nome?.charAt(0) || orcDetalhes.provedor_nome?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{orcDetalhes.organizacao?.nome || orcDetalhes.provedor_nome || 'Prestador Desconhecido'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-neutral-50 p-3 rounded-lg">
                      <p className="text-sm text-neutral-500 mb-1">Valor Proposto</p>
                      <p className="font-bold text-primary text-lg">{formatCurrency(orcDetalhes.valor)}</p>
                   </div>
                   <div className="bg-neutral-50 p-3 rounded-lg">
                      <p className="text-sm text-neutral-500 mb-1">Prazo Estimado</p>
                      <p className="font-semibold text-neutral-700">
                        {orcDetalhes.prazo_dias ? `${orcDetalhes.prazo_dias} dias` : 'Não informado'}
                      </p>
                   </div>
                </div>

                <div>
                   <h4 className="font-semibold text-neutral-900 mb-2">Mensagem do Prestador</h4>
                   <div className="bg-neutral-50 p-4 rounded-lg">
                      {orcDetalhes.descricao ? (
                        <p className="text-sm text-neutral-700 whitespace-pre-line">{orcDetalhes.descricao}</p>
                      ) : (
                        <p className="text-sm text-neutral-500 italic">Nenhuma mensagem adicional.</p>
                      )}
                   </div>
                </div>

                {orcDetalhes.anexos && orcDetalhes.anexos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-2">Anexos ({orcDetalhes.anexos.length})</h4>
                    <div className="space-y-2">
                       {orcDetalhes.anexos.map((anexo: any) => (
                         <div key={anexo.id} className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className="p-2 bg-primary-light text-primary rounded-lg shrink-0">
                                  <FileText size={18} />
                               </div>
                               <div className="min-w-0">
                                 <p className="text-sm font-medium text-neutral-700 truncate">{anexo.nome_arquivo}</p>
                                 <p className="text-xs text-neutral-400">{new Date(anexo.criado_em).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <a href={anexo.url} target="_blank" rel="noopener noreferrer" className="p-2 text-primary hover:bg-primary-light rounded-lg transition-colors" title="Download">
                              <Download size={18} />
                            </a>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-neutral-500">Erro ao carregar detalhes</div>
            )}
            
            <div className="mt-6 flex justify-end">
               <button onClick={() => setShowDetalhes(false)} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold py-2 px-6 rounded-xl transition-colors">
                  Fechar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação aceitar */}
      {confirmAceitar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmAceitar(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success-light flex items-center justify-center">
                <AlertTriangle size={20} className="text-success" />
              </div>
              <h3 className="font-semibold text-neutral-900">Aceitar proposta?</h3>
            </div>
            <p className="text-sm text-neutral-500">Esta ação é irreversível. Ao aceitar, o prestador <strong>{orc.organizacao.nome}</strong> será notificado para iniciar o serviço.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAceitar(false)} className="flex-1 border border-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition-colors">Cancelar</button>
              <button
                onClick={() => aceitar.mutate()}
                disabled={aceitar.isPending}
                className="flex-1 bg-success hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {aceitar.isPending ? <Spinner size="sm" color="white" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CotacaoDetalhe() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: cotacao, isLoading } = useCotacao(id)

  if (isLoading) {
    return <PageWrapper><Container><div className="flex justify-center py-20"><Spinner size="lg" /></div></Container></PageWrapper>
  }

  if (!cotacao) {
    return (
      <PageWrapper><Container>
        <div className="text-center py-20">
          <p className="text-neutral-500">Cotação não encontrada.</p>
          <Link to="/conta/orcamentos" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">Ver meus orçamentos</Link>
        </div>
      </Container></PageWrapper>
    )
  }

  const config = STATUS_CONFIG[cotacao.status]
  const orcamentos = cotacao.orcamentos ?? []

  return (
    <PageWrapper>
      <Container>
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-neutral-500 mb-4">
          <Link to="/orcamentos" className="hover:text-neutral-700 transition-colors">Meus Orçamentos</Link>
          <ChevronLeft size={14} className="rotate-180" />
          <span className="font-medium text-neutral-700 truncate max-w-[200px]">{cotacao.descricao.slice(0, 40)}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info da cotação */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4 sticky top-20">
              <div>
                <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                <h1 className="text-lg font-bold text-neutral-900 mt-2 leading-snug">{cotacao.descricao.slice(0, 80)}{cotacao.descricao.length > 80 ? '...' : ''}</h1>
              </div>

              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-primary shrink-0" />
                  <span>{cotacao.categoria.valor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-neutral-400 shrink-0" />
                  <span>{cotacao.localidade}</span>
                </div>
                {cotacao.data_desejada && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-neutral-400 shrink-0" />
                    <span>{formatDate(cotacao.data_desejada)}</span>
                  </div>
                )}
                {(cotacao.orcamento_minimo || cotacao.orcamento_maximo) && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-neutral-400 shrink-0" />
                    <span>
                      {cotacao.orcamento_minimo ? formatCurrency(cotacao.orcamento_minimo) : 'Sem mínimo'}
                      {' — '}
                      {cotacao.orcamento_maximo ? formatCurrency(cotacao.orcamento_maximo) : 'Sem máximo'}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-100 pt-3 text-xs text-neutral-400">
                Solicitado em {formatDate(cotacao.criado_em)}
              </div>
            </div>
          </div>

          {/* Propostas */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              {orcamentos.length === 0 ? 'Aguardando propostas' : `${orcamentos.length} proposta${orcamentos.length > 1 ? 's' : ''} recebida${orcamentos.length > 1 ? 's' : ''}`}
            </h2>

            {orcamentos.length === 0 ? (
              <div className="text-center py-16 bg-white border border-neutral-100 rounded-2xl">
                <Clock size={48} className="mx-auto text-neutral-200 mb-3" />
                <p className="font-semibold text-neutral-600">Nenhuma proposta ainda</p>
                <p className="text-sm text-neutral-400 mt-1">Prestadores estão analisando sua solicitação</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orcamentos.map((orc) => (
                  <OrcamentoCard key={orc.id} orc={orc} cotacaoId={cotacao.id} cotacaoStatus={cotacao.status} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </PageWrapper>
  )
}
