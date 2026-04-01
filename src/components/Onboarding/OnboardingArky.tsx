import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, CheckCircle2, ChevronRight, X, Bot, ShieldCheck, MessageCircleHeart, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingArkyProps {
  onComplete: () => void
}

export function OnboardingArky({ onComplete }: OnboardingArkyProps) {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Verify if it has been seen before
  useEffect(() => {
    const hasSeen = localStorage.getItem('@arcaika_onboarding_viewed')
    if (hasSeen === 'true') {
      onComplete()
    } else {
      setIsVisible(true)
    }
  }, [onComplete])

  const finish = () => {
    localStorage.setItem('@arcaika_onboarding_viewed', 'true')
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 300) // wait for exit animation
  }

  const handleNext = () => {
    if (step < 4) setStep(prev => prev + 1)
    else finish()
  }

  const copyCoupon = () => {
    navigator.clipboard.writeText('ARKY5')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Variants for parent container to keep the transition smooth
  const modalVariants: any = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  }

  const contentVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.1 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl z-10 flex flex-col min-h-[500px]"
      >
        {/* Header Actions */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={finish} 
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors bg-white/50 backdrop-blur-md rounded-full"
            aria-label="Pular apresentação"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area with AnimatePresence for the steps */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 pt-12 text-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-primary/10 text-primary rounded-[28px] flex items-center justify-center mb-6 shadow-sm"
                >
                  <Bot size={48} strokeWidth={1.5} />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-neutral-900 mb-3 tracking-tight">Oi! Eu sou o Arky 👋</h2>
                <p className="text-neutral-500 text-[15px] leading-relaxed max-w-[280px]">
                  Quer conhecer rapidinho tudo o que você pode fazer na Arcaika?
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center">
                <div className="w-16 h-16 bg-success-light text-success rounded-[20px] flex items-center justify-center mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-3">Tudo em um só lugar</h2>
                <p className="text-neutral-600 text-[15px] leading-relaxed max-w-[300px] mb-4">
                  Aqui você pode contratar serviços, solicitar orçamentos e encontrar soluções com muito mais praticidade.
                </p>
                <div className="bg-neutral-50 border border-neutral-100 px-4 py-3 rounded-2xl">
                  <p className="text-sm font-medium text-neutral-500">
                    Tudo com confiabilidade, transparência e fornecedores verificados.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center">
                <div className="relative mb-6">
                  <motion.div 
                    animate={{ y: [0, -8, 0] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-16 h-16 bg-primary-100 text-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
                  >
                    <MessageCircleHeart size={32} />
                  </motion.div>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-3">Estou sempre por perto</h2>
                <p className="text-neutral-600 text-[15px] leading-relaxed max-w-[280px] mb-4">
                  Se precisar de ajuda em qualquer momento, é só clicar no balão de chat no canto da tela.
                </p>
                <div className="flex items-center gap-3 bg-primary/5 px-4 py-3 rounded-2xl border border-primary/10">
                  <Bot size={20} className="text-primary" />
                  <p className="text-sm font-medium text-primary-800">
                    Estarei por lá pronto para te ajudar!
                  </p>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center w-full">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 bg-warning-light text-warning rounded-full flex items-center justify-center mb-5"
                >
                  <Gift size={40} />
                </motion.div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">🎁 Um presente pra você</h2>
                <p className="text-neutral-500 text-sm mb-6 max-w-[260px]">
                  Para começar com o pé direito, use o cupom e ganhe 5% de desconto na sua primeira contratação.
                </p>

                {/* Coupon Box */}
                <div className="w-full bg-neutral-900 rounded-[20px] p-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-start">
                      <span className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider mb-1">Cupom de Desconto</span>
                      <span className="text-white font-mono text-2xl font-bold tracking-widest">ARKY5</span>
                    </div>
                    <button 
                      onClick={copyCoupon}
                      className={cn(
                        "h-10 px-4 rounded-xl flex items-center gap-2 font-bold text-sm transition-all",
                        copied ? "bg-success text-white" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 pt-0 mt-auto">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  step === i ? "w-6 bg-primary" : "w-1.5 bg-neutral-200"
                )} 
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step < 4 && (
              <button 
                onClick={finish}
                className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 rounded-2xl transition-colors"
              >
                Pular
              </button>
            )}
            <button 
              onClick={handleNext}
              className={cn(
                "py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2",
                step === 4 ? "w-full text-lg" : "flex-[2]"
              )}
            >
              {step === 4 ? 'Começar agora' : 'Próximo'}
              {step < 4 && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
