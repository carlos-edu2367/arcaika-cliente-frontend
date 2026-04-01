import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, ChevronLeft, Package, Plus, Minus, Shield, Zap } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useItem } from '@/hooks/useMarketplace'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { carrinhoService } from '@/services/api/carrinho'
import { useItemPhotos } from '@/hooks/useMidia'

export default function ItemDetalhe() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { openLoginModal, addToast } = useUIStore()
  const qc = useQueryClient()
  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [quantidade, setQuantidade] = useState(1)

  const { data: item, isLoading: isLoadingItem, isError } = useItem(id)
  const { data: photosData, isLoading: isLoadingPhotos } = useItemPhotos(id)

  const isLoading = isLoadingItem || isLoadingPhotos

  const adicionarItem = useMutation({
    mutationFn: () => carrinhoService.adicionarItem(id, quantidade),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carrinho'] })
      addToast({ type: 'success', title: `${quantidade}x ${item?.nome} adicionado ao carrinho!` })
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao adicionar ao carrinho.' }),
  })

  const handleAdicionar = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    adicionarItem.mutate()
  }

  const handleComprarAgora = () => {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    adicionarItem.mutate(undefined, {
      onSuccess: () => navigate('/carrinho'),
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        </Container>
      </PageWrapper>
    )
  }

  if (isError || !item) {
    return (
      <PageWrapper>
        <Container>
          <div className="text-center py-20">
            <p className="text-neutral-500">Item não encontrado.</p>
            <Link to="/marketplace" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">
              Voltar ao marketplace
            </Link>
          </div>
        </Container>
      </PageWrapper>
    )
  }

  const fotos = (photosData?.fotos?.length ?? 0) > 0 ? photosData!.fotos.map(f => f.url) : [null]

  return (
    <PageWrapper>
      {/* UX-14: pb-28 no mobile para que o conteúdo não fique sob a barra CTA fixa */}
      <Container className="pb-28 lg:pb-6">
        {/* Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria */}
            <div className="space-y-2">
              <div className="aspect-square md:aspect-video rounded-2xl bg-neutral-100 overflow-hidden">
                {fotos[selectedPhoto] ? (
                  <img
                    src={fotos[selectedPhoto]!}
                    alt={item.nome}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-300">
                    <Package size={64} />
                    <span className="text-sm">Sem foto</span>
                  </div>
                )}
              </div>
              {fotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {fotos.map((foto, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(i)}
                      className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhoto === i ? 'border-primary' : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {foto ? (
                        <img src={foto} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                          <Package size={20} className="text-neutral-300" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="space-y-4">
              <div className="flex items-start gap-2 flex-wrap">
                <Badge variant="primary">{item.categoria.valor}</Badge>
                {!item.disponivel && <Badge variant="error">Indisponível</Badge>}
              </div>

              <h1 className="text-2xl font-bold text-neutral-900 font-poppins">{item.nome}</h1>

              <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed">
                <p>{item.descricao}</p>
              </div>
            </div>

            {/* Garantias */}
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
              <h2 className="text-sm font-semibold text-neutral-600 mb-3">Compre com segurança</h2>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Shield size={15} className="text-success shrink-0" />
                <span>Pagamento seguro e criptografado</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Zap size={15} className="text-primary shrink-0" />
                <span>Entrega rápida e rastreável</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Package size={15} className="text-info shrink-0" />
                <span>Produto verificado pelo prestador</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white border border-neutral-100 rounded-2xl shadow-md p-5 space-y-4">
              {/* Preço */}
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wide">Preço</p>
                <p className="text-3xl font-bold text-primary font-poppins">{formatCurrency(item.preco)}</p>
                <p className="text-xs text-neutral-400 mt-0.5">por unidade</p>
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-2">Quantidade</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    disabled={quantidade <= 1}
                    className="h-9 w-9 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-base font-bold text-neutral-900 min-w-[2rem] text-center">{quantidade}</span>
                  <button
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="h-9 w-9 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Total */}
              {quantidade > 1 && (
                <div className="flex justify-between items-center text-sm border-t border-neutral-100 pt-3">
                  <span className="text-neutral-500">Total ({quantidade}x)</span>
                  <span className="font-bold text-neutral-900">{formatCurrency(item.preco * quantidade)}</span>
                </div>
              )}

              {/* CTAs */}
              <button
                onClick={handleComprarAgora}
                disabled={!item.disponivel || adicionarItem.isPending}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {adicionarItem.isPending ? <Spinner size="sm" color="white" /> : null}
                {item.disponivel ? 'Comprar agora' : 'Indisponível'}
              </button>

              <button
                onClick={handleAdicionar}
                disabled={!item.disponivel || adicionarItem.isPending}
                className="w-full flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 text-neutral-700 font-semibold py-3 rounded-xl transition-colors"
              >
                <ShoppingCart size={17} />
                Adicionar ao carrinho
              </button>
            </div>
          </div>
        </div>

        {/* CTA mobile fixo */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-neutral-100 p-3 flex gap-2 z-30">
          <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3">
            <button
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              disabled={quantidade <= 1}
              className="p-1 disabled:opacity-40"
            >
              <Minus size={13} />
            </button>
            <span className="text-sm font-bold min-w-[1.5rem] text-center">{quantidade}</span>
            <button onClick={() => setQuantidade((q) => q + 1)} className="p-1">
              <Plus size={13} />
            </button>
          </div>
          <button
            onClick={handleAdicionar}
            disabled={!item.disponivel || adicionarItem.isPending}
            className="flex-1 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1"
          >
            <ShoppingCart size={15} />
            Carrinho
          </button>
          <button
            onClick={handleComprarAgora}
            disabled={!item.disponivel || adicionarItem.isPending}
            className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1"
          >
            {adicionarItem.isPending ? <Spinner size="sm" color="white" /> : null}
            Comprar
          </button>
        </div>
      </Container>
    </PageWrapper>
  )
}
