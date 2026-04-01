import { useReducer, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Eye, EyeOff, Mail, ChevronLeft } from 'lucide-react'
import { api } from '@/lib/axios'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
})

const resetSchema = z
  .object({
    senha: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Precisa de ao menos 1 maiúscula')
      .regex(/[0-9]/, 'Precisa de ao menos 1 número'),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

type EmailData = z.infer<typeof emailSchema>
type ResetData = z.infer<typeof resetSchema>

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type Screen = 'email' | 'enviado' | 'reset' | 'sucesso'

// ---------------------------------------------------------------------------
// Tela 1 — Digitar email
// ---------------------------------------------------------------------------

function TelaEmail({
  onSent,
}: {
  onSent: (email: string) => void
}) {
  const addToast = useUIStore((s) => s.addToast)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailData>({ resolver: zodResolver(emailSchema) })

  const onSubmit = async ({ email }: EmailData) => {
    try {
      await api.post('/auth/recuperar-senha', { email })
    } catch (_) {
      // Não revelar se o e-mail existe ou não — sucesso silencioso
    }
    onSent(email)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="h-14 w-14 rounded-full bg-primary-light flex items-center justify-center">
          <Mail size={28} className="text-primary" />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Recuperar senha</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            placeholder="seu@email.com"
            autoFocus
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow"
          />
          {errors.email && (
            <p className="text-xs text-error mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 2 — E-mail enviado
// ---------------------------------------------------------------------------

function TelaEnviado({ email, onRetry }: { email: string; onRetry: () => void }) {
  return (
    <div className="text-center space-y-5">
      <div className="flex justify-center">
        <CheckCircle2 size={56} className="text-success" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Verifique seu e-mail</h2>
        <p className="text-sm text-neutral-500 mt-2">
          Enviamos um link para{' '}
          <span className="font-medium text-neutral-700">{email}</span>.
          Verifique também a pasta de spam.
        </p>
      </div>
      <p className="text-xs text-neutral-400">
        O link expira em 30 minutos.
      </p>
      <button
        onClick={onRetry}
        className="text-sm text-primary-600 hover:underline font-medium"
      >
        Reenviar e-mail
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 3 — Nova senha (via token na URL)
// ---------------------------------------------------------------------------

function TelaResetSenha({ token, onDone }: { token: string; onDone: () => void }) {
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetData>({ resolver: zodResolver(resetSchema) })

  const senha = watch('senha', '')
  const strength = [
    senha.length >= 8,
    /[A-Z]/.test(senha),
    /[0-9]/.test(senha),
    /[^a-zA-Z0-9]/.test(senha),
  ]
  const score = strength.filter(Boolean).length

  const onSubmit = async ({ senha }: ResetData) => {
    try {
      await api.post('/auth/redefinir-senha', { token, senha })
      onDone()
    } catch (_) {
      addToast({ type: 'error', title: 'Link inválido ou expirado. Solicite um novo.' })
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Nova senha</h1>
        <p className="text-sm text-neutral-500 mt-1">Crie uma senha forte para sua conta.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Nova senha</label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              {...register('senha')}
              placeholder="••••••••"
              autoFocus
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <button
              type="button"
              onClick={() => setShowSenha((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {senha && (
            <div className="mt-2 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < score
                      ? score <= 1 ? 'bg-error' : score === 2 ? 'bg-warning' : score === 3 ? 'bg-primary-400' : 'bg-success'
                      : 'bg-neutral-200',
                  )}
                />
              ))}
            </div>
          )}
          {errors.senha && <p className="text-xs text-error mt-1">{errors.senha.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Confirmar senha</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              {...register('confirmarSenha')}
              placeholder="••••••••"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmarSenha && <p className="text-xs text-error mt-1">{errors.confirmarSenha.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 4 — Sucesso do reset
// ---------------------------------------------------------------------------

function TelaSucesso() {
  return (
    <div className="text-center space-y-5">
      <div className="flex justify-center">
        <CheckCircle2 size={56} className="text-success" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Senha redefinida!</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Sua senha foi atualizada com sucesso. Você já pode entrar na sua conta.
        </p>
      </div>
      <Link
        to="/auth/login"
        className="block w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-colors text-center text-sm"
      >
        Ir para o login
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function RecuperarSenha() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  const [screen, setScreen] = useState<Screen>(tokenFromUrl ? 'reset' : 'email')
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 space-y-6">
        {screen === 'email' && (
          <TelaEmail
            onSent={(e) => {
              setEmail(e)
              setScreen('enviado')
            }}
          />
        )}

        {screen === 'enviado' && (
          <TelaEnviado email={email} onRetry={() => setScreen('email')} />
        )}

        {screen === 'reset' && tokenFromUrl && (
          <TelaResetSenha token={tokenFromUrl} onDone={() => setScreen('sucesso')} />
        )}

        {screen === 'sucesso' && <TelaSucesso />}

        {/* Back to login */}
        {screen !== 'sucesso' && (
          <div className="text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <ChevronLeft size={14} />
              Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
