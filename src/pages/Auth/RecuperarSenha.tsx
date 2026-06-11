import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Eye, EyeOff, KeyRound, Mail, ChevronLeft } from 'lucide-react'
import { api } from '@/lib/axios'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Fluxo de recuperação de senha do cliente.
//
// Contrato do backend (auth.py):
//   POST /auth/recuperar-senha { email, tipo_usuario: 'cliente' }
//     → envia um código de 6 dígitos por e-mail (válido por 15 minutos)
//   POST /auth/redefinir-senha { email, tipo_usuario: 'cliente', codigo, nova_senha }
//     → redefine a senha
//
// O e-mail de boas-vindas do cliente cadastrado pela imobiliária faz deep-link
// para esta página com ?email=..., levando direto à etapa de código.
// ---------------------------------------------------------------------------

const TIPO_USUARIO = 'cliente'

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
})

const resetSchema = z
  .object({
    codigo: z.string().regex(/^\d{6}$/, 'Informe o código de 6 dígitos'),
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

type Screen = 'email' | 'reset' | 'sucesso'

async function solicitarCodigo(email: string) {
  // Sucesso silencioso — o backend nunca revela se o e-mail existe.
  await api.post('/auth/recuperar-senha', { email, tipo_usuario: TIPO_USUARIO })
}

// ---------------------------------------------------------------------------
// Tela 1 — Digitar email e solicitar o código
// ---------------------------------------------------------------------------

function TelaEmail({
  emailInicial,
  onSent,
}: {
  emailInicial: string
  onSent: (email: string) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: emailInicial },
  })

  const onSubmit = async ({ email }: EmailData) => {
    try {
      await solicitarCodigo(email)
    } catch (_) {
      // Sucesso silencioso — não revelar se o e-mail existe.
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
          Informe seu e-mail e enviaremos um código de 6 dígitos para você criar uma nova senha.
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
          {isSubmitting ? 'Enviando...' : 'Enviar código'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 2 — Informar o código e a nova senha
// ---------------------------------------------------------------------------

function TelaResetSenha({
  email,
  onDone,
  onTrocarEmail,
}: {
  email: string
  onDone: () => void
  onTrocarEmail: () => void
}) {
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [reenviando, setReenviando] = useState(false)
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

  const onSubmit = async ({ codigo, senha }: ResetData) => {
    try {
      await api.post('/auth/redefinir-senha', {
        email,
        tipo_usuario: TIPO_USUARIO,
        codigo,
        nova_senha: senha,
      })
      onDone()
    } catch (_) {
      addToast({ type: 'error', title: 'Código inválido ou expirado. Solicite um novo.' })
    }
  }

  const handleReenviar = async () => {
    setReenviando(true)
    try {
      await solicitarCodigo(email)
      addToast({ type: 'success', title: 'Enviamos um novo código para o seu e-mail.' })
    } catch (_) {
      addToast({ type: 'success', title: 'Enviamos um novo código para o seu e-mail.' })
    } finally {
      setReenviando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Nova senha</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Enviamos um código de 6 dígitos para{' '}
          <span className="font-medium text-neutral-700">{email}</span>. Ele é válido por 15 minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Código</label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              {...register('codigo')}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              autoFocus
              className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-2.5 text-sm tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          {errors.codigo && <p className="text-xs text-error mt-1">{errors.codigo.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Nova senha</label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              {...register('senha')}
              placeholder="••••••••"
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

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleReenviar}
          disabled={reenviando}
          className="text-primary-600 hover:underline font-medium disabled:opacity-50"
        >
          {reenviando ? 'Reenviando...' : 'Reenviar código'}
        </button>
        <button
          type="button"
          onClick={onTrocarEmail}
          className="text-neutral-500 hover:text-neutral-700"
        >
          Trocar e-mail
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 3 — Sucesso do reset
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
  const emailFromUrl = searchParams.get('email') ?? ''

  // Deep-link com ?email= (ex.: e-mail de boas-vindas da imobiliária) já leva
  // o cliente direto para a etapa de código.
  const [screen, setScreen] = useState<Screen>(emailFromUrl ? 'reset' : 'email')
  const [email, setEmail] = useState(emailFromUrl)
  const codigoAutoEnviado = useRef(false)

  // No deep-link, dispara o envio do código automaticamente (uma única vez).
  useEffect(() => {
    if (emailFromUrl && !codigoAutoEnviado.current) {
      codigoAutoEnviado.current = true
      void solicitarCodigo(emailFromUrl).catch(() => {
        /* silencioso — o backend nunca revela se o e-mail existe */
      })
    }
  }, [emailFromUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 space-y-6">
        {screen === 'email' && (
          <TelaEmail
            emailInicial={email}
            onSent={(e) => {
              setEmail(e)
              setScreen('reset')
            }}
          />
        )}

        {screen === 'reset' && (
          <TelaResetSenha
            email={email}
            onDone={() => setScreen('sucesso')}
            onTrocarEmail={() => setScreen('email')}
          />
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
