import { useState } from 'react'
import { MapPin, Plus, Pencil, Trash2, Lock, User, Star, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useEnderecos } from '@/hooks/useCliente'
import { clientesService } from '@/services/api/clientes'
import { useUIStore } from '@/stores/uiStore'
import { Spinner } from '@/components/ui/Spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Endereco } from '@/types/domain'
import { AccountSidebar } from '@/components/account/AccountSidebar';


type EnderecoForm = Omit<Endereco, 'id' | 'principal' | 'ativo'>

const emptyForm: EnderecoForm = { rua: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', ponto_de_referencia: '' }

function EnderecoFormModal({
  endereco,
  onSave,
  onClose,
  isSaving,
}: {
  endereco: EnderecoForm
  onSave: (data: EnderecoForm) => void
  onClose: () => void
  isSaving: boolean
}) {
  const [form, setForm] = useState<EnderecoForm>(endereco)

  const buscarCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const d = await res.json()
      if (!d.erro) {
        setForm((p) => ({ ...p, cep, rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }))
      }
    } catch {}
  }

  const set = (field: keyof EnderecoForm, value: string) => setForm((p) => ({ ...p, [field]: value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">{endereco.rua ? 'Editar endereço' : 'Novo endereço'}</h3>
          <button onClick={onClose} aria-label="Fechar formulário" className="text-neutral-400 hover:text-neutral-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-neutral-600 block mb-1">CEP *</label>
              <input
                value={form.cep}
                onChange={(e) => { set('cep', e.target.value); buscarCep(e.target.value) }}
                placeholder="00000-000"
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-neutral-600 block mb-1">Rua / Logradouro *</label>
              <input value={form.rua} onChange={(e) => set('rua', e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Rua, Av., etc." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-neutral-600 block mb-1">Complemento</label>
              <input value={form.complemento ?? ''} onChange={(e) => set('complemento', e.target.value)} placeholder="Apto, Bloco..." className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Bairro *</label>
              <input value={form.bairro} onChange={(e) => set('bairro', e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Cidade *</label>
              <input value={form.cidade} onChange={(e) => set('cidade', e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Estado (UF) *</label>
              <input value={form.estado} onChange={(e) => set('estado', e.target.value.toUpperCase())} maxLength={2} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-neutral-600 block mb-1">Ponto de referência</label>
              <input value={form.ponto_de_referencia ?? ''} onChange={(e) => set('ponto_de_referencia', e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-neutral-100 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition-colors">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving}
            className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? <Spinner size="sm" color="white" /> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Enderecos() {
  const { data: enderecos, isLoading } = useEnderecos()
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; editId?: string; form: EnderecoForm }>({ open: false, form: emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['cliente', 'enderecos'] })

  const criar = useMutation({
    mutationFn: (data: EnderecoForm) => clientesService.criarEndereco({ ...data, ativo: true }),
    onSuccess: () => { invalidate(); addToast({ type: 'success', title: 'Endereço adicionado!' }); setModal({ open: false, form: emptyForm }) },
    onError: () => addToast({ type: 'error', title: 'Erro ao salvar endereço.' }),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EnderecoForm }) => clientesService.atualizarEndereco(id, data),
    onSuccess: () => { invalidate(); addToast({ type: 'success', title: 'Endereço atualizado!' }); setModal({ open: false, form: emptyForm }) },
    onError: () => addToast({ type: 'error', title: 'Erro ao atualizar endereço.' }),
  })

  const deletar = useMutation({
    mutationFn: (id: string) => clientesService.deletarEndereco(id),
    onSuccess: () => { invalidate(); addToast({ type: 'success', title: 'Endereço removido.' }); setDeleteId(null) },
    onError: () => addToast({ type: 'error', title: 'Erro ao remover endereço.' }),
  })

  const handleSave = (form: EnderecoForm) => {
    if (modal.editId) {
      atualizar.mutate({ id: modal.editId, data: form })
    } else {
      criar.mutate(form)
    }
  }

  return (
    <PageWrapper>
      <Container>
        <h1 className="text-2xl font-bold text-neutral-900 mb-6 font-poppins">Minha conta</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <AccountSidebar/>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">Meus endereços</h2>
                <button
                  onClick={() => setModal({ open: true, form: emptyForm })}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  <Plus size={15} />
                  Adicionar
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : !enderecos || enderecos.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin size={40} className="mx-auto text-neutral-200 mb-3" />
                  <p className="font-semibold text-neutral-600">Nenhum endereço cadastrado</p>
                  <p className="text-sm text-neutral-400 mt-1">Adicione endereços para facilitar suas contratações</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enderecos.map((end) => (
                    <div key={end.id} className="flex items-start gap-3 border border-neutral-100 rounded-xl p-4">
                      <div className="h-9 w-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-neutral-800">{end.rua}{end.complemento ? `, ${end.complemento}` : ''}</p>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {end.bairro} — {end.cidade}/{end.estado} — CEP {end.cep}
                          {end.ponto_de_referencia && <span className="block mt-0.5 italic">Ref: {end.ponto_de_referencia}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setModal({ 
                            open: true, 
                            editId: end.id, 
                            form: { 
                              rua: end.rua, 
                              complemento: end.complemento, 
                              bairro: end.bairro, 
                              cidade: end.cidade, 
                              estado: end.estado, 
                              cep: end.cep,
                              ponto_de_referencia: end.ponto_de_referencia || ''
                            } 
                          })}
                          className="p-1.5 text-neutral-400 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(end.id)}
                          className="p-1.5 text-neutral-400 hover:text-error hover:bg-error-light rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de formulário */}
        {modal.open && (
          <EnderecoFormModal
            endereco={modal.form}
            onSave={handleSave}
            onClose={() => setModal({ open: false, form: emptyForm })}
            isSaving={criar.isPending || atualizar.isPending}
          />
        )}

        {/* Modal de confirmação de exclusão */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-error-light flex items-center justify-center">
                  <AlertTriangle size={20} className="text-error" />
                </div>
                <h3 className="font-semibold text-neutral-900">Remover endereço?</h3>
              </div>
              <p className="text-sm text-neutral-500">Este endereço será removido permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 border border-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition-colors">Cancelar</button>
                <button
                  onClick={() => deletar.mutate(deleteId)}
                  disabled={deletar.isPending}
                  className="flex-1 bg-error hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {deletar.isPending ? <Spinner size="sm" color="white" /> : 'Remover'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </PageWrapper>
  )
}
