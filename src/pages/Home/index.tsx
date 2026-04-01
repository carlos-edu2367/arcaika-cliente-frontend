import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Star, Shield, MapPin, ArrowRight, TrendingUp, ClipboardList, Clock, Sparkles } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard'
import { useCategorias, useRecomendacoes, useMaisVendidos } from '@/hooks/useMarketplace'
import { useBatchPhotos } from '@/hooks/useMidia'
import { useLocationStore } from '@/stores/locationStore'
import { cn } from '@/lib/utils'
import WizardOrcamento from '@/components/marketplace/WizardOrcamento'
import type { MarketplaceCategoria, RecomendacoesResponse } from '@/types/marketplace'

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
// Main Home Component
// ---------------------------------------------------------------------------

export default function Home() {
  const navigate = useNavigate()
  const { localidade, openPicker } = useLocationStore()
  
  // Estado local para o Wizard Modal (Sprint 4)
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // APIs do Marketplace
  const { data: categorias } = useCategorias()
  const { data: recData } = useRecomendacoes()
  const { data: maisVendidos } = useMaisVendidos(6)

  const recomendacoes = (recData as RecomendacoesResponse)?.servicos?.slice(0, 6) || []

  // Coleta referências para assinatura em lote
  const batchRefs = useMemo(() => {
    const refs: { tipo: 'item' | 'servico', id: string }[] = []
    recomendacoes.forEach(s => refs.push({ tipo: 'servico' as const, id: s.id }))
    maisVendidos?.forEach(s => refs.push({ tipo: 'servico' as const, id: s.id }))
    return refs
  }, [recomendacoes, maisVendidos])

  const { data: signedPhotos, isLoading: loadingBatch } = useBatchPhotos(batchRefs)

  const getSignedUrl = (id: string) => {
    return signedPhotos?.[id]?.[0]?.url
  }

  // Filtra 6 categorias principais
  const catPrincipais = useMemo(() => {
    if (!categorias) return []
    return (categorias as MarketplaceCategoria[]).slice(0, 6)
  }, [categorias])

  return (
    <PageWrapper>
      {/* --- HERO SECTION --- */}
      <section className="relative bg-neutral-900 pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-warning/10 blur-[100px] rounded-full mix-blend-screen" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-neutral-800/50 border border-neutral-700 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm cursor-pointer hover:bg-neutral-800 transition-colors" onClick={openPicker}>
              <MapPin size={14} className="text-primary-400" />
              <span className="text-sm font-semibold text-neutral-300">
                {localidade ? localidade.label : 'Em todo o Brasil'}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white font-poppins tracking-tight leading-tight mb-6">
              Serviços <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-300">profissionais</span><br />
              para sua casa ou empresa
            </h1>
            
            <p className="text-lg text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Encontre especialistas em pintura, elétrica, hidráulica, limpeza e muito mais. Orçamentos rápidos e pagamento seguro.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const q = new FormData(e.currentTarget).get('q')
                if (q) navigate(`/marketplace?q=${encodeURIComponent(q as string)}`)
              }}
              className="relative max-w-2xl mx-auto flex items-center bg-white rounded-2xl p-2 shadow-2xl"
            >
              <div className="pl-4 text-neutral-400"><Search size={20} /></div>
              <input 
                name="q"
                type="text" 
                placeholder="O que você precisa hoje? (Ex: Pintor, Diarista...)"
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-neutral-900 font-medium placeholder:text-neutral-400 outline-none"
              />
              <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                Buscar
              </button>
            </form>
          </div>
        </Container>
      </section>

      {/* --- NOVA SEÇÃO WIZARD: SPRINT 4 --- */}
      <section className="py-12 -mt-10 relative z-20">
        <Container>
          <div className="bg-gradient-to-br from-primary to-primary-600 rounded-[32px] p-8 sm:p-12 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative z-10 max-w-xl text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                <Star size={12} className="fill-warning text-warning" /> Novo
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 font-poppins tracking-tight">
                Orçamentos Personalizados
              </h2>
              <p className="text-primary-100 text-lg mb-8 leading-relaxed max-w-md">
                Descreva exatamente o que precisa e receba cotações sob medida de especialistas da sua região. Sem compromisso.
              </p>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="bg-white text-primary hover:bg-neutral-50 font-extrabold text-lg px-8 py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto hover:scale-105 active:scale-95"
              >
                <ClipboardList size={22} strokeWidth={2.5} />
                Solicitar Meu Orçamento
              </button>
            </div>
            
            {/* Decoração Visual */}
            <div className="relative z-10 hidden md:flex items-center justify-center w-64 h-64">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <ClipboardList size={160} className="text-white/90 drop-shadow-2xl" strokeWidth={1} />
            </div>
            
            {/* Shapes de Fundo */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </Container>
      </section>

      {/* --- CATEGORIAS --- */}
      <section className="py-10 bg-neutral-50">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-neutral-900 font-poppins tracking-tight">Categorias</h2>
            <Link to="/marketplace" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {catPrincipais.map((cat) => (
              <Link 
                key={cat.nome} 
                to={`/marketplace?categoria=${encodeURIComponent(cat.nome)}`}
                className="bg-white border border-neutral-100 rounded-2xl p-5 text-center hover:border-primary/30 hover:shadow-lg transition-all group flex flex-col items-center justify-center gap-3 aspect-square"
              >
                <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="text-xl font-bold">{cat.nome.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-semibold text-neutral-700 text-sm group-hover:text-primary transition-colors line-clamp-2">
                  {normalizeTitle(cat.nome)}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* --- RECOMENDAÇÕES --- */}
      {recomendacoes.length > 0 && (
        <section className="py-16 bg-white">
          <Container>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-light text-primary rounded-lg"><Sparkles size={20} /></div>
                <h2 className="text-2xl font-extrabold text-neutral-900 font-poppins tracking-tight">Recomendados para Você</h2>
              </div>
              <Link to="/marketplace" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                Ver mais <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recomendacoes.map((servico) => (
                <MarketplaceCard 
                  key={servico.id} 
                  item={servico} 
                  tipo="servico" 
                  imageUrl={getSignedUrl(servico.id)}
                  isImageLoading={loadingBatch}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* --- MAIS VENDIDOS --- */}
      <section className="py-16 bg-neutral-50">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success-light text-success rounded-lg"><TrendingUp size={20} /></div>
              <h2 className="text-2xl font-extrabold text-neutral-900 font-poppins tracking-tight">Mais Vendidos</h2>
            </div>
            <Link to="/marketplace" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Ver mais <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maisVendidos?.map((servico) => (
              <MarketplaceCard 
                key={servico.id} 
                item={servico} 
                tipo="servico" 
                imageUrl={getSignedUrl(servico.id)}
                isImageLoading={loadingBatch}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* --- TRUST BAR --- */}
      <section className="py-12 bg-neutral-900 text-neutral-300 border-t border-neutral-800">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left divide-y md:divide-y-0 md:divide-x divide-neutral-800">
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 md:pt-0 sm:justify-center">
              <div className="p-3 bg-neutral-800 rounded-2xl text-success"><Shield size={28} /></div>
              <div>
                <h4 className="font-bold text-white text-lg">Pagamentos 100% Seguros</h4>
                <p className="text-sm text-neutral-500 mt-1">Garantia total de devolução.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 md:pt-0 sm:justify-center">
              <div className="p-3 bg-neutral-800 rounded-2xl text-warning"><Star size={28} /></div>
              <div>
                <h4 className="font-bold text-white text-lg">Profissionais Avaliados</h4>
                <p className="text-sm text-neutral-500 mt-1">Qualidade testada por clientes.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 md:pt-0 sm:justify-center">
              <div className="p-3 bg-neutral-800 rounded-2xl text-primary-400"><Clock size={28} /></div>
              <div>
                <h4 className="font-bold text-white text-lg">Atendimento Rápido</h4>
                <p className="text-sm text-neutral-500 mt-1">Respostas e serviços ágeis.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Módulo Interativo do Wizard */}
      <WizardOrcamento isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </PageWrapper>
  )
}