import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X, SlidersHorizontal, ArrowLeft, MapPin } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { ServiceCard } from '@/components/marketplace/ServiceCard'
import { useCategorias, useMarketplaceServicos } from '@/hooks/useMarketplace'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocationStore } from '@/stores/locationStore'
import { cn } from '@/lib/utils'
import type { MarketplaceParams } from '@/types/api'

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-neutral-100" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-neutral-100 rounded w-3/4" />
        <div className="h-3 bg-neutral-100 rounded w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 bg-neutral-100 rounded w-1/4" />
          <div className="h-4 bg-neutral-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ordenação
// ---------------------------------------------------------------------------

type Sort = 'relevancia' | 'preco_asc' | 'preco_desc' | 'avaliacao'

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'avaliacao', label: 'Melhor avaliados' },
  { value: 'preco_asc', label: 'Menor preço' },
  { value: 'preco_desc', label: 'Maior preço' },
]

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

export default function Busca() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const [q, setQ] = useState(initialQ)
  const [sort, setSort] = useState<Sort>('relevancia')
  const [showFilters, setShowFilters] = useState(false)
  const debouncedQ = useDebounce(q, 350)
  const { localidade, openPicker } = useLocationStore()

  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (debouncedQ) next.set('q', debouncedQ)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCat = searchParams.get('categoria_id') ?? undefined

  const params: MarketplaceParams = {
    q: debouncedQ || undefined,
    categoria: selectedCat,
    localidade: localidade?.cidade ?? undefined,
    page: 1,
    page_size: 24,
    sort: sort === 'relevancia' ? undefined : sort,
  }

  const { data, isLoading } = useMarketplaceServicos(params)
  const { data: categorias } = useCategorias()

  const setCategoria = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('categoria_id', id)
    else next.delete('categoria_id')
    setSearchParams(next)
  }

  const results = data?.itens ?? []

  const isEmpty = !isLoading && results.length === 0

  return (
    <PageWrapper>
      <Container>
        {/* Breadcrumb */}
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Marketplace
        </Link>

        {/* Input */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              localidade
                ? `Buscar em ${localidade.cidade}...`
                : 'Buscar serviços, categorias...'
            }
            autoFocus
            className="w-full pl-9 pr-10 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow bg-white"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Chips de categoria */}
        {categorias && categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setCategoria(null)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                !selectedCat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300',
              )}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.valor}
                onClick={() => setCategoria(selectedCat === cat.valor ? null : cat.valor)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  selectedCat === cat.valor
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300',
                )}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        )}

        {/* Barra de resultados */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <p className="text-sm text-neutral-500 truncate">
            {isLoading ? (
              'Buscando...'
            ) : (
              <>
                <span className="font-semibold text-neutral-800">{results.length}</span>{' '}
                resultado{results.length !== 1 ? 's' : ''}
                {debouncedQ && (
                  <> para <span className="font-semibold text-neutral-800">"{debouncedQ}"</span></>
                )}
                {localidade && (
                  <> em <span className="font-medium text-neutral-700">{localidade.cidade}</span></>
                )}
              </>
            )}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {/* Chip de localidade */}
            <button
              onClick={openPicker}
              className={cn(
                'hidden sm:flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
                localidade
                  ? 'border-primary-200 text-primary-700 bg-primary-light hover:bg-primary-100'
                  : 'border-neutral-200 text-neutral-500 hover:border-primary-300',
              )}
            >
              <MapPin size={11} />
              {localidade ? localidade.cidade : 'Todas as cidades'}
            </button>

            {/* Ordenação */}
            <div className="relative">
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
                  showFilters
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300',
                )}
              >
                <SlidersHorizontal size={12} />
                {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Ordenar'}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setShowFilters(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-xs font-medium transition-colors',
                        sort === opt.value
                          ? 'text-primary bg-primary-light'
                          : 'text-neutral-700 hover:bg-neutral-50',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : isEmpty ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="text-lg font-semibold text-neutral-700">Nenhum resultado encontrado</p>
            {localidade ? (
              <>
                <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                  Sem resultados em <strong>{localidade.cidade}</strong>.
                  Tente outros termos ou amplie para todo o Brasil.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                  {(debouncedQ || selectedCat) && (
                    <button
                      onClick={() => { setQ(''); setCategoria(null) }}
                      className="text-sm text-primary-600 font-medium border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-light transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                  <button
                    onClick={openPicker}
                    className="text-sm text-neutral-600 border border-neutral-200 px-4 py-2 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    Mudar cidade
                  </button>
                </div>
              </>
            ) : (
              (debouncedQ || selectedCat) && (
                <button
                  onClick={() => { setQ(''); setCategoria(null) }}
                  className="mt-2 text-sm text-primary font-medium hover:underline"
                >
                  Limpar busca
                </button>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((servico) => (
              <ServiceCard key={servico.id} servico={servico as any} />
            ))}
          </div>
        )}
      </Container>
    </PageWrapper>
  )
}
