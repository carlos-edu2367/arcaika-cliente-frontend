import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  MapPin, Star, ShoppingCart, MessageSquare, ChevronLeft, 
  ChevronRight, Clock, ShieldCheck, Info, Sparkles, Check, Building2
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useServico, useProdutosRelacionados, useOrganizacao } from '@/hooks/useMarketplace'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useServicePhotos, useProductServicePhotos } from '@/hooks/useMidia'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Stars } from '@/components/ui/Stars'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAvaliacoesServico } from '@/hooks/useAvaliacoes'
import { cn } from '@/lib/utils'
import { ProdutoRelacionado } from '@/types/marketplace'

import { ReviewItem } from '@/components/shared/ReviewItem'

// ---------------------------------------------------------------------------
// Subcomponentes Locais
// ---------------------------------------------------------------------------

/**
 * Galeria Horizontal com Snap-Scroll (Mobile) e Visualização Elegante
 */
function ServiceGallery({ photos, isLoading }: { photos: string[], isLoading: boolean }) {
  if (isLoading) return <Skeleton className="w-full aspect-video rounded-3xl" />
  
  if (photos.length === 0) {
    return (
      <div className="w-full aspect-video rounded-3xl bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 gap-2 border-2 border-dashed border-neutral-200">
        <Sparkles size={40} strokeWidth={1} />
        <span className="text-sm font-medium">Sem fotos disponíveis</span>
      </div>
    )
  }

  return (
    <div className="relative group">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none">
        {photos.map((photo, i) => (
          <div 
            key={i} 
            className={cn(
              "snap-center shrink-0 w-[85vw] md:w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-neutral-100",
              i === 0 ? "md:col-span-2 md:row-span-2 md:aspect-square lg:aspect-video" : ""
            )}
          >
            <img 
              src={photo} 
              alt={`Foto do serviço ${i + 1}`} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Item de Checklist de Upsell (Compre Junto)
 */
function UpsellChecklistItem({ 
  produto, 
  isSelected, 
  onToggle 
}: { 
  produto: ProdutoRelacionado; 
  isSelected: boolean; 
  onToggle: () => void 
}) {
  const { data: photoData, isLoading: isLoadingPhoto } = useProductServicePhotos(produto.id)
  const fotoUrl = photoData?.fotos?.[0]?.url

  return (
    <div 
      onClick={onToggle}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none",
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-neutral-100 bg-white hover:border-neutral-200"
      )}
    >
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100">
        {isLoadingPhoto ? (
          <Skeleton className="w-full h-full" />
        ) : fotoUrl ? (
          <img src={fotoUrl} alt={produto.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <ShoppingCart size={20} strokeWidth={1.5} />
          </div>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
             <div className="bg-primary text-white rounded-full p-0.5">
               <Check size={10} strokeWidth={4} />
             </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-bold text-neutral-900 text-sm line-clamp-1">{produto.titulo}</h4>
        <p className="text-xs text-neutral-500 line-clamp-1">{produto.descricao}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-black text-primary text-sm">
            {formatCurrency(produto.valor_efetivo || produto.preco)}
          </span>
          {produto.unidade && (
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">/ {produto.unidade}</span>
          )}
        </div>
      </div>

      <div className={cn(
        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0",
        isSelected ? "bg-primary border-primary text-white" : "border-neutral-200"
      )}>
        {isSelected && <Check size={14} strokeWidth={4} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ServicoDetalhe() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { openLoginModal, addToast } = useUIStore()
  const { adicionarServico, adicionarProduto } = useCarrinho()

  // Estado Local para Opcionais (Checklist)
  const [selectedProdutos, setSelectedProdutos] = useState<Set<string>>(new Set())

  const toggleProduto = (prodId: string) => {
    setSelectedProdutos((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(prodId)) next.delete(prodId)
      else next.add(prodId)
      return next
    })
  }

  // Hooks de Dados
  const { data: servico, isLoading: isLoadingServico, isError } = useServico(id)
  const { data: photosData, isLoading: isLoadingPhotos } = useServicePhotos(id)
  const { data: produtosData, isLoading: isLoadingProdutos } = useProdutosRelacionados(id)
  const { data: avaliacoesResponse, isLoading: isLoadingAvaliacoes } = useAvaliacoesServico(id)
  
  // Como o serviço agora devolve organizacao_id
  const organizacaoId = servico?.organizacao_id || servico?.organizacao?.id
  const { data: orgData, isLoading: isLoadingOrg } = useOrganizacao(organizacaoId || '')

  // Cálculo do Total Dinâmico
  const totalInvestimento = useMemo(() => {
    if (!servico) return 0
    const precoBase = Number(servico.preco_promocional || servico.preco)
    const precoOpcionais = (produtosData || [])
      .filter(p => selectedProdutos.has(p.id))
      .reduce((acc, p) => acc + (Number(p.valor_efetivo || p.preco)), 0)
    
    return precoBase + precoOpcionais
  }, [servico, produtosData, selectedProdutos])

  // Parsing defensivo das avaliações
  const avaliacoes = useMemo(() => {
    if (!avaliacoesResponse) return []
    if (Array.isArray(avaliacoesResponse)) return avaliacoesResponse
    return avaliacoesResponse.avaliacoes || []
  }, [avaliacoesResponse])

  const mediaAvaliacoes = avaliacoesResponse && !Array.isArray(avaliacoesResponse) 
    ? avaliacoesResponse.media_nota // Ajustado conforme payload do guia
    : servico?.avaliacao_media || 0

  const totalAvaliacoes = avaliacoesResponse && !Array.isArray(avaliacoesResponse)
    ? avaliacoesResponse.total_avaliacoes // Ajustado conforme payload do guia
    : servico?.total_avaliacoes || 0

  const handleContratar = async () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    if (!servico?.id) return

    try {
      // Enviar serviço e produtos selecionados em uma única chamada
      const produtosIds = Array.from(selectedProdutos)
      
      await adicionarServico.mutateAsync({ 
        id: servico.id, 
        produtosIds 
      })

      navigate('/carrinho')
    } catch (error) {
      console.error('Erro ao contratar:', error)
    }
  }

  const handleSolicitarOrcamento = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    navigate('/orcamentos/novo')
  }

  if (isLoadingServico) {
    return (
      <PageWrapper>
        <Container className="py-12 space-y-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
        </Container>
      </PageWrapper>
    )
  }

  if (isError || !servico) {
    return (
      <PageWrapper>
        <Container className="py-24 text-center">
          <div className="bg-neutral-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
            <Info className="text-neutral-300" size={40} />
          </div>
          <h2 className="text-2xl font-black text-neutral-800 font-poppins">Serviço não encontrado</h2>
          <p className="text-neutral-500 mt-2 mb-8">Pode ter sido removido ou o link está incorreto.</p>
          <button onClick={() => navigate('/marketplace')} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold">
            Voltar ao Marketplace
          </button>
        </Container>
      </PageWrapper>
    )
  }

  const fotos = photosData?.fotos?.map(f => f.url) || []

  return (
    <PageWrapper>
      <Container className="pt-6 pb-32">
        {/* Navegação Voltar */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-primary transition-colors mb-6 font-bold text-sm"
        >
          <ChevronLeft size={18} /> Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* COLUNA PRINCIPAL (Hierarquia 1-7) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 1. Média de Estrelas e 2. Título */}
            <header className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-50 rounded-full px-2.5 py-1 border border-amber-100">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-black text-amber-700">
                    {mediaAvaliacoes > 0 ? mediaAvaliacoes.toFixed(1) : "Novo"}
                  </span>
                </div>
                {totalAvaliacoes > 0 && (
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    {totalAvaliacoes} avaliações
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black text-neutral-900 font-poppins leading-tight">
                {servico.titulo || servico.nome}
              </h1>
              
              <div className="flex items-center gap-2 text-neutral-500 font-medium text-sm">
                <MapPin size={16} className="text-primary" />
                <span>{servico.localidade || "Atendimento Local"}</span>
                <span className="text-neutral-200">|</span>
                <span className="text-primary font-bold">
                  {typeof servico.categoria === 'string' ? servico.categoria : servico.categoria?.valor}
                </span>
              </div>
            </header>

            {/* 3. Fotos do Serviço */}
            <section>
              <ServiceGallery photos={fotos} isLoading={isLoadingPhotos} />
            </section>

            {/* 4. Descrição e Preço */}
            <section className="bg-neutral-50/50 rounded-[32px] p-8 space-y-6 border border-neutral-100">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-neutral-900 font-poppins flex items-center gap-2">
                  Sobre o serviço
                </h3>
                <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed font-medium">
                  {servico.descricao || "Nenhuma descrição fornecida."}
                </div>
              </div>

              {/* Bloco de Preço aqui também para visibilidade */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-neutral-100">
                <div className="space-y-1">
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Investimento</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary font-poppins">
                      {formatCurrency(Number(servico.preco_promocional || servico.preco))}
                      {servico.unidade_medida && (
                        <span className="text-xl text-neutral-400 font-bold uppercase tracking-widest ml-2">
                          / {servico.unidade_medida}
                        </span>
                      )}
                    </span>
                    {servico.em_promocao && (
                      <span className="text-sm text-neutral-400 line-through font-bold">
                        {formatCurrency(Number(servico.preco))}
                        {servico.unidade_medida && `/${servico.unidade_medida}`}
                      </span>
                    )}
                  </div>
                </div>
                
                {servico.em_promocao && (
                  <div className="bg-success-light text-success px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2">
                    <Sparkles size={16} /> Oferta Especial
                  </div>
                )}
              </div>
            </section>

            {/* 5. Produtos Relacionados (Venda Cruzada - Checklist) */}
            {produtosData && produtosData.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-neutral-900 font-poppins">Adicionar opcionais</h3>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{produtosData.length} itens disponíveis</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {produtosData.slice(0, 6).map((prod) => (
                    <UpsellChecklistItem 
                      key={prod.id} 
                      produto={prod} 
                      isSelected={selectedProdutos.has(prod.id)}
                      onToggle={() => toggleProduto(prod.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 6. Sobre o Fornecedor */}
            {(orgData || isLoadingOrg) && (
              <section className="bg-white border border-neutral-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 text-neutral-50/50 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <Building2 size={160} />
                </div>
                {isLoadingOrg ? (
                  <div className="flex items-center gap-4 relative z-10 w-full">
                    <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                    <div className="space-y-2 w-full">
                       <Skeleton className="w-32 h-6" />
                       <Skeleton className="w-48 h-4" />
                    </div>
                  </div>
                ) : orgData ? (
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary-50 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                        <span className="text-2xl md:text-3xl font-black text-primary">
                          {orgData.titulo?.charAt(0) || orgData.nome_fantasia?.charAt(0) || 'A'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-neutral-900 font-poppins mb-1">
                          {orgData.titulo || orgData.nome_fantasia}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <ShieldCheck size={16} /> Verificado
                          </span>
                          <span className="text-neutral-300">|</span>
                          <span>Membro Ativo</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => organizacaoId && navigate(`/marketplace/org/${organizacaoId}`)}
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 w-full md:w-auto justify-center group/btn"
                    >
                      Ver Perfil
                      <ChevronRight size={18} className="text-neutral-400 group-hover/btn:text-neutral-700 group-hover/btn:translate-x-1 transition-all" />
                    </button>
                  </div>
                ) : null}
              </section>
            )}

            {/* 7. Todas as Avaliações */}
            <section id="avaliacoes" className="pt-8 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <h3 className="text-2xl font-black text-neutral-900 font-poppins">O que dizem os clientes</h3>
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-neutral-200" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-neutral-500">+{totalAvaliacoes}</span>
                </div>
              </div>

              {isLoadingAvaliacoes ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
              ) : avaliacoes.length > 0 ? (
                <div className="bg-white rounded-3xl border border-neutral-100 px-8 shadow-sm">
                  {avaliacoes.map((av: any) => (
                    <ReviewItem key={av.id} av={av} />
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-3xl p-12 text-center border-2 border-dashed border-neutral-100">
                  <MessageSquare className="text-neutral-200 mx-auto mb-4" size={48} />
                  <p className="text-neutral-500 font-bold">Inaugure as avaliações deste serviço!</p>
                  <p className="text-neutral-400 text-sm">Seja o primeiro a contratar e contar sua experiência.</p>
                </div>
              )}
            </section>
          </div>

          {/* COLUNA LATERAL (Desktop Sticky) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 bg-white border border-neutral-100 rounded-[32px] p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="space-y-6">
                {(orgData || isLoadingOrg) && (
                  <button 
                    onClick={() => organizacaoId && navigate(`/marketplace/org/${organizacaoId}`)}
                    className="w-full text-left p-4 bg-primary-light/50 hover:bg-primary-light rounded-2xl border border-primary-100 flex items-center gap-4 transition-colors group cursor-pointer"
                  >
                    {isLoadingOrg ? (
                      <div className="flex-1 flex gap-3 items-center">
                        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                        <div className="w-full space-y-1">
                          <Skeleton className="w-24 h-4" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </div>
                    ) : orgData ? (
                      <>
                        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm font-black shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                          {orgData.titulo?.charAt(0) || orgData.nome_fantasia?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-neutral-900 text-sm leading-tight group-hover:text-primary transition-colors truncate">
                            {orgData.titulo || orgData.nome_fantasia}
                          </h4>
                          <p className="text-xs text-primary font-bold mt-0.5">Prestador Verificado</p>
                        </div>
                        <ChevronRight size={18} className="text-neutral-300 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </>
                    ) : null}
                  </button>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 font-medium">Tempo de resposta</span>
                    <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Clock size={14} className="text-success" /> ~24 horas
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 font-medium">Garantia Arcaika</span>
                    <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-primary" /> 100% Seguro
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <button 
                  onClick={handleContratar}
                  disabled={adicionarServico.isPending || adicionarProduto.isPending}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-5 rounded-2xl font-black text-lg transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {adicionarServico.isPending || adicionarProduto.isPending ? (
                    <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <>
                      Contratar por {formatCurrency(totalInvestimento)}
                      {servico.unidade_medida && selectedProdutos.size === 0 && (
                        <span className="text-xs opacity-70 ml-1">/{servico.unidade_medida}</span>
                      )}
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <button 
                  onClick={handleSolicitarOrcamento}
                  className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} /> Solicitar Orçamento
                </button>
              </div>
              
              <p className="text-[10px] text-neutral-400 text-center font-bold uppercase tracking-widest px-4">
                Ambiente seguro criptografado de ponta a ponta
              </p>
            </div>
          </aside>
        </div>

        {/* 6. CTA STICKY (Mobile) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-md border-t border-neutral-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Investimento Total</span>
              <span className="text-2xl font-black text-primary font-poppins">
                {formatCurrency(totalInvestimento)}
                {servico.unidade_medida && selectedProdutos.size === 0 && (
                  <span className="text-xs text-neutral-400 ml-1">/{servico.unidade_medida}</span>
                )}
              </span>
            </div>
            <button 
              onClick={handleContratar}
              disabled={adicionarServico.isPending || adicionarProduto.isPending}
              className="flex-1 bg-primary hover:bg-primary-hover text-white py-4 px-6 rounded-2xl font-black text-base shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {adicionarServico.isPending || adicionarProduto.isPending ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  Contratar
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

      </Container>
    </PageWrapper>
  )
}
