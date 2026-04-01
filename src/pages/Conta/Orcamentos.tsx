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
  Download
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Container } from '@/components/layout/Container';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { useCotacoes, useCotacao, useOrcamentoDetalhes } from '@/hooks/useCotacoes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cotacoesService } from '@/services/api/cotacoes';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { Spinner } from '@/components/ui/Spinner';
import type { Cotacao, Orcamento, CotacaoStatus } from '@/types/domain';

// ---------------------------------------------------------------------------
// Configuração de Status
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<CotacaoStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  ABERTA: { label: 'Aguardando propostas', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  COM_PROPOSTAS: { label: 'Com propostas', color: 'text-info', bg: 'bg-info-light', Icon: MessageSquare },
  ACEITA: { label: 'Aceita', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  CANCELADA: { label: 'Cancelada', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
  EXPIRADA: { label: 'Expirada', color: 'text-neutral-500', bg: 'bg-neutral-100', Icon: AlertCircle },
};

const STATUS_TABS: { value: CotacaoStatus | 'TODOS'; label: string }[] = [
  { value: 'TODOS', label: 'Todas' },
  { value: 'ABERTA', label: 'Aguardando' },
  { value: 'COM_PROPOSTAS', label: 'Com propostas' },
  { value: 'ACEITA', label: 'Aceitas' },
];

// ---------------------------------------------------------------------------
// Card de Proposta (Orçamento recebido de um prestador)
// ---------------------------------------------------------------------------

function OrcamentoCard({
  orc,
  cotacaoId,
  cotacaoStatus,
  onAction,
}: {
  orc: Orcamento;
  cotacaoId: string;
  cotacaoStatus: CotacaoStatus;
  onAction?: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<null | 'aceitar' | 'rejeitar'>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const qc = useQueryClient();

  const { data: orcDetalhes, isLoading: loadingDetalhes } = useOrcamentoDetalhes(cotacaoId, orc.id, showDetalhes);


  const aceitar = useMutation({
    mutationFn: () => cotacoesService.aceitarOrcamento(cotacaoId, orc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotacoes', cotacaoId] });
      qc.invalidateQueries({ queryKey: ['cotacoes'] });
      addToast({ type: 'success', title: 'Orçamento aceito! O prestador será notificado.' });
      setConfirmAction(null);
      onAction?.();
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao aceitar orçamento.' }),
  });

  const rejeitar = useMutation({
    mutationFn: () => cotacoesService.rejeitarOrcamento(cotacaoId, orc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotacoes', cotacaoId] });
      addToast({ type: 'success', title: 'Proposta rejeitada.' });
      setConfirmAction(null);
      onAction?.();
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao rejeitar orçamento.' }),
  });

  const podeAgir = cotacaoStatus !== 'ACEITA' && cotacaoStatus !== 'CANCELADA' && cotacaoStatus !== 'EXPIRADA' && orc.status === 'PENDENTE';

  const statusOrc = {
    PENDENTE: { label: 'Aguardando decisão', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
    ACEITO: { label: 'Proposta Aceita', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
    REJEITADO: { label: 'Proposta Rejeitada', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
    aguardando_aprovacao: { label: 'Aguardando aprovação', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  }[orc.status] || { label: 'Desconhecido', color: 'text-neutral-500', bg: 'bg-neutral-100', Icon: Clock };

  const StatusIcon = statusOrc.Icon;

  return (
    <div className={cn(
      "border rounded-xl p-5 shadow-sm space-y-4 transition-colors",
      orc.status === 'ACEITO' ? "bg-success-light/30 border-success/30" : "bg-white border-neutral-100"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center shrink-0 text-lg font-bold text-primary">
            {orc.organizacao.nome.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-neutral-900 leading-tight">{orc.organizacao.nome}</p>
            {orc.organizacao.avaliacao_media > 0 && (
              <p className="text-xs text-neutral-500 mt-0.5">⭐ {orc.organizacao.avaliacao_media.toFixed(1)} ({orc.organizacao.total_avaliacoes} avaliações)</p>
            )}
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", statusOrc.bg, statusOrc.color)}>
          <StatusIcon size={12} />
          {statusOrc.label}
        </span>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Valor Proposto</p>
          <p className="font-extrabold text-xl text-primary">{formatCurrency(orc.valor)}</p>
        </div>
        {orc.prazo_dias && (
          <div>
             <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Prazo de execução</p>
             <p className="font-semibold text-neutral-700 flex items-center gap-1 mt-0.5">
               <Clock size={14} className="text-neutral-400" />
               {orc.prazo_dias} dias
             </p>
          </div>
        )}
      </div>

      {orc.descricao && (
        <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100/50">
          <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{orc.descricao}</p>
        </div>
      )}

      {podeAgir && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setConfirmAction('rejeitar')}
            disabled={rejeitar.isPending}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-error/20 text-error font-semibold py-2.5 rounded-xl hover:bg-error-light transition-colors text-sm"
          >
            {rejeitar.isPending ? <Spinner size="sm" /> : <XCircle size={16} />}
            Recusar
          </button>
          <button
            onClick={() => setConfirmAction('aceitar')}
            disabled={aceitar.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-success/20 text-sm"
          >
            {aceitar.isPending ? <Spinner size="sm" color="white" /> : <CheckCircle size={16} />}
            Aceitar Proposta
          </button>
        </div>
      )}

      {/* Botões de Ação Auxiliares */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setShowDetalhes(true)}
          className="flex-1 border border-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-sm"
        >
          Ver detalhes
        </button>
        <Link
          to={`/orcamentos/${cotacaoId}`}
          className="flex flex-[0.3] items-center justify-center border border-neutral-200 text-neutral-500 hover:text-primary py-2.5 rounded-xl transition-colors"
          title="Ver na página inteira"
        >
          <FileText size={18} />
        </Link>
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

      {/* Modal de Confirmação Inline */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", confirmAction === 'aceitar' ? 'bg-success-light' : 'bg-error-light')}>
                {confirmAction === 'aceitar' ? <CheckCircle size={24} className="text-success" /> : <XCircle size={24} className="text-error" />}
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                {confirmAction === 'aceitar' ? 'Aceitar proposta?' : 'Recusar proposta?'}
              </h3>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {confirmAction === 'aceitar'
                ? `Você está aceitando a proposta de ${formatCurrency(orc.valor)} da empresa ${orc.organizacao.nome}. O prestador será notificado para dar andamento.`
                : 'Tem certeza que deseja recusar permanentemente esta proposta? Esta ação não pode ser desfeita.'}
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 border-2 border-neutral-200 text-neutral-700 font-bold py-3 rounded-xl hover:bg-neutral-50 transition-colors">Cancelar</button>
              <button
                onClick={() => (confirmAction === 'aceitar' ? aceitar.mutate() : rejeitar.mutate())}
                disabled={aceitar.isPending || rejeitar.isPending}
                className={cn(
                  "flex-1 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2",
                  confirmAction === 'aceitar' ? 'bg-success hover:bg-green-700' : 'bg-error hover:bg-red-700'
                )}
              >
                {aceitar.isPending || rejeitar.isPending ? <Spinner size="sm" color="white" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
          </div>
          <p className="text-base font-bold text-neutral-900 truncate pr-4">{cotacao.descricao}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs font-medium text-neutral-500">
            <span className="text-primary">{cotacao.categoria?.valor || 'Serviço'}</span>
            <span className="h-1 w-1 bg-neutral-300 rounded-full" />
            <span>{cotacao.localidade}</span>
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