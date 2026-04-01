import React, { useState, useMemo } from 'react'
import { Star, ShoppingBag, MessageSquare } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { usePedidos } from '@/hooks/usePedidos'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { Stars } from '@/components/ui/Stars'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { AvaliacaoPedidoModal } from '@/components/marketplace/AvaliacaoPedidoModal'
import type { Pedido } from '@/types/domain'

export default function Avaliacoes() {
  const { data: pedidos = [], isLoading } = usePedidos(1, 100)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)

  // Filtra pedidos concluídos usando a mesma normalização de Pedidos.tsx
  const pedidosConcluidos = useMemo(() => {
    return pedidos.filter((p: Pedido) => {
      const status = (p.status || '').toString().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
      return status === 'CONCLUIDO' || status === 'ENTREGUE'
    })
  }, [pedidos])

  return (
    <PageWrapper>
      <Container className="py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col gap-1">
               <h1 className="text-2xl md:text-3xl font-black text-neutral-900 font-poppins">Minhas Avaliações</h1>
               <p className="text-neutral-500 font-medium">Avalie sua experiência com serviços já concluídos.</p>
            </div>

            <div className="bg-white border border-neutral-100 rounded-[32px] shadow-sm p-6 md:p-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Spinner size="lg" />
                  <p className="text-neutral-400 font-bold animate-pulse">Carregando seus pedidos...</p>
                </div>
              ) : pedidosConcluidos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-20 w-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} className="text-neutral-200" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-800">Nenhum serviço para avaliar</h3>
                  <p className="text-neutral-500 mt-2 max-w-sm mx-auto">
                    Apenas serviços marcados como concluídos ou entregues podem ser avaliados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidosConcluidos.map((pedido: Pedido) => {
                    const hasLinhas = pedido.linhas && pedido.linhas.length > 0;
                    const itemsText = hasLinhas 
                      ? (pedido.linhas[0].titulo + (pedido.linhas.length > 1 ? ` +${pedido.linhas.length - 1} itens` : ''))
                      : 'Serviço s/ descrição';

                    return (
                      <div
                        key={pedido.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-neutral-100 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-100">
                               #{pedido.codigo || pedido.id.slice(0, 8).toUpperCase()}
                             </span>
                             <span className="text-[10px] font-bold text-neutral-400">• {formatDate(pedido.criado_em)}</span>
                          </div>
                          <p className="text-base font-bold text-neutral-900 truncate group-hover:text-primary transition-colors">
                            {itemsText}
                          </p>
                          <p className="text-xs font-bold text-neutral-500 mt-1">
                            Total: <span className="text-neutral-700">{formatCurrency(parseFloat(pedido.total))}</span>
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-3">
                          {pedido.avaliado ? (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-success/10 text-success rounded-2xl text-xs font-bold border border-success/20">
                              <Star size={14} className="fill-success" />
                              Já Avaliado
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSelectedPedido(pedido)}
                              className="rounded-2xl gap-2 font-bold"
                            >
                              <MessageSquare size={16} />
                              Avaliar Agora
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedPedido && (
           <AvaliacaoPedidoModal 
              isOpen={!!selectedPedido} 
              onClose={() => setSelectedPedido(null)} 
              pedido={selectedPedido} 
           />
        )}
      </Container>
    </PageWrapper>
  )
}
