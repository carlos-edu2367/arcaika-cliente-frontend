import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Truck,
  CreditCard,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Container } from '@/components/layout/Container';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { usePedidos, usePagarPedido, useStatusPagamento, PEDIDOS_KEY } from '@/hooks/usePedidos';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { AvaliacaoPedidoModal } from '@/components/marketplace/AvaliacaoPedidoModal';
import type { Pedido } from '@/types/domain';

// ---------------------------------------------------------------------------
// Configuração de Status
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PENDENTE: { label: 'Aguardando Pagamento', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  'aguardando pagamento': { label: 'Aguardando Pagamento', color: 'text-warning', bg: 'bg-warning-light', Icon: Clock },
  PAGO: { label: 'Pagamento Aprovado', color: 'text-info', bg: 'bg-info-light', Icon: CheckCircle },
  'pagamento aprovado': { label: 'Pagamento Aprovado', color: 'text-info', bg: 'bg-info-light', Icon: CheckCircle },
  CONFIRMADO: { label: 'Pedido Confirmado', color: 'text-info', bg: 'bg-info-light', Icon: CheckCircle },
  confirmado: { label: 'Pedido Confirmado', color: 'text-info', bg: 'bg-info-light', Icon: CheckCircle },
  AGENDADO: { label: 'Serviço Agendado', color: 'text-primary', bg: 'bg-primary-light', Icon: Calendar },
  agendado: { label: 'Serviço Agendado', color: 'text-primary', bg: 'bg-primary-light', Icon: Calendar },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'text-info', bg: 'bg-info-light', Icon: Truck },
  'em andamento': { label: 'Em Andamento', color: 'text-info', bg: 'bg-info-light', Icon: Truck },
  CONCLUIDO: { label: 'Concluído', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  concluido: { label: 'Concluído', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  'CONCLUÍDO': { label: 'Concluído', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  'Concluído': { label: 'Concluído', color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
  CANCELADO: { label: 'Cancelado', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
  cancelado: { label: 'Cancelado', color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
};

const STATUS_TABS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDO', label: 'Concluídos' },
];

// ---------------------------------------------------------------------------
// Item do Pedido - Accordion
// ---------------------------------------------------------------------------

function PedidoItem({ pedido }: { pedido: Pedido }) {
  const [expanded, setExpanded] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  
  const statusStr = (pedido.status || '').toString();
  const normalizedStatus = statusStr.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  
  const config = STATUS_CONFIG[statusStr] || STATUS_CONFIG[statusStr.toUpperCase()] || STATUS_CONFIG[normalizedStatus] || { label: statusStr, color: 'text-neutral-500', bg: 'bg-neutral-100', Icon: AlertCircle };
  const Icon = config.Icon;

  const orderItems = pedido.linhas || [];
  const orderCode = pedido.codigo || pedido.id.slice(0, 8).toUpperCase();
  const address = pedido.endereco_entrega;

  const pagarMut = usePagarPedido(pedido.id);
  const qc = useQueryClient();

  // GAP-015: Normaliza o status para comparação independente de acentos/caixa
  const isAguardando = normalizedStatus === 'PENDENTE' || normalizedStatus === 'AGUARDANDO PAGAMENTO';
  const isFinalizado = normalizedStatus === 'CONCLUIDO' || normalizedStatus === 'ENTREGUE';
  const podeAvaliar = isFinalizado && !pedido.avaliado;
  
  // Polling de status
  const { data: statusRealtime } = useStatusPagamento(pedido.id, isAguardando);

  // Se o status do polling for diferente do status inicial do pedido, invalida a lista
  useEffect(() => {
    if (statusRealtime && statusRealtime.status_pedido.toUpperCase() !== statusStr.toUpperCase()) {
      qc.invalidateQueries({ queryKey: PEDIDOS_KEY });
    }
  }, [statusRealtime, statusStr, qc]);

  const handlePayment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Regra Sandbox: Webhook/Gateway muitas vezes não aceita http:// (localhost)
    const isLocal = window.location.hostname === 'localhost';
    const baseUrl = isLocal ? 'https://www.google.com' : window.location.origin;

    try {
      const res = await pagarMut.mutateAsync({
        tipo: 'total',
        url_retorno_sucesso: `${baseUrl}/pedidos/${pedido.id}?status=sucesso`,
        url_retorno_falha: `${baseUrl}/pedidos/${pedido.id}?status=falha`
      });

      if (res.url_pagamento) {
        window.location.href = res.url_pagamento;
      }
    } catch {
      // O hook usePagarPedido já dispara o Toast de erro
    }
  };

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
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2 py-1 rounded-md">
              #{orderCode}
            </span>
          </div>
          <p className="text-base font-bold text-neutral-900 truncate pr-4 mt-1">
            {orderItems[0]?.titulo || 'Serviços contratados'}
            {orderItems.length > 1 && <span className="text-neutral-400 font-medium"> e mais {orderItems.length - 1} item(ns)</span>}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs font-medium text-neutral-500">
            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(pedido.criado_em)}</span>
            <span className="h-1 w-1 bg-neutral-300 rounded-full" />
            <span className="text-neutral-700 font-bold">{formatCurrency(parseFloat(pedido.total))}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {podeAvaliar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAvaliacao(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200 transition-all shadow-sm"
            >
              <Star size={14} className="fill-amber-500 text-amber-500" />
              Avaliar
            </button>
          )}
          <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-neutral-50 text-neutral-400 transition-transform">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-5 animate-in slide-in-from-top-2 duration-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Endereço */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Endereço de Atendimento</h4>
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-neutral-600 space-y-0.5">
                  {address ? (
                    <>
                      <p className="font-semibold text-neutral-900">
                        {address.rua},
                        {address.complemento && ` - ${address.complemento}`}
                      </p>
                      <p>{address.bairro}</p>
                      <p>{address.cidade} - {address.estado}</p>
                      <p className="text-xs text-neutral-400 mt-1">CEP: {address.cep}</p>
                    </>
                  ) : <p className="italic text-neutral-400">Não informado</p>}
                </div>
              </div>
            </div>

            {/* Resumo e Pagamento */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Informações de Pagamento</h4>
              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex flex-col justify-between h-full">
                <div className="space-y-2">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500 flex items-center gap-1.5"><CreditCard size={14} /> Método</span>
                      <span className="font-semibold text-neutral-900 capitalize">
                         {pedido.pagamento?.tipo?.replace('_', ' ') || 'A definir'}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500 flex items-center gap-1.5"><CheckCircle size={14} /> Situação</span>
                      <span className={cn("font-bold", (pedido.pagamento?.status || '').toUpperCase() === 'APROVADO' ? 'text-success' : 'text-warning')}>
                         {(pedido.status).toUpperCase() || 'Pendente'}
                      </span>
                   </div>
                </div>
                
                {['PENDENTE', 'aguardando pagamento'].includes(statusStr) && (
                  <button 
                    onClick={handlePayment}
                    disabled={pagarMut.isPending}
                    className="mt-4 w-full bg-neutral-900 hover:bg-black text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {pagarMut.isPending ? <Spinner size="sm" color="white" /> : 'Realizar Pagamento'}
                  </button>
                )}

                {podeAvaliar && (
                  <button 
                    onClick={() => setShowAvaliacao(true)}
                    className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Star size={16} className="fill-white" />
                    Avaliar Experiência
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
             <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Itens do Pedido</h4>
             <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
               <div className="divide-y divide-neutral-100">
                 {orderItems.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center p-4 hover:bg-neutral-50/50 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                         <ShoppingBag size={18} className="text-neutral-500" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-neutral-900 leading-tight">{item.titulo}</p>
                         <p className="text-xs text-neutral-500 mt-0.5">Qtd: {item.quantidade}</p>
                       </div>
                     </div>
                     <div className="text-right">
                        <span className="text-sm font-bold text-neutral-800">
                          {formatCurrency(parseFloat(item.subtotal))}
                        </span>
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex flex-col gap-1.5 text-sm">
                 <div className="flex justify-between text-neutral-500">
                   <span>Subtotal</span>
                   <span className="font-medium text-neutral-700">{formatCurrency(parseFloat(pedido.subtotal))}</span>
                 </div>
                 {parseFloat(pedido.desconto) > 0 && (
                   <div className="flex justify-between text-success font-medium">
                     <span>Desconto Aplicado</span>
                     <span>-{formatCurrency(parseFloat(pedido.desconto))}</span>
                   </div>
                 )}
                 <div className="flex justify-between text-neutral-900 font-extrabold text-base mt-2 pt-2 border-t border-neutral-200">
                   <span>Total Final</span>
                   <span className="text-primary">{formatCurrency(parseFloat(pedido.total))}</span>
                 </div>
               </div>
             </div>
          </div>

        </div>
      )}

      <AvaliacaoPedidoModal 
        isOpen={showAvaliacao} 
        onClose={() => setShowAvaliacao(false)} 
        pedido={pedido} 
      />
    </div>
  );
}

export default function Pedidos() {
  const [tab, setTab] = useState<string>('TODOS');
  const { data: pedidos, isLoading, error } = usePedidos(1, 100);

  const filteredPedidos = useMemo(() => {
    const list = pedidos as Pedido[];
    if (!list) return [];
    if (tab === 'TODOS') return list;
    
    const statusesEmAndamento = ['PENDENTE', 'aguardando pagamento', 'PAGO', 'AGENDADO', 'EM_ANDAMENTO', 'CONFIRMADO'];
    if (tab === 'EM_ANDAMENTO') {
      return list.filter(p => statusesEmAndamento.includes(p.status as string) || statusesEmAndamento.includes((p.status as string).toUpperCase()));
    }
    if (tab === 'CONCLUIDO' || tab === 'CONCLUÍDO') {
      return list.filter(p => {
        const s = (p.status as string).toUpperCase();
        return s === 'CONCLUIDO' || s === 'CONCLUÍDO';
      });
    }
    return list;
  }, [pedidos, tab]);

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
              <div className="mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Meus pedidos</h2>
                <p className="text-sm text-neutral-500 mt-1">Acompanhe os serviços contratados e suas compras.</p>
              </div>

              {!isLoading && (pedidos as Pedido[]).length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                  {STATUS_TABS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setTab(value)}
                      className={cn(
                        "shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all",
                        tab === value ? "bg-neutral-900 text-white shadow-md" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-4 pt-4">
                   {[1, 2, 3].map(i => <div key={i} className="h-28 w-full bg-neutral-100 animate-pulse rounded-xl" />)}
                </div>
              ) : error ? (
                <div className="text-center py-16 bg-error-light/30 rounded-2xl border border-error/20">
                  <AlertCircle size={40} className="mx-auto mb-3 text-error" />
                  <p className="font-bold text-neutral-900">Não foi possível carregar os pedidos</p>
                  <p className="text-sm text-neutral-600 mt-1">Tente atualizar a página ou volte mais tarde.</p>
                </div>
              ) : (pedidos as Pedido[]).length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="h-20 w-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag size={32} className="text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">Nenhum pedido efetuado</h3>
                  <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">Você ainda não contratou nenhum serviço. Que tal dar uma olhada no marketplace?</p>
                  <Link to="/" className="inline-block mt-6 text-sm text-primary font-bold hover:underline">Explorar serviços →</Link>
                </div>
              ) : filteredPedidos.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-neutral-100 rounded-2xl">
                  <p className="font-semibold text-neutral-600">Nenhum pedido encontrado com este filtro.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPedidos.map((pedido) => <PedidoItem key={pedido.id} pedido={pedido} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}