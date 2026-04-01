import { useState } from 'react'
import { User, Lock, MapPin, Star, Save, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '@/services/api/clientes'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Spinner } from '@/components/ui/Spinner'
import { AccountSidebar } from '@/components/account/AccountSidebar';

export default function Perfil() {
  const { updateUser } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '' })

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', 'me'],
    queryFn: clientesService.perfil,
  })

  const atualizar = useMutation({
    mutationFn: (data: { nome?: string; telefone?: string }) => clientesService.atualizarPerfil(data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['cliente', 'me'] })
      updateUser(updated)
      addToast({ type: 'success', title: 'Perfil atualizado!' })
      setEditing(false)
    },
    onError: () => addToast({ type: 'error', title: 'Erro ao atualizar perfil.' }),
  })

  const startEdit = () => {
    setForm({ nome: cliente?.nome ?? '', telefone: cliente?.telefone ?? '' })
    setEditing(true)
  }

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">Dados pessoais</h2>
                {!editing && (
                  <button
                    onClick={startEdit}
                    className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Editar
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Nome</label>
                      <input
                        value={form.nome}
                        onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Telefone</label>
                      <input
                        value={form.telefone}
                        onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 border border-neutral-200 text-neutral-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-sm"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                    <button
                      onClick={() => atualizar.mutate({ nome: form.nome, telefone: form.telefone })}
                      disabled={atualizar.isPending}
                      className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {atualizar.isPending ? <Spinner size="sm" color="white" /> : <Save size={14} />}
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Nome completo', value: `${cliente?.nome ?? ''} ${(cliente as any)?.sobrenome ?? ''}`.trim() || '—' },
                    { label: 'Email', value: cliente?.email ?? '—' },
                    { label: 'Telefone', value: cliente?.telefone ?? '—' },
                    { label: 'CPF', value: cliente?.cpf ? `***.***.${cliente.cpf.slice(-6, -2)}-${cliente.cpf.slice(-2)}` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-neutral-50 last:border-0">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide sm:w-40 shrink-0">{label}</span>
                      <span className="text-sm text-neutral-800">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </PageWrapper>
  )
}
