import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, MapPin, Calendar, Star, Clock } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useCotacao } from '@/hooks/useCotacoes'
import { formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { FileText } from 'lucide-react'
import { OrcamentoCard } from '@/components/orcamentos/OrcamentoCard'
import type { CotacaoStatus } from '@/types/domain'

const STATUS_CONFIG: Record<CotacaoStatus, { label: string; color: string; bg: string }> = {
  aguardando_orcamento: { label: 'Aguardando propostas', color: 'text-warning', bg: 'bg-warning-light' },
  orcamento_recebido: { label: 'Com propostas recebidas', color: 'text-info', bg: 'bg-info-light' },
  orcamento_aceito: { label: 'Proposta aceita', color: 'text-success', bg: 'bg-success-light' },
  em_contato: { label: 'Em contato', color: 'text-info', bg: 'bg-info-light' },
  em_execucao: { label: 'Em execução', color: 'text-info', bg: 'bg-info-light' },
  finalizado: { label: 'Finalizado', color: 'text-success', bg: 'bg-success-light' },
  cancelado: { label: 'Cancelada', color: 'text-error', bg: 'bg-error-light' },
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
  const titulo = cotacao.titulo || cotacao.descricao

  return (
    <PageWrapper>
      <Container>
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-neutral-500 mb-4">
          <Link to="/conta/orcamentos" className="hover:text-neutral-700 transition-colors">Meus Orçamentos</Link>
          <ChevronLeft size={14} className="rotate-180" />
          <span className="font-medium text-neutral-700 truncate max-w-[200px]">{titulo.slice(0, 40)}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info da cotação */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4 sticky top-20">
              <div>
                <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                <h1 className="text-lg font-bold text-neutral-900 mt-2 leading-snug">{titulo}</h1>
                {cotacao.titulo && (
                  <p className="text-sm text-neutral-600 leading-relaxed mt-2">{cotacao.descricao}</p>
                )}
              </div>

              <div className="space-y-2 text-sm text-neutral-600">
                {cotacao.numero_contrato && (
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-neutral-400 shrink-0" />
                    <span>Contrato {cotacao.numero_contrato}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-primary shrink-0" />
                  <span>{cotacao.categoria.valor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-neutral-400 shrink-0" />
                  <span>{cotacao.localidade}</span>
                </div>
                {cotacao.endereco_completo && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                    <span>{cotacao.endereco_completo}</span>
                  </div>
                )}
                {cotacao.metragem && (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 shrink-0 text-xs font-bold">m2</span>
                    <span>{cotacao.metragem} m²</span>
                  </div>
                )}
                {cotacao.data_finalizacao_estimada && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-neutral-400 shrink-0" />
                    <span>Finalização estimada em {formatDate(cotacao.data_finalizacao_estimada)}</span>
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
