import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, User, MapPin, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useMutation } from '@tanstack/react-query'
import { clientesService } from '@/services/api/clientes'
import { useUIStore } from '@/stores/uiStore'
import { Spinner } from '@/components/ui/Spinner'
import { AccountSidebar } from '@/components/account/AccountSidebar';

const schema = z.object({
  senha_atual: z.string().min(1, 'Informe a senha atual'),
  nova_senha: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos 1 número'),
  confirmar_senha: z.string(),
}).refine((d) => d.nova_senha === d.confirmar_senha, {
  message: 'As senhas não coincidem',
  path: ['confirmar_senha'],
})
type FormData = z.infer<typeof schema>

function PasswordStrength({ value }: { value: string }) {
  const checks = [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ]
  const score = checks.filter(Boolean).length
  const label = ['', 'Fraca', 'Regular', 'Boa', 'Forte'][score]
  const colors = ['', 'bg-error', 'bg-warning', 'bg-info', 'bg-success']
  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-neutral-200'} transition-colors`} />
        ))}
      </div>
      {value && <p className={`text-xs font-medium ${['', 'text-error', 'text-warning', 'text-info', 'text-success'][score]}`}>{label}</p>}
    </div>
  )
}


export default function Senha() {
  const addToast = useUIStore((s) => s.addToast)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const novaSenha = watch('nova_senha', '')

  const alterarSenha = useMutation({
    mutationFn: (data: FormData) => clientesService.alterarSenha(data.senha_atual, data.nova_senha),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Senha alterada com sucesso!' })
      reset()
    },
    onError: () => addToast({ type: 'error', title: 'Senha atual incorreta. Tente novamente.' }),
  })

  return (
    <PageWrapper>
      <Container>
        <h1 className="text-2xl font-bold text-neutral-900 mb-6 font-poppins">Minha conta</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-1">Alterar senha</h2>
              <p className="text-sm text-neutral-500 mb-6">Use uma senha forte com pelo menos 8 caracteres, 1 maiúscula e 1 número.</p>

              <form onSubmit={handleSubmit((d) => alterarSenha.mutate(d))} className="space-y-5 max-w-sm">
                {/* Senha atual */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Senha atual</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      {...register('senha_atual')}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.senha_atual && <p className="text-xs text-error mt-1">{errors.senha_atual.message}</p>}
                </div>

                {/* Nova senha */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      {...register('nova_senha')}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {novaSenha && <PasswordStrength value={novaSenha} />}
                  {errors.nova_senha && <p className="text-xs text-error mt-1">{errors.nova_senha.message}</p>}
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Confirmar nova senha</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      {...register('confirmar_senha')}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmar_senha && <p className="text-xs text-error mt-1">{errors.confirmar_senha.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={alterarSenha.isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  {alterarSenha.isPending ? <Spinner size="sm" color="white" /> : <Lock size={15} />}
                  Alterar senha
                </button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </PageWrapper>
  )
}
