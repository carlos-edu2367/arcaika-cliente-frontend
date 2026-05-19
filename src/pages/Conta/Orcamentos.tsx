import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  AlertCircle,
  Plus,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Container } from '@/components/layout/Container';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { useCotacoes, useCotacao } from '@/hooks/useCotacoes';
import { formatDate, cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { OrcamentoCard } from '@/components/orcamentos/OrcamentoCard';
import type { Cotacao, CotacaoStatus } from '@/types/domain';

// ---------------------------------------------------------------------------
// Configuração de Status
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<CotacaoStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  aguardando_orcamento: { label: 'Aguardando propostas', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  orcamento_recebido: { label: 'Com propostas', color: 'text-info', bg: 'bg-info-light', Icon: MessageSquare },
  orcamento_aceito: { label: 'Proposta aceita', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  em_contato: { label: 'Em contato', color: 'text-info', bg: 'bg-info-light', Icon: MessageSquare },
  em_execucao: { label: 'Em execução', color: 'text-info', bg: 'bg-info-light', Icon: Clock },
  finalizado: { label: 'Finalizado', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
};

const STATUS_TABS: { value: CotacaoStatus | 'TODOS'; label: string }[] = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'aguardando_orcamento', label: 'Aguardando' },
  { value: 'orcamento_recebido', label: 'Com propostas' },
  { value: 'orcamento_aceito', label: 'Aceitas' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'finalizado', label: 'Finalizadas' },
];

function resumoEndereco(endereco?: string | null) {
  if (!endereco) return null;
  return endereco.length > 72 ? `${endereco.slice(0, 69)}...` : endereco;
}

// ---------------------------------------------------------------------------
// Item da Solicitação (Cotação) - Accordion
// ---------------------------------------------------------------------------

function SolicitacaoItem({ cotacao }: { cotacao: Cotacao }) {
  const [expanded, setExpanded] = useState(false);
  // Lazy fetch das propostas aninhadas apenas quando o usuário expande
  const { data: detalhes, isLoading: isLoadingDetalhes } = useCotacao(expanded ? cotacao.id : null);
  
  const config = STATUS_CONFIG[cotacao.status];
  const Icon = config.Icon;
  const titulo = cotacao.titulo || cotacao.descricao;
  const endereco = resumoEndereco(cotacao.endereco_completo);

  const orcamentos = detalhes?.orcamentos ?? [];

  return (
    <div className={cn(
      "border rounded-xl bg-white shadow-sm overflow-hidden transition-all duration-300",
      expanded ? "border-primary/30 ring-4 ring-primary/5" : "border-neutral-100 hover:border-neutral-200 hover:shadow-md"
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 text-left transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full", config.bg, config.color)}>
              <Icon size={12} strokeWidth={2.5} />
              {config.label}
            </span>
            {cotacao.orcamentos && cotacao.orcamentos.length > 0 && (
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                {cotacao.orcamentos.length} proposta{cotacao.orcamentos.length > 1 ? 's' : ''}
              </span>
            )}
            {cotacao.numero_contrato && (
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                Contrato {cotacao.numero_contrato}
              </span>
            )}
          </div>
          <p className="text-base font-bold text-neutral-900 truncate pr-4">{titulo}</p>
          {cotacao.titulo && (
            <p className="text-sm text-neutral-600 line-clamp-2 pr-4">{cotacao.descricao}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs font-medium text-neutral-500">
            <span className="text-primary">{cotacao.categoria?.valor || 'Serviço'}</span>
            <span className="h-1 w-1 bg-neutral-300 rounded-full" />
            <span>{cotacao.localidade}</span>
            {endereco && (
              <>
                <span className="h-1 w-1 bg-neutral-300 rounded-full" />
                <span>{endereco}</span>
              </>
            )}
            <span className="h-1 w-1 bg-neutral-300 rounded-full" />
            <span>Solicitado em {formatDate(cotacao.criado_em)}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-neutral-50 text-neutral-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-5 animate-in slide-in-from-top-2 duration-200">
          {isLoadingDetalhes ? (
            <div className="space-y-3">
              <div className="h-24 bg-neutral-200/50 rounded-xl animate-pulse" />
              <div className="h-24 bg-neutral-200/50 rounded-xl animate-pulse" />
            </div>
          ) : orcamentos.length === 0 ? (
            <div className="text-center py-8 bg-white border border-neutral-100 rounded-xl">
              <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={20} className="text-neutral-400" />
              </div>
              <p className="font-semibold text-neutral-800">Nenhuma proposta recebida ainda</p>
              <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
                Assim que os prestadores parceiros analisarem sua solicitação, as propostas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-2">Propostas Recebidas</h4>
              {orcamentos.map((orc) => (
                <OrcamentoCard
                  key={orc.id}
                  orc={orc}
                  cotacaoId={cotacao.id}
                  cotacaoStatus={cotacao.status}
                  showPageLink
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página Principal
// ---------------------------------------------------------------------------

export default function Orcamentos() {
  const [tab, setTab] = useState<CotacaoStatus | 'TODOS'>('TODOS');
  
  // Como estamos em 'Minha Conta', buscamos a primeira página com os mais recentes
  const { data: cotacoes, isLoading, error } = useCotacoes(1, 100); 

  const filteredCotacoes = useMemo(() => {
    if (!cotacoes) return [];
    if (tab === 'TODOS') return cotacoes;
    return cotacoes.filter(c => c.status === tab);
  }, [cotacoes, tab]);

  return (
    <PageWrapper>
      <Container>
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-8 font-poppins tracking-tight">Minha conta</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white border border-neutral-100 rounded-[24px] shadow-sm p-6 sm:p-8">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Meus orçamentos</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Gerencie suas solicitações e propostas recebidas.
                  </p>
                </div>
                <Link
                  to="/orcamentos/novo"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 shrink-0 text-sm"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Nova solicitação
                </Link>
              </div>

              {/* Filtros */}
              {!isLoading && cotacoes && cotacoes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                  {STATUS_TABS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setTab(value)}
                      className={cn(
                        "shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all",
                        tab === value 
                          ? "bg-neutral-900 text-white shadow-md" 
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Conteúdo */}
              {isLoading ? (
                <div className="space-y-4 pt-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-28 w-full bg-neutral-100 animate-pulse rounded-xl" />
                   ))}
                </div>
              ) : error ? (
                <div className="text-center py-16 bg-error-light/30 rounded-2xl border border-error/20">
                  <AlertCircle size={40} className="mx-auto mb-3 text-error" />
                  <p className="font-bold text-neutral-900">Não foi possível carregar os dados</p>
                  <p className="text-sm text-neutral-600 mt-1">Tente atualizar a página ou volte mais tarde.</p>
                </div>
              ) : cotacoes.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="h-20 w-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">Nenhuma solicitação de orçamento</h3>
                  <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
                    Você ainda não pediu nenhum orçamento. Quando precisar de um serviço, clique em "Nova solicitação".
                  </p>
                  <Link
                    to="/orcamentos/novo"
                    className="inline-block mt-6 text-sm text-primary font-bold hover:underline"
                  >
                    Fazer meu primeiro pedido →
                  </Link>
                </div>
              ) : filteredCotacoes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-neutral-100 rounded-2xl">
                  <p className="font-semibold text-neutral-600">Nenhum orçamento com este status.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCotacoes.map((cotacao) => (
                    <SolicitacaoItem key={cotacao.id} cotacao={cotacao} />
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
