import React, { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { StarRating } from '@/components/ui/StarRating'
import { useCriarAvaliacao } from '@/hooks/useAvaliacoes'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { ShoppingBag, AlertCircle, CheckCircle2, Store, User, UserX } from 'lucide-react'
import type { Pedido, PedidoLinha } from '@/types/domain'
import { cn } from '@/lib/utils'

interface AvaliacaoPedidoModalProps {
  isOpen: boolean
  onClose: () => void
  pedido: Pedido
}

type TargetType = 'servico' | 'organizacao'

interface SelectedTarget {
  id: string // referencia_id ou organizacao_id
  tipo: TargetType
  titulo: string
}

export function AvaliacaoPedidoModal({ isOpen, onClose, pedido }: AvaliacaoPedidoModalProps) {
  const { mutateAsync: criarAvaliacao } = useCriarAvaliacao()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Lista de alvos possíveis
  const targets = useMemo(() => {
    const list: SelectedTarget[] = []
    
    // Serviços do pedido
    pedido.linhas?.forEach(linha => {
      list.push({
        id: linha.referencia_id,
        tipo: 'servico',
        titulo: linha.titulo
      })
    })

    // Organização (Loja)
    if (pedido.organizacao_id) {
       list.push({
          id: pedido.organizacao_id,
          tipo: 'organizacao',
          titulo: 'A Loja / Organização'
       })
    }

    return list
  }, [pedido])

  const avaliacoesFeitas = pedido.avaliacoes_feitas || []

  // Estado do formulário
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(
    targets.find(t => !avaliacoesFeitas.includes(t.id)) || targets[0] || null
  )
  const [nota, setNota] = useState(5)
  const [titulo, setTitulo] = useState('')
  const [comentario, setComentario] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTarget) return

    setIsSubmitting(true)

    try {
      // 1. Enviar avaliação para o alvo selecionado (ex: o Serviço)
      await criarAvaliacao({
        pedido_id: pedido.id,
        alvo_id: selectedTarget.id,
        tipo: selectedTarget.tipo,
        nota,
        titulo: selectedTarget.tipo === 'servico' ? titulo : undefined,
        comentario,
        nome_cliente: !isAnonymous ? user?.nome : undefined
      })

      // 2. Se for um serviço, enviar TAMBÉM para a organização (usando organizacao_id do pedido)
      if (selectedTarget.tipo === 'servico' && pedido.organizacao_id) {
        try {
          await criarAvaliacao({
            pedido_id: pedido.id,
            alvo_id: pedido.organizacao_id,
            tipo: 'organizacao',
            nota,
            comentario,
            nome_cliente: !isAnonymous ? user?.nome : undefined
          })
        } catch (orgErr) {
          // Suprimido conforme o requisito: "Caso somente uma dê erro, não precisa mostrar erro ao usuario"
          console.warn('Erro silencioso ao avaliar organização:', orgErr)
        }
      }

      // Sucesso - reset e fechar modal após delay
      setSuccess(true)
      setTimeout(() => {
        if (isOpen) {
          onClose()
          setSuccess(false)
          setNota(5)
          setTitulo('')
          setComentario('')
          setIsAnonymous(false)
          setIsSubmitting(false)
        }
      }, 2000)

    } catch (err) {
      console.error('Falha na avaliação primária:', err)
      
      // Se a primeira falhou, ainda tentamos a da organização como última tentativa solitária
      if (selectedTarget.tipo === 'servico' && pedido.organizacao_id) {
        try {
          await criarAvaliacao({
            pedido_id: pedido.id,
            alvo_id: pedido.organizacao_id,
            tipo: 'organizacao',
            nota,
            comentario,
            nome_cliente: !isAnonymous ? user?.nome : undefined
          })
          
          // Se o fallback funcionou, mostramos sucesso
          setSuccess(true)
          setTimeout(() => {
            if (isOpen) {
              onClose()
              setSuccess(false)
              setNota(5)
              setTitulo('')
              setComentario('')
              setIsAnonymous(false)
              setIsSubmitting(false)
            }
          }, 2000)
          return
        } catch (orgErr) {
          console.error('Falha em ambas as tentativas:', orgErr)
        }
      }

      // Se chegamos aqui, nada funcionou
      setIsSubmitting(false)
      addToast({ type: 'error', title: 'Erro ao enviar avaliação. Tente novamente.' })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Avaliar Experiência"
      description={`Pedido #${pedido.codigo || pedido.id.slice(0, 8).toUpperCase()}`}
    >
      {success ? (
        <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
           <div className="h-20 w-20 bg-success-light rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-success" />
           </div>
           <h3 className="text-xl font-bold text-neutral-900">Avaliação enviada!</h3>
           <p className="text-neutral-500 mt-2">Obrigado por nos ajudar a melhorar.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Escolha do alvo */}
          <div className="space-y-3">
            <label className="text-sm font-black text-neutral-700 uppercase tracking-widest">O que você deseja avaliar?</label>
            <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {targets.map((target) => {
                const isAvaliado = avaliacoesFeitas.includes(target.id)
                return (
                  <button
                    key={`${target.tipo}-${target.id}`}
                    type="button"
                    disabled={isAvaliado}
                    onClick={() => setSelectedTarget(target)}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-all",
                      selectedTarget?.id === target.id 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-neutral-100 hover:border-neutral-200 bg-white",
                      isAvaliado && "opacity-50 grayscale cursor-not-allowed bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                        target.tipo === 'organizacao' ? "bg-amber-100" : "bg-primary-light"
                      )}>
                        {target.tipo === 'organizacao' 
                          ? <Store size={16} className="text-amber-600" />
                          : <ShoppingBag size={16} className="text-primary" />
                        }
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">
                          {target.tipo === 'organizacao' ? 'Fornecedor' : 'Serviço'}
                        </span>
                        <p className="text-xs font-bold text-neutral-800 line-clamp-1 leading-tight">{target.titulo}</p>
                      </div>
                    </div>
                    {isAvaliado && (
                      <span className="text-[10px] font-black text-success uppercase bg-success-light px-2 py-0.5 rounded-lg">
                        Avaliado
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nota */}
          <div className="flex flex-col items-center gap-3 py-4 bg-neutral-50 rounded-3xl border border-neutral-100 shadow-inner">
             <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Sua nota</span>
             <StarRating value={nota} onChange={setNota} size="lg" />
             <span className="text-sm font-black text-amber-600 uppercase tracking-widest">
                {nota === 5 ? 'Excelente' : nota === 4 ? 'Muito Bom' : nota === 3 ? 'Bom' : nota === 2 ? 'Regular' : 'Ruim'}
             </span>
          </div>

          <div className="space-y-4">
            {selectedTarget?.tipo === 'servico' && (
              <Input
                label="Título da avaliação"
                placeholder="Ex: Excelente atendimento, entrega rápida..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            )}

            <Textarea
              label="Seu comentário"
              placeholder={selectedTarget?.tipo === 'organizacao' ? "Como foi sua experiência com a empresa?" : "Conte mais detalhes sobre o serviço..."}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              required
            />

            {/* Checkbox de Avaliação Anônima */}
            <div 
               className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none",
                  isAnonymous ? "bg-neutral-50 border-neutral-200" : "bg-primary/5 border-primary/10 shadow-sm"
               )}
               onClick={() => setIsAnonymous(!isAnonymous)}
            >
               <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors shadow-inner",
                  isAnonymous ? "bg-white text-neutral-400" : "bg-primary text-white"
               )}>
                  {isAnonymous ? <UserX size={20} /> : <User size={20} />}
               </div>
               <div className="flex-1">
                  <p className="text-sm font-bold text-neutral-800">
                     {isAnonymous ? "Avaliação Anônima" : `Avaliar como ${user?.nome?.split(' ')[0]}`}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                     {isAnonymous ? "Seu nome não será exibido na página pública." : "Ajude a passar mais confiança com seu nome."}
                  </p>
               </div>
               <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  isAnonymous ? "border-neutral-300 bg-white" : "border-primary bg-primary"
               )}>
                  {isAnonymous && <div className="w-2.5 h-2.5 bg-neutral-300 rounded-sm" />}
                  {!isAnonymous && (
                     <CheckCircle2 size={14} className="text-white" />
                  )}
               </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
             <Button 
                variant="outline" 
                className="flex-1 rounded-2xl" 
                onClick={onClose} 
                type="button"
                disabled={isSubmitting}
             >
                Cancelar
             </Button>
             <Button 
                variant="primary" 
                className="flex-[2] rounded-2xl shadow-lg shadow-primary/20" 
                type="submit"
                isLoading={isSubmitting}
             >
                Enviar Avaliação
             </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
