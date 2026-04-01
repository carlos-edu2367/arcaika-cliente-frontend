import React, { useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Info, MessageSquare, Star, Sparkles, Building2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReviewItem } from '@/components/shared/ReviewItem'
import { 
  useOrganizacao, 
  useInfiniteServicosPorOrg 
} from '@/hooks/useMarketplace'
import { useAvaliacoesOrganizacao } from '@/hooks/useAvaliacoes'
import { formatDate } from '@/lib/utils'

export default function OrganizacaoMarketplacePage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Data Fetching
  const { data: org, isLoading: isLoadingOrg, isError: isErrorOrg } = useOrganizacao(id)
  
  const { 
    data: servicosData, 
    isLoading: isLoadingServicos, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteServicosPorOrg(id)
  
  const { data: avaliacoesResponse, isLoading: isLoadingAvaliacoes } = useAvaliacoesOrganizacao(id)

  // Infinite Scroll Observer
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isFetchingNextPage) return
    
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage()
      }
    }, { rootMargin: '100px' })
    
    if (lastElementRef.current) {
      observerRef.current.observe(lastElementRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, servicosData])

  // Processamento de dados
  const servicos = useMemo(() => {
    return servicosData?.pages.flatMap(page => page.servicos) || []
  }, [servicosData])

  const avaliacoes = avaliacoesResponse?.avaliacoes || []
  const mediaAvaliacoes = avaliacoesResponse?.media_nota || 0
  const totalAvaliacoes = avaliacoesResponse?.total_avaliacoes || 0

  if (isLoadingOrg) {
    return (
      <PageWrapper>
        <Container className="py-12 space-y-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[300px] w-full rounded-3xl" />)}
          </div>
        </Container>
      </PageWrapper>
    )
  }

  if (isErrorOrg || !org) {
    return (
      <PageWrapper>
        <Container className="py-24 text-center">
          <div className="bg-neutral-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
            <Info className="text-neutral-300" size={40} />
          </div>
          <h2 className="text-2xl font-black text-neutral-800 font-poppins">Organização não encontrada</h2>
          <p className="text-neutral-500 mt-2 mb-8">Pode ter sido removida ou o link está incorreto.</p>
          <button onClick={() => navigate('/marketplace')} className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-2xl font-bold transition-colors">
            Voltar ao Marketplace
          </button>
        </Container>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Container className="pt-6 pb-32">
        {/* Nav Voltar */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-primary transition-colors mb-6 font-bold text-sm w-fit"
        >
          <ChevronLeft size={18} /> Voltar
        </button>

        {/* HEADER DA ORGANIZAÇÃO */}
        <div className="bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-neutral-50/50 pointer-events-none">
            <Building2 size={200} />
          </div>
          
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-primary-50 flex items-center justify-center border-4 border-white shadow-md shrink-0 z-10">
            <span className="text-4xl md:text-5xl font-black text-primary">
              {org.titulo.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="z-10 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-neutral-900 font-poppins">{org.titulo}</h1>
              {org.ativa && (
                <div className="bg-success-light text-success px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} /> Ativo
                </div>
              )}
            </div>
            
            <p className="text-neutral-500 font-medium mb-4 text-sm md:text-base">
              {org.nome_fantasia && org.nome_fantasia !== org.titulo && (
                <span className="mr-2">Conhecido como: {org.nome_fantasia} | </span>
              )}
              Membro desde {org.criado_em ? new Date(org.criado_em).getFullYear() : new Date().getFullYear()}
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-4 py-2 border border-amber-100">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                <span className="font-black text-amber-700 text-lg">
                  {mediaAvaliacoes > 0 ? mediaAvaliacoes.toFixed(1) : "Novo"}
                </span>
                {totalAvaliacoes > 0 && (
                  <>
                    <span className="text-amber-200">|</span>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                      {totalAvaliacoes} avaliações
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* COLUNA PRINCIPAL - SERVIÇOS */}
          <div className="lg:col-span-8 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-neutral-900 font-poppins">Serviços Oferecidos</h2>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  {servicosData?.pages[0]?.total || 0} encontrados
                </span>
              </div>

              {isLoadingServicos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[280px] w-full rounded-2xl" />)}
                </div>
              ) : servicos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {servicos.map((servico, index) => (
                    <div 
                      key={servico.id} 
                      ref={index === servicos.length - 1 ? lastElementRef : null}
                    >
                      <MarketplaceCard 
                        item={servico} 
                        tipo="servico" 
                      />
                    </div>
                  ))}
                  {isFetchingNextPage && (
                    [...Array(3)].map((_, i) => <Skeleton key={`skeleton-${i}`} className="h-[280px] w-full rounded-2xl" />)
                  )}
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-[32px] p-12 text-center border-2 border-dashed border-neutral-100">
                  <Building2 className="text-neutral-200 mx-auto mb-4" size={48} />
                  <p className="text-neutral-500 font-bold">Nenhum serviço publicado ainda.</p>
                </div>
              )}
            </section>
          </div>

          {/* COLUNA LATERAL - AVALIAÇÕES */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white border border-neutral-100 rounded-[32px] shadow-sm overflow-hidden sticky top-28">
              <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex flex-col gap-1">
                <h3 className="text-lg font-black text-neutral-900 font-poppins flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  Avaliações Recentes
                </h3>
                <p className="text-xs text-neutral-500 font-medium">O que dizem sobre {org.titulo}</p>
              </div>

              <div className="p-6">
                {isLoadingAvaliacoes ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : avaliacoes.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {avaliacoes.map((av: any) => (
                      <div key={av.id} className="py-4 first:pt-0 last:pb-0">
                         {/* Utilizando o mesmo componente ReviewItem porém minimizado se necessário, ou ele na íntegra */}
                         <ReviewItem av={av} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="text-neutral-200 mx-auto mb-3" size={32} />
                    <p className="text-sm font-bold text-neutral-400">Nenhuma avaliação ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

      </Container>
    </PageWrapper>
  )
}
