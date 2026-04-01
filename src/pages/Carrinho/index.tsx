import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, Tag, X, Plus, Minus, ArrowRight } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useCarrinho, mergeCarrinhoItens, CARRINHO_KEY } from '@/hooks/useCarrinho'
import { formatCurrency } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { carrinhoService } from '@/services/api/carrinho'
import { useUIStore } from '@/stores/uiStore'

function CarrinhoVazio() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center">
        <ShoppingBag size={36} className="text-neutral-300" />
      </div>
      <div>
        <p className="text-lg font-semibold text-neutral-700">Seu carrinho está vazio</p>
        <p className="text-sm text-neutral-400 mt-1">Explore os serviços e adicione ao carrinho</p>
      </div>
      <Link
        to="/marketplace"
        className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
      >
        Explorar serviços
      </Link>
    </div>
  )
}

export default function Carrinho() {
  const navigate = useNavigate()
  const { 
    data: carrinho, 
    isLoading, 
    removerServico, 
    atualizarServico,
    removerItem, 
    removerProduto, 
    atualizarProduto,
    aplicarCupom 
  } = useCarrinho()
  
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()
  const [cupomInput, setCupomInput] = useState('')

  const removerCupom = useMutation({
    mutationFn: carrinhoService.removerCupom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carrinho'] })
      addToast({ type: 'success', title: 'Cupom removido.' })
    },
  })

  const handleAplicarCupom = () => {
    if (!cupomInput.trim()) return
    aplicarCupom.mutate(cupomInput.trim(), {
      onSuccess: () => setCupomInput(''),
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        </Container>
      </PageWrapper>
    )
  }

  const hasItems = (carrinho?.itens?.length || 0) > 0 || (carrinho?.servicos?.length || 0) > 0 || (carrinho?.produtos?.length || 0) > 0

  if (!carrinho || !hasItems) {
    return (
      <PageWrapper>
        <Container>
          <h1 className="text-2xl font-bold text-neutral-900 mb-6 font-poppins">Carrinho</h1>
          <CarrinhoVazio />
        </Container>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Container>
        <h1 className="text-2xl font-bold text-neutral-900 mb-6 font-poppins">Carrinho</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Grupos */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SERVIÇOS */}
            {carrinho.servicos && carrinho.servicos.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Serviços
                </h2>
                <div className="space-y-3">
                  {carrinho.servicos.map((s) => (
                    <div key={s.id} className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="p-5 flex gap-5">
                        <div className="h-20 w-20 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden shrink-0 flex items-center justify-center text-3xl">
                          {s.foto_url ? <img src={s.foto_url} alt={s.titulo} className="w-full h-full object-cover" /> : '🔧'}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="font-bold text-neutral-900 text-base leading-tight truncate">{s.titulo}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50/50">
                              <button
                                onClick={() => {
                                  if (s.quantidade <= 1) removerServico.mutate(s.id)
                                  else atualizarServico.mutate({ id: s.id, quantidade: s.quantidade - 1 })
                                }}
                                className="px-3 py-1.5 hover:bg-neutral-100 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-3 text-sm font-bold min-w-[2rem] text-center">{s.quantidade}</span>
                              <button
                                onClick={() => atualizarServico.mutate({ id: s.id, quantidade: s.quantidade + 1 })}
                                className="px-3 py-1.5 hover:bg-neutral-100 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button onClick={() => removerServico.mutate(s.id)} className="text-neutral-400 hover:text-error transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col justify-center">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Subtotal</p>
                          <p className="text-lg font-black text-neutral-900">{formatCurrency(parseFloat(s.subtotal))}</p>
                          <p className="text-[10px] text-neutral-500">{formatCurrency(parseFloat(s.preco_unitario))} / un</p>
                        </div>
                      </div>

                      {/* Produtos Aninhados (Upsells) */}
                      {s.produtos && s.produtos.length > 0 && (
                        <div className="bg-neutral-50/50 border-t border-neutral-100 p-4 pl-12 space-y-3">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Produtos Adicionais</p>
                          {s.produtos.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-4 py-1">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="bg-white border border-neutral-200 text-neutral-500 text-[10px] font-bold px-1.5 rounded-md">{p.quantidade}x</span>
                                <p className="text-sm font-medium text-neutral-600 truncate">{p.titulo}</p>
                              </div>
                              <p className="text-sm font-bold text-neutral-700">{formatCurrency(parseFloat(p.subtotal))}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ITENS DO MARKETPLACE */}
            {carrinho.itens && carrinho.itens.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                  Itens
                </h2>
                <div className="space-y-3">
                  {carrinho.itens.map((i) => (
                    <div key={i.id} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm flex gap-4 items-center">
                      <div className="h-16 w-16 rounded-xl bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                        {i.foto_url ? <img src={i.foto_url} alt={i.titulo} className="w-full h-full object-cover" /> : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 text-sm leading-tight truncate">{i.titulo}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => removerItem.mutate(i.id)} className="text-neutral-400 hover:text-error transition-colors">
                            <Trash2 size={16} />
                          </button>
                          <span className="text-xs font-semibold text-neutral-500">{i.quantidade} unidade(s)</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-neutral-900">{formatCurrency(parseFloat(i.subtotal))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PRODUTOS AVULSOS */}
            {carrinho.produtos && carrinho.produtos.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                  Produtos
                </h2>
                <div className="space-y-3">
                  {carrinho.produtos.map((p) => (
                    <div key={p.id} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm flex gap-4 items-center">
                      <div className="h-16 w-16 rounded-xl bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                        {p.foto_url ? <img src={p.foto_url} alt={p.titulo} className="w-full h-full object-cover" /> : '🛠️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 text-sm leading-tight truncate">{p.titulo}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50/50">
                            <button
                              onClick={() => {
                                if (p.quantidade <= 1) removerProduto.mutate(p.id)
                                else atualizarProduto.mutate({ id: p.id, quantidade: p.quantidade - 1 })
                              }}
                              className="px-2.5 py-1 hover:bg-neutral-100 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2.5 text-xs font-bold min-w-[1.5rem] text-center">{p.quantidade}</span>
                            <button
                              onClick={() => atualizarProduto.mutate({ id: p.id, quantidade: p.quantidade + 1 })}
                              className="px-2.5 py-1 hover:bg-neutral-100 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removerProduto.mutate(p.id)} className="text-neutral-400 hover:text-error transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-neutral-900">{formatCurrency(parseFloat(p.subtotal))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Resumo do pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-100 rounded-[32px] shadow-xl p-6 space-y-6 sticky top-24">
              <h2 className="font-black text-neutral-900 text-xl font-poppins">Resumo</h2>

              {/* Cupom */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Cupom</label>
                {carrinho.cupom_aplicado ? (
                  <div className="flex items-center gap-3 bg-success/10 text-success border border-success/20 rounded-2xl px-4 py-3 text-sm animate-in zoom-in-95">
                    <Tag size={18} className="shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold leading-none">{carrinho.cupom_aplicado.codigo}</p>
                      <p className="text-[10px] mt-0.5">{carrinho.cupom_aplicado.percentual}% de desconto</p>
                    </div>
                    <button onClick={() => removerCupom.mutate()} className="p-1 hover:bg-success/10 rounded-full transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-2xl border border-neutral-100 group focus-within:border-primary/30 focus-within:bg-white transition-all">
                    <input
                      value={cupomInput}
                      onChange={(e) => setCupomInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAplicarCupom()}
                      placeholder="CÓDIGO"
                      className="flex-1 bg-transparent px-3 py-2 text-sm font-bold focus:outline-none placeholder:text-neutral-400 placeholder:font-medium uppercase"
                    />
                    <button
                      onClick={handleAplicarCupom}
                      disabled={aplicarCupom.isPending || !cupomInput.trim()}
                      className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                      {aplicarCupom.isPending ? <Spinner size="sm" /> : 'VALIDAR'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-50">
                <div className="flex justify-between text-neutral-500 text-sm font-medium">
                  <span>Itens</span>
                  <span>{formatCurrency(parseFloat(carrinho.totais.subtotal_itens))}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-sm font-medium">
                  <span>Serviços</span>
                  <span>{formatCurrency(parseFloat(carrinho.totais.subtotal_servicos))}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-sm font-medium">
                  <span>Produtos Adicionais</span>
                  <span>{formatCurrency(parseFloat(carrinho.totais.subtotal_produtos))}</span>
                </div>
                
                {parseFloat(carrinho.totais.desconto) > 0 && (
                  <div className="flex justify-between text-success text-sm font-bold py-2 bg-success/5 px-3 rounded-xl border border-success/10">
                    <span>Desconto Aplicado</span>
                    <span>-{formatCurrency(parseFloat(carrinho.totais.desconto))}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-900 border-t border-neutral-100 pt-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Geral</span>
                    <span className="text-2xl font-black text-primary font-poppins">{formatCurrency(parseFloat(carrinho.totais.total))}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-white font-extrabold py-4 rounded-[20px] transition-all active:scale-95 shadow-xl shadow-primary/20 group"
              >
                IR PARA PAGAMENTO
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                to="/marketplace"
                className="block text-center text-xs font-bold text-neutral-400 hover:text-primary transition-colors tracking-widest"
              >
                ADICIONAR MAIS ITENS
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </PageWrapper>
  )
}
