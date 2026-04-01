import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X, MapPin, ChevronLeft, ChevronRight, Wrench, Package } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard'
import { useCategorias, useMarketplaceItens, useMarketplaceServicos } from '@/hooks/useMarketplace'
import { useBatchPhotos } from '@/hooks/useMidia'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocationStore } from '@/stores/locationStore'
import { cn } from '@/lib/utils'
import type { MarketplaceParams } from '@/types/api'
import type { MarketplaceCategoria } from '@/types/marketplace'

// ---------------------------------------------------------------------------
// Utilitários de Formatação
// ---------------------------------------------------------------------------

const normalizeTitle = (str?: string) => {
  if (!str) return '';
  const lowers = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'com', 'por', 'para'];
  return str.split(' ').map((word, index) => {
    if (index !== 0 && lowers.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

// ---------------------------------------------------------------------------
// Componentes Secundários
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse shadow-sm">
      <div className="aspect-[4/3] bg-neutral-100/80" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-neutral-100 rounded-full w-1/3" />
        <div className="h-5 bg-neutral-100 rounded-full w-3/4" />
        <div className="h-3 bg-neutral-100 rounded-full w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-neutral-100 rounded-full w-1/4" />
          <div className="h-8 bg-neutral-100 rounded-xl w-1/4" />
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, icon: Icon, count }: { title: string, icon: any, count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 pb-2">
      <div className="p-2 bg-primary-light text-primary rounded-xl">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <h2 className="text-xl font-bold text-neutral-800 font-poppins">{title}</h2>
      {count !== undefined && (
        <span className="bg-neutral-100 text-neutral-500 text-xs font-semibold px-2.5 py-1 rounded-full ml-2">
          {count}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { localidade, openPicker } = useLocationStore()

  // Estados dos Filtros
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const debouncedQ = useDebounce(q, 400)
  const tab = (searchParams.get('tab') as 'servicos' | 'itens') || 'servicos'
  const page = Number(searchParams.get('page')) || 1
  const selectedCatNome = searchParams.get('categoria') ?? undefined

  const params: MarketplaceParams = {
    q: debouncedQ || undefined,
    categoria: selectedCatNome,
    cidade: localidade?.cidade || undefined,
    estado: localidade?.estado || undefined,
    page: page,
    limit: 12,
  }

  // Hooks de Dados
  const { data: categoriasData } = useCategorias()
  const { data: servicosData, isLoading: loadingServicos } = useMarketplaceServicos(params, { enabled: tab === 'servicos' })
  const { data: itensData, isLoading: loadingItens } = useMarketplaceItens(params, { enabled: tab === 'itens' })

  const isLoading = tab === 'servicos' ? loadingServicos : loadingItens
  const responseData = tab === 'servicos' ? servicosData : itensData
  const items = responseData?.itens || []
  const totalItems = responseData?.total || 0
  const totalPages = Math.ceil(totalItems / (responseData?.por_pagina || 12))

  // Coleta referências para assinatura em lote
  const batchRefs = useMemo(() => {
    return items.map(item => ({ 
      tipo: (tab === 'servicos' ? 'servico' : 'item') as 'servico' | 'item', 
      id: item.id 
    }))
  }, [items, tab])

  const { data: signedPhotos, isLoading: loadingBatch } = useBatchPhotos(batchRefs)

  const getSignedUrl = (id: string) => {
    return signedPhotos?.[id]?.[0]?.url
  }

  // Sincroniza busca com a URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (debouncedQ) next.set('q', debouncedQ)
    else next.delete('q')
    next.set('page', '1') // Reseta página ao buscar
    setSearchParams(next, { replace: true })
  }, [debouncedQ])

  const setTab = (newTab: 'servicos' | 'itens') => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', newTab)
    next.set('page', '1')
    setSearchParams(next)
  }

  const setCategoria = (nome: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (nome) next.set('categoria', nome)
    else next.delete('categoria')
    next.set('page', '1')
    setSearchParams(next)
  }

  const setPage = (newPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', newPage.toString())
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const categoriasNormalizadas = useMemo(() => {
    if (!categoriasData) return []
    return (categoriasData as MarketplaceCategoria[]).map(c => ({
      ...c,
      nomeNormalizado: normalizeTitle(c.nome)
    }))
  }, [categoriasData])

  const isEmpty = !isLoading && items.length === 0

  return (
    <PageWrapper>
      <Container className="py-8 space-y-8">

        {/* --- Cabeçalho & Localidade --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-neutral-900 font-poppins tracking-tight">
              Marketplace Arcaika
            </h1>
            <p className="text-neutral-500 font-medium">
              Tudo o que você precisa para sua obra em um só lugar.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={openPicker}
              className={cn(
                'flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl border-2 transition-all active:scale-95 shadow-sm',
                localidade
                  ? 'border-primary-100 text-primary-700 bg-primary-50 hover:bg-primary-100'
                  : 'border-neutral-100 text-neutral-600 hover:border-primary-200 hover:text-primary-600 bg-white',
              )}
            >
              <MapPin size={18} className={localidade ? "text-primary" : "text-neutral-400"} />
              {localidade ? `${localidade.cidade}, ${localidade.estado}` : 'Selecionar Localização'}
            </button>
          </div>
        </header>

        {/* --- Tabs & Busca --- */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex p-1.5 bg-neutral-100 rounded-2xl w-full lg:w-auto self-start">
            <button
              onClick={() => setTab('servicos')}
              className={cn(
                'flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                tab === 'servicos' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Wrench size={18} /> Serviços
            </button>
            <button
              onClick={() => setTab('itens')}
              className={cn(
                'flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                tab === 'itens' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Package size={18} /> Itens
            </button>
          </div>

          <div className="relative flex-1 group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-colors" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Buscar em ${tab === 'servicos' ? 'serviços' : 'itens'}...`}
              className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-transparent bg-white shadow-sm ring-1 ring-neutral-200 text-base focus:outline-none focus:ring-primary focus:border-transparent transition-all font-medium"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* --- Chips de Categoria --- */}
        {categoriasNormalizadas.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setCategoria(null)}
              className={cn(
                'shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 border-2',
                !selectedCatNome
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white border-neutral-100 text-neutral-600 hover:border-neutral-200 hover:bg-neutral-50',
              )}
            >
              Todos
            </button>
            {categoriasNormalizadas.map((cat) => (
              <button
                key={cat.nome}
                onClick={() => setCategoria(cat.nome === selectedCatNome ? null : cat.nome)}
                className={cn(
                  'shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 border-2',
                  cat.nome === selectedCatNome
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white border-neutral-100 text-neutral-600 hover:border-neutral-200 hover:bg-neutral-50',
                )}
              >
                {cat.nomeNormalizado}
              </button>
            ))}
          </div>
        )}

        {/* --- Área de Resultados --- */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border-2 border-dashed border-neutral-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="h-24 w-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                <Search className="text-neutral-300" size={40} />
              </div>
              <h3 className="text-2xl font-black text-neutral-800 font-poppins">Nenhum resultado</h3>
              <p className="text-neutral-500 mt-2 max-w-sm text-center font-medium">
                Tente ajustar seus filtros ou mudar para a aba de {tab === 'servicos' ? 'itens' : 'serviços'}.
              </p>
              <button
                onClick={() => { setQ(''); setCategoria(null) }}
                className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item: any, idx: number) => (
                  <div 
                    key={item.id} 
                    className="animate-in fade-in slide-in-from-bottom-6 duration-700" 
                    style={{ animationDelay: `${(idx % 12) * 50}ms`, animationFillMode: 'both' }}
                  >
                    <MarketplaceCard 
                      item={item} 
                      tipo={tab === 'servicos' ? 'servico' : 'item'} 
                      imageUrl={getSignedUrl(item.id)}
                      isImageLoading={loadingBatch}
                    />
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-neutral-100">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1
                      // Logica simples de exibição (opcional: elipses se houver muitas páginas)
                      if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) return null
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            'w-10 h-10 rounded-xl text-sm font-bold transition-all',
                            p === page 
                              ? 'bg-primary text-white shadow-md' 
                              : 'text-neutral-500 hover:bg-neutral-100'
                          )}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </PageWrapper>
  )
}