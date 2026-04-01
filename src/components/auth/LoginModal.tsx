import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginModal() {
  const isOpen = useUIStore((s) => s.isLoginModalOpen)
  const closeLoginModal = useUIStore((s) => s.closeLoginModal)
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [loginError, setLoginError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  })

  useEffect(() => {
    if (!isOpen) {
      reset()
      setLoginError(null)
    }
  }, [isOpen, reset])

  if (!isOpen) return null

  const onSubmit = async (data: FormData) => {
    setLoginError(null)
    try {
      await login(data)
      closeLoginModal()
    } catch (err: any) {
      if (err.response?.status === 401) {
        setLoginError('E-mail ou senha incorretos. Verifique seus dados.')
      } else {
        const detail = err?.response?.data?.detail
        const userMsg = err.userMessage
        setLoginError(userMsg || (typeof detail === 'string' ? detail : 'Ocorreu um erro ao entrar. Tente novamente.'))
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
        <button onClick={closeLoginModal} className="absolute right-4 top-4 p-2 text-neutral-400 hover:bg-neutral-100 rounded-full">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 font-poppins">Acesse sua conta</h2>
          <p className="text-sm text-neutral-500 mt-1">Para continuar com seu pedido</p>
        </div>

        {loginError && (
          <div className="mb-4 bg-error-light text-error px-4 py-3 rounded-xl text-xs font-semibold border border-error/10 animate-in fade-in slide-in-from-top-2">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">E-mail</label>
            <input
              type="email"
              {...register('email')}
              className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-400 outline-none transition-all"
              placeholder="seu@email.com"
            />
            {errors.email && <p className="text-[10px] text-error mt-1 ml-1 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-neutral-700">Senha</label>
              <button type="button" onClick={() => { closeLoginModal(); navigate('/auth/recuperar-senha') }} className="text-xs text-primary-600 font-semibold hover:underline">
                Esqueci minha senha
              </button>
            </div>
            <input
              type="password"
              {...register('senha')}
              className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-400 outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.senha && <p className="text-[10px] text-error mt-1 ml-1 font-medium">{errors.senha.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
          >
            {isSubmitting ? <Spinner size="sm" color="white" /> : 'Entrar na Plataforma'}
          </button>
          
          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-sm text-neutral-500 font-medium">
              Ainda não tem conta?{' '}
              <Link 
                to="/auth/cadastro" 
                onClick={closeLoginModal}
                style={{ color: '#006fee' }} 
                className="font-bold hover:underline"
              >
                Criar conta grátis
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}