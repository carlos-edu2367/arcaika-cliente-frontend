import { useReducer, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Eye, EyeOff, MapPin, Search, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { clientesService } from '@/services/api/clientes'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import axios from 'axios'
import { OnboardingArky } from '@/components/Onboarding/OnboardingArky'

// ---------------------------------------------------------------------------
// Componentes de Apoio
// ---------------------------------------------------------------------------

function ForcaSenha({ senha }: { senha: string }) {
  const [score, setScore] = useState(0)

  useEffect(() => {
    let s = 0
    if (senha.length >= 8) s += 1
    if (/[A-Z]/.test(senha)) s += 1
    if (/[0-9]/.test(senha)) s += 1
    if (/[^A-Za-z0-9]/.test(senha)) s += 1
    setScore(s)
  }, [senha])

  const labels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Excelente']
  const colors = ['bg-neutral-200', 'bg-error', 'bg-warning', 'bg-primary-400', 'bg-success']

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={cn(
              "flex-1 rounded-full transition-all duration-500", 
              i <= score ? colors[score] : "bg-neutral-100"
            )} 
          />
        ))}
      </div>
      <p className={cn("text-[10px] font-bold uppercase", score > 0 ? "opacity-100" : "opacity-0")}>
        Senha: {labels[score]}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Schemas de Validação
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  sobrenome: z.string().min(2, 'Sobrenome muito curto'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarSenha: z.string(),
}).refine((d) => d.senha === d.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
})

const step2Schema = z.object({
  cpf: z.string().min(14, 'CPF incompleto'),
  telefone: z.string().min(14, 'Telefone incompleto'),
})

