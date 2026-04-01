import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
  
  const [loginError, setLoginError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoginError(null)
    try {
      await login(data)
      navigate(from, { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (detail) {
        if (Array.isArray(detail)) {
          setLoginError(detail[0]?.msg || 'Erro de validação dos dados.')
        } else {
          setLoginError(typeof detail === 'string' ? detail : 'E-mail ou senha incorretos.')
        }
      } else if (err.message === 'Dados de usuário ausentes na resposta da API.') {
        setLoginError('Erro ao processar dados do usuário. Contate o suporte.')
      } else {
        setLoginError('Não foi possível conectar ao servidor. Tente novamente.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-neutral-100 p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 font-poppins">Bem-vindo(a) de volta</h1>
          <p className="text-sm text-neutral-500 mt-2">Faça login para gerenciar seus orçamentos e pedidos</p>
        </div>

        {loginError && (
          <div className="mb-6 bg-error-light border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">E-mail</label>
            <input
              type="email"
              {...register('email')}
              placeholder="seu@email.com"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {errors.email && <p className="text-xs text-error mt-1.5 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-neutral-700">Senha</label>
              <Link to="/auth/recuperar-senha" style={{ color: '#006fee' }} className="text-xs font-semibold hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <input
              type="password"
              {...register('senha')}
              placeholder="••••••••"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {errors.senha && <p className="text-xs text-error mt-1.5 font-medium">{errors.senha.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Spinner size="sm" color="white" /> : null}
            {isSubmitting ? 'Entrando...' : 'Entrar na conta'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <p className="text-sm text-neutral-500 font-medium">
            Ainda não tem conta?{' '}
            <Link to="/auth/cadastro" style={{ color: '#006fee' }} className="font-bold hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}