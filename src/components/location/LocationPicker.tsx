import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X, Locate, Globe, ChevronRight } from 'lucide-react'
import { useLocationStore, type Localidade } from '@/stores/locationStore'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Cidades populares pré-carregadas (top cidades por presença em marketplaces)
// ---------------------------------------------------------------------------

interface CidadeOpcao {
  cidade: string
  estado: string
  uf: string
}

const CIDADES_POPULARES: CidadeOpcao[] = [
  { cidade: 'Goiânia', estado: 'Goiás', uf: 'GO' },
  { cidade: 'Aparecida de Goiânia', estado: 'Goiás', uf: 'GO' },
  { cidade: 'Anápolis', estado: 'Goiás', uf: 'GO' },
  { cidade: 'São Paulo', estado: 'São Paulo', uf: 'SP' },
  { cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro', uf: 'RJ' },
  { cidade: 'Belo Horizonte', estado: 'Minas Gerais', uf: 'MG' },
  { cidade: 'Brasília', estado: 'Distrito Federal', uf: 'DF' },
  { cidade: 'Salvador', estado: 'Bahia', uf: 'BA' },
  { cidade: 'Fortaleza', estado: 'Ceará', uf: 'CE' },
  { cidade: 'Curitiba', estado: 'Paraná', uf: 'PR' },
  { cidade: 'Manaus', estado: 'Amazonas', uf: 'AM' },
  { cidade: 'Recife', estado: 'Pernambuco', uf: 'PE' },
  { cidade: 'Porto Alegre', estado: 'Rio Grande do Sul', uf: 'RS' },
  { cidade: 'Belém', estado: 'Pará', uf: 'PA' },
  { cidade: 'Campinas', estado: 'São Paulo', uf: 'SP' },
  { cidade: 'Guarulhos', estado: 'São Paulo', uf: 'SP' },
  { cidade: 'Maceió', estado: 'Alagoas', uf: 'AL' },
  { cidade: 'Natal', estado: 'Rio Grande do Norte', uf: 'RN' },
  { cidade: 'Teresina', estado: 'Piauí', uf: 'PI' },
  { cidade: 'Campo Grande', estado: 'Mato Grosso do Sul', uf: 'MS' },
  { cidade: 'João Pessoa', estado: 'Paraíba', uf: 'PB' },
  { cidade: 'Aracaju', estado: 'Sergipe', uf: 'SE' },
  { cidade: 'Cuiabá', estado: 'Mato Grosso', uf: 'MT' },
  { cidade: 'Macapá', estado: 'Amapá', uf: 'AP' },
  { cidade: 'Porto Velho', estado: 'Rondônia', uf: 'RO' },
  { cidade: 'Rio Branco', estado: 'Acre', uf: 'AC' },
  { cidade: 'Palmas', estado: 'Tocantins', uf: 'TO' },
  { cidade: 'São Luís', estado: 'Maranhão', uf: 'MA' },
  { cidade: 'Florianópolis', estado: 'Santa Catarina', uf: 'SC' },
  { cidade: 'Vitória', estado: 'Espírito Santo', uf: 'ES' },
  { cidade: 'Boa Vista', estado: 'Roraima', uf: 'RR' },
]

function buildLabel(cidade: string, uf: string) {
  return `${cidade} e Região, ${uf}`
}

function buildLocalidade(c: CidadeOpcao): Localidade {
  return {
    cidade: c.cidade,
    estado: c.uf,
    label: buildLabel(c.cidade, c.uf),
  }
}

// ---------------------------------------------------------------------------
// Geolocalização via Nominatim (OpenStreetMap, gratuito, sem API key)
// ---------------------------------------------------------------------------

async function reverseGeocode(lat: number, lon: number): Promise<CidadeOpcao | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR`,
      { headers: { 'User-Agent': 'Arcaika/1.0' } },
    )
    const data = await res.json()
    const addr = data.address
    const cidade =
      addr.city ?? addr.town ?? addr.municipality ?? addr.county ?? null
    const estado = addr.state ?? null
    const uf = addr['ISO3166-2-lvl4']?.split('-')[1] ?? ''

    if (!cidade) return null
    return { cidade, estado: estado ?? '', uf }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface LocationPickerProps {
  /** Se true, exibe como modal de primeira visita (não pode fechar sem escolher) */
  firstVisit?: boolean
}

export function LocationPicker({ firstVisit = false }: LocationPickerProps) {
  const { isPickerOpen, closePicker, setLocalidade, clearLocalidade, hasChosen } =
    useLocationStore()

  const [query, setQuery] = useState('')
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  // Abrir automaticamente na primeira visita
  const shouldShow = isPickerOpen || (!hasChosen && firstVisit)

  useEffect(() => {
    if (shouldShow) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [shouldShow])

  // Fechar com ESC (só se não for firstVisit obrigatório)
  useEffect(() => {
    if (!shouldShow) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !firstVisit) closePicker()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shouldShow, firstVisit, closePicker])

  // Travar scroll
  useEffect(() => {
    if (shouldShow) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [shouldShow])

  if (!shouldShow) return null

  // Filtrar lista
  const filtered = query.trim()
    ? CIDADES_POPULARES.filter(
        (c) =>
          c.cidade.toLowerCase().includes(query.toLowerCase()) ||
          c.estado.toLowerCase().includes(query.toLowerCase()) ||
          c.uf.toLowerCase().includes(query.toLowerCase()),
      )
    : CIDADES_POPULARES

  const handleSelect = (c: CidadeOpcao) => {
    setLocalidade(buildLocalidade(c))
    setQuery('')
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const result = await reverseGeocode(coords.latitude, coords.longitude)
        if (result) {
          setLocalidade(buildLocalidade(result))
          setQuery('')
          setGeoStatus('idle')
        } else {
          setGeoStatus('error')
        }
      },
      () => setGeoStatus('error'),
      { timeout: 8000 },
    )
  }

  const handleTodas = () => {
    clearLocalidade()
    setQuery('')
  }

  const canClose = !firstVisit || hasChosen

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Selecionar localidade"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={canClose ? closePicker : undefined}
      />

      {/* Card */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[85vh] sm:max-h-[600px]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-neutral-100 shrink-0">
          <div className="h-9 w-9 rounded-full bg-primary-light flex items-center justify-center">
            <MapPin size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-neutral-900">Qual é a sua cidade?</h2>
            <p className="text-xs text-neutral-500">
              {firstVisit
                ? 'Vemos serviços disponíveis na sua região.'
                : 'Altere sua localidade de busca.'}
            </p>
          </div>
          {canClose && (
            <button
              onClick={closePicker}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Busca */}
        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cidade..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Ações rápidas */}
        {!query && (
          <div className="px-4 pb-2 flex gap-2 shrink-0">
            {/* Usar minha localização */}
            <button
              onClick={handleGeolocate}
              disabled={geoStatus === 'loading'}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors',
                geoStatus === 'error'
                  ? 'border-error text-error bg-error-light'
                  : 'border-primary-200 text-primary bg-primary-light hover:bg-primary-100',
              )}
            >
              <Locate size={13} className={geoStatus === 'loading' ? 'animate-spin' : ''} />
              {geoStatus === 'loading'
                ? 'Localizando...'
                : geoStatus === 'error'
                ? 'Localização indisponível'
                : 'Usar minha localização'}
            </button>

            {/* Todas as regiões */}
            <button
              onClick={handleTodas}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <Globe size={13} />
              Todo o Brasil
            </button>
          </div>
        )}

        {/* Divisor */}
        {!query && (
          <p className="px-5 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest shrink-0">
            Cidades populares
          </p>
        )}

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-2 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-neutral-400">
              <p className="text-sm">Nenhuma cidade encontrada para "{query}"</p>
              <p className="text-xs mt-1">Verifique o nome ou escolha da lista.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={`${c.cidade}-${c.uf}`}
                onClick={() => handleSelect(c)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-full bg-neutral-100 group-hover:bg-primary-light flex items-center justify-center shrink-0 transition-colors">
                  <MapPin size={14} className="text-neutral-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{c.cidade}</p>
                  <p className="text-xs text-neutral-400 truncate">{c.estado} · {c.uf}</p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-neutral-300 group-hover:text-primary transition-colors shrink-0"
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