const step3Schema = z.object({
  cep: z.string().min(9, 'CEP incompleto'),
  rua: z.string().min(3, 'Rua inválida'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro inválido'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Sigla (ex: GO)'),
  ponto_de_referencia: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

// ---------------------------------------------------------------------------
// Steps Components
// ---------------------------------------------------------------------------

function Step1({ onNext }: { onNext: (d: Step1Data) => void }) {
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step1Data>({ 
    resolver: zodResolver(step1Schema) 
  })
  const senha = watch('senha', '')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-neutral-500 uppercase">Nome</label>
          <input {...register('nome')} placeholder="João" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          {errors.nome && <p className="text-[10px] text-error mt-1 font-medium">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-neutral-500 uppercase">Sobrenome</label>
          <input {...register('sobrenome')} placeholder="Silva" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          {errors.sobrenome && <p className="text-[10px] text-error mt-1 font-medium">{errors.sobrenome.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-neutral-500 uppercase">Seu Melhor E-mail</label>
        <input type="email" {...register('email')} placeholder="exemplo@email.com" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
        {errors.email && <p className="text-[10px] text-error mt-1 font-medium">{errors.email.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <label className="text-xs font-bold text-neutral-500 uppercase">Senha</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} {...register('senha')} placeholder="••••••••" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 mt-0.5">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <ForcaSenha senha={senha} />
          {errors.senha && <p className="text-[10px] text-error mt-1 font-medium">{errors.senha.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-neutral-500 uppercase">Confirmar</label>
          <input type="password" {...register('confirmarSenha')} placeholder="••••••••" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          {errors.confirmarSenha && <p className="text-[10px] text-error mt-1 font-medium">{errors.confirmarSenha.message}</p>}
        </div>
      </div>
      <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-14 rounded-2xl shadow-xl shadow-primary/20 mt-4 transition-all flex items-center justify-center gap-2">
        Avançar <ArrowRight size={18} />
      </button>
    </form>
  )
}

function Step2({ onNext, onBack }: { onNext: (d: Step2Data) => void; onBack: () => void }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Step2Data>({ 
    resolver: zodResolver(step2Schema) 
  })

  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
  const maskTel = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-neutral-500 uppercase">CPF</label>
          <input {...register('cpf')} onChange={(e) => setValue('cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          {errors.cpf && <p className="text-[10px] text-error mt-1 font-medium">{errors.cpf.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-neutral-500 uppercase">Celular / WhatsApp</label>
          <input {...register('telefone')} onChange={(e) => setValue('telefone', maskTel(e.target.value))} placeholder="(00) 00000-0000" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          {errors.telefone && <p className="text-[10px] text-error mt-1 font-medium">{errors.telefone.message}</p>}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 border border-neutral-200 text-neutral-600 font-bold h-14 rounded-2xl hover:bg-neutral-50 transition-colors">Voltar</button>
        <button type="submit" className="flex-[2] bg-primary hover:bg-primary-hover text-white font-bold h-14 rounded-2xl shadow-xl shadow-primary/20 transition-all">Continuar</button>
      </div>
    </form>
  )
}

function Step3({ onSubmit, onBack, isSubmitting }: { onSubmit: (d: Step3Data) => void; onBack: () => void; isSubmitting: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step3Data>({ 
    resolver: zodResolver(step3Schema) 
  })
  const [loadingCEP, setLoadingCEP] = useState(false)
  const cepInput = watch('cep')

  // Reconhecimento automático do CEP
  useEffect(() => {
    const cleanCEP = cepInput?.replace(/\D/g, '')
    if (cleanCEP?.length === 8) {
      buscarCEP(cleanCEP)
    }
  }, [cepInput])

  const buscarCEP = async (codigo?: string) => {
    const cleanCEP = (codigo || cepInput)?.replace(/\D/g, '')
    if (cleanCEP?.length !== 8) return
    
    setLoadingCEP(true)
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      if (!data.erro) {
        setValue('rua', data.logradouro)
        setValue('bairro', data.bairro)
        setValue('cidade', data.localidade)
        setValue('estado', data.uf)
      }
    } finally {
      setLoadingCEP(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-right-4">
      <div className="relative">
        <label className="text-xs font-bold text-neutral-500 uppercase">CEP</label>
        <div className="relative">
          <input {...register('cep')} onChange={(e) => setValue('cep', e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2'))} placeholder="00000-000" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {loadingCEP ? <Spinner size="sm" /> : <Search size={16} className="text-neutral-300" />}
          </div>
        </div>
        {errors.cep && <p className="text-[10px] text-error mt-1 font-medium">{errors.cep.message}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2">
        <label className="text-xs font-bold text-neutral-500 uppercase">Rua</label>
        <input {...register('rua')} placeholder="Rua ou Avenida" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
        {errors.rua && <p className="text-[10px] text-error mt-1 font-medium">{errors.rua.message}</p>}
      </div>
      <div>
        <label className="text-xs font-bold text-neutral-500 uppercase">Estado</label>
        <input {...register('estado')} maxLength={2} placeholder="GO" className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
        {errors.estado && <p className="text-[10px] text-error mt-1 font-medium">{errors.estado.message}</p>}
      </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-neutral-500 uppercase">Cidade</label>
          <input {...register('cidade')} className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          {errors.cidade && <p className="text-[10px] text-error mt-1 font-medium">{errors.cidade.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-neutral-500 uppercase">Bairro</label>
          <input {...register('bairro')} className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
          {errors.bairro && <p className="text-[10px] text-error mt-1 font-medium">{errors.bairro.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-neutral-500 uppercase">Ponto de referência (opcional)</label>
        <input {...register('ponto_de_referencia')} className="w-full mt-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400" />
      </div>
      <div className="flex gap-3 pt-6">
        <button type="button" disabled={isSubmitting} onClick={onBack} className="flex-1 border border-neutral-200 text-neutral-600 font-bold h-14 rounded-2xl hover:bg-neutral-50 disabled:opacity-50">Voltar</button>
        <button type="submit" disabled={isSubmitting} className="flex-[2] bg-primary hover:bg-primary-hover text-white font-bold h-14 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all">
          {isSubmitting ? <Spinner size="sm" color="white" /> : <ShieldCheck size={20} />}
          {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Reducer e Lógica Principal
// ---------------------------------------------------------------------------

interface CadastroState {
  step: 1 | 2 | 3 | 'sucesso'
  step1: Step1Data | null
  step2: Step2Data | null
}

type CadastroAction =
  | { type: 'NEXT_STEP1'; payload: Step1Data }
  | { type: 'NEXT_STEP2'; payload: Step2Data }
  | { type: 'FINISH' }
  | { type: 'BACK'; to: 1 | 2 }

function cadastroReducer(state: CadastroState, action: CadastroAction): CadastroState {
  switch (action.type) {
    case 'NEXT_STEP1': return { ...state, step: 2, step1: action.payload }
    case 'NEXT_STEP2': return { ...state, step: 3, step2: action.payload }
    case 'FINISH': return { ...state, step: 'sucesso' }
    case 'BACK': return { ...state, step: action.to }
    default: return state
  }
}

export default function Cadastro() {
  const navigate = useNavigate()
  const { register: registerAuth } = useAuth()
  const addToast = useUIStore(s => s.addToast)
  const [state, dispatch] = useReducer(cadastroReducer, { step: 1, step1: null, step2: null })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStep3 = async (data: Step3Data) => {
    if (!state.step1 || !state.step2) return
    setIsSubmitting(true)

    try {
      // 1. Registro
      const payload = {
        nome: state.step1.nome,
        sobrenome: state.step1.sobrenome,
        email: state.step1.email,
        senha: state.step1.senha,
        cpf: state.step2.cpf.replace(/\D/g, ''),
        telefone: state.step2.telefone.replace(/\D/g, '')
      }

      await registerAuth(payload)
      
      // 2. Criação automática de endereço após login
      // Obs: Se o auto-login falhou, essa call falhará com 401 silenciosamente, 
      // mas o fluxo de cadastro seguirá com sucesso (UX otimizada)
      try {
        await clientesService.criarEndereco({ ...data, ativo: true })
      } catch (err) {
        console.warn('Falha silenciosa ao salvar endereço inicial. Token ausente ou expirado:', err)
      }

      dispatch({ type: 'FINISH' })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      
      // UX: Tratamento de exceções formatadas do FastAPI (ex: erro Pydantic Array ou string normal)
      let message = 'Verifique os dados e tente novamente.'
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
        message = detail[0].msg
      }

      addToast({ 
        type: 'error', 
        title: 'Falha no cadastro', 
        message 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSucesso = state.step === 'sucesso'

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto space-y-8">
        
        {!isSucesso && (
          <div className="flex justify-between items-center mb-8 px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center flex-1 relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all z-10",
                  state.step === s ? "bg-primary text-white shadow-lg scale-110" : 
                  (typeof state.step === 'number' && state.step > s) ? "bg-success text-white" : "bg-white border-2 border-neutral-200 text-neutral-400"
                )}>
                  {(typeof state.step === 'number' && state.step > s) ? <CheckCircle2 size={20} /> : s}
                </div>
                {s < 3 && <div className={cn("absolute h-[2px] w-full top-5 left-1/2 -z-0", (typeof state.step === 'number' && state.step > s) ? "bg-success" : "bg-neutral-200")} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-neutral-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-neutral-900 font-poppins tracking-tight">
              {isSucesso ? 'Tudo pronto!' : state.step === 1 ? 'Crie sua conta' : state.step === 2 ? 'Dados pessoais' : 'Endereço de atendimento'}
            </h1>
            {!isSucesso && <p className="text-sm text-neutral-500 mt-2 font-medium">Falta pouco para você começar.</p>}
          </div>

          {state.step === 1 && <Step1 onNext={(d) => dispatch({ type: 'NEXT_STEP1', payload: d })} />}
          {state.step === 2 && <Step2 onNext={(d) => dispatch({ type: 'NEXT_STEP2', payload: d })} onBack={() => dispatch({ type: 'BACK', to: 1 })} />}
          {state.step === 3 && <Step3 onSubmit={handleStep3} onBack={() => dispatch({ type: 'BACK', to: 2 })} isSubmitting={isSubmitting} />}

          {isSucesso && (
            <>
              <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                  <div className="h-24 w-24 bg-success-light rounded-full flex items-center justify-center text-success shadow-inner">
                    <CheckCircle2 size={56} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-neutral-900">Seja bem-vindo(a)!</p>
                  <p className="text-sm text-neutral-500 leading-relaxed px-4">Sua conta foi criada e configurada com sucesso.</p>
                </div>
              </div>
              <OnboardingArky onComplete={() => navigate('/')} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}