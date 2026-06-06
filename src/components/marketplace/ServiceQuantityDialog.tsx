import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  coerceServiceQuantity,
  getServiceQuantityQuestion,
  getServiceQuantityUnitLabel,
} from '@/lib/serviceQuantity'

interface ServiceQuantityDialogProps {
  isOpen: boolean
  serviceTitle: string
  unit?: string
  initialQuantity?: number
  isPending?: boolean
  onClose: () => void
  onConfirm: (quantity: number) => void
}

export function ServiceQuantityDialog({
  isOpen,
  serviceTitle,
  unit,
  initialQuantity = 1,
  isPending = false,
  onClose,
  onConfirm,
}: ServiceQuantityDialogProps) {
  const [quantity, setQuantity] = useState(String(initialQuantity))
  const unitLabel = getServiceQuantityUnitLabel(unit)
  const numericQuantity = coerceServiceQuantity(quantity)

  useEffect(() => {
    if (isOpen) setQuantity(String(initialQuantity))
  }, [initialQuantity, isOpen])

  const updateQuantity = (next: number) => setQuantity(String(coerceServiceQuantity(next)))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Definir quantidade"
      description={serviceTitle}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="service-quantity-form" isLoading={isPending}>
            Adicionar ao carrinho
          </Button>
        </>
      }
    >
      <form
        id="service-quantity-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(numericQuantity)
        }}
      >
        <p className="text-base font-bold text-neutral-900">
          {getServiceQuantityQuestion(unit)}
        </p>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="service-quantity-input">
            Quantidade
          </label>
          <div className="flex items-center rounded-2xl border border-neutral-200 bg-neutral-50 p-1.5">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => updateQuantity(numericQuantity - 1)}
              className="h-10 w-10 rounded-xl text-neutral-500 hover:bg-white hover:text-neutral-900 transition-colors flex items-center justify-center"
            >
              <Minus size={16} />
            </button>
            <input
              id="service-quantity-input"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              onBlur={() => setQuantity(String(numericQuantity))}
              className="min-w-0 flex-1 bg-transparent text-center text-2xl font-black text-neutral-900 outline-none"
            />
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => updateQuantity(numericQuantity + 1)}
              className="h-10 w-10 rounded-xl text-neutral-500 hover:bg-white hover:text-neutral-900 transition-colors flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="mt-2 text-xs font-medium text-neutral-500">
            A quantidade será enviada ao carrinho em {unitLabel}.
          </p>
        </div>
      </form>
    </Modal>
  )
}
