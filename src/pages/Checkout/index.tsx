import { useState, useReducer } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, MapPin, Calendar, CreditCard, ShoppingBag, Tag, X, Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Container } from '@/components/layout/Container'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useEnderecos } from '@/hooks/useCliente'
import { useCriarPedido } from '@/hooks/usePedidos'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { carrinhoService } from '@/services/api/carrinho'
import { useUIStore } from '@/stores/uiStore'
import { pedidosService } from '@/services/api/pedidos'
import { clientesService } from '@/services/api/clientes'
import type { Endereco } from '@/types/domain'

// ---- Tipos do wizard ----
interface WizardData {
  endereco_id: string
  agendamentos: { data: string; periodo: 'manha' | 'tarde' }[]
  observacoes: string
  cupom: string
  tipo_pagamento: string
}

type WizardAction =
  | { type: 'SET_ENDERECO'; id: string }
  | { type: 'SET_AGENDAMENTOS'; values: { data: string; periodo: 'manha' | 'tarde' }[] }
  | { type: 'SET_OBSERVACOES'; value: string }
  | { type: 'SET_CUPOM'; value: string }
  | { type: 'SET_PAGAMENTO'; metodo: string }

const initialData: WizardData = {
  endereco_id: '',
  agendamentos: [],
  observacoes: '',
  cupom: '',
  tipo_pagamento: 'total',
}

function reducer(state: WizardData, action: WizardAction): WizardData {
  switch (action.type) {
    case 'SET_ENDERECO': return { ...state, endereco_id: action.id }
    case 'SET_AGENDAMENTOS': return { ...state, agendamentos: action.values }
    case 'SET_OBSERVACOES': return { ...state, observacoes: action.value }
    case 'SET_CUPOM': return { ...state, cupom: action.value }
    case 'SET_PAGAMENTO': return { ...state, tipo_pagamento: action.metodo }
    default: return state
  }
}

// ---- Barra de progresso ----
const STEPS = ['Revisão', 'Endereço', 'Agendamento', 'Resumo', 'Pagamento']
const STEPS_MOBILE = ['Rev.', 'End.', 'Data', 'OK', 'Pag.']

function WizardProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < current
                ? 'bg-success text-white'
                : i === current
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-400'
            }`}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs sm:hidden ${i === current ? 'text-primary font-semibold' : 'text-neutral-400'}`}>
              {STEPS_MOBILE[i]}
            </span>
            <span className={`text-xs hidden sm:block ${i === current ? 'text-primary font-semibold' : 'text-neutral-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < current ? 'bg-success' : 'bg-neutral-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---- Step 1: Revisão do Carrinho ----
function Step1Revisao({ carrinho }: { carrinho: ReturnType<typeof useCarrinho>['data'] }) {
  if (!carrinho) return null
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-neutral-900 font-poppins">Revise seu pedido</h2>
      
      <div className="space-y-4">
        {/* SERVIÇOS */}
        {carrinho.servicos?.map((s) => (
          <div key={s.id} className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100/50">
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-xl bg-white border border-neutral-100 overflow-hidden shrink-0 flex items-center justify-center text-2xl shadow-sm">
                {s.foto_url ? <img src={s.foto_url} alt={s.titulo} className="w-full h-full object-cover" /> : '🔧'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 truncate">{s.titulo}</p>
                <div className="flex justify-between items-end mt-1">
                  <p className="text-xs text-neutral-500 font-medium">Qtd: {s.quantidade} {s.unidade_medida && `(${s.unidade_medida})`}</p>
                  <p className="text-sm font-black text-primary">{formatCurrency(parseFloat(s.subtotal))}</p>
                </div>
              </div>
            </div>
            {/* Upsells aninhados */}
            {s.produtos && s.produtos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2 pl-4">
                {s.produtos.map(p => (
                  <div key={p.id} className="flex justify-between text-[11px] font-medium text-neutral-500">
                    <span>{p.quantidade}x {p.titulo}</span>
                    <span>{formatCurrency(parseFloat(p.subtotal))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* ITENS */}
        {carrinho.itens?.map((i) => (
          <div key={i.id} className="flex items-center gap-4 bg-neutral-50 rounded-2xl p-4 border border-neutral-100/50">
            <div className="h-14 w-14 rounded-xl bg-white border border-neutral-100 overflow-hidden shrink-0 flex items-center justify-center text-2xl shadow-sm">
              {i.foto_url ? <img src={i.foto_url} alt={i.titulo} className="w-full h-full object-cover" /> : '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-neutral-900 truncate">{i.titulo}</p>
              <div className="flex justify-between items-end mt-1">
                <p className="text-xs text-neutral-500 font-medium">Qtd: {i.quantidade}</p>
                <p className="text-sm font-black text-primary">{formatCurrency(parseFloat(i.subtotal))}</p>
              </div>
            </div>
          </div>
        ))}

        {/* PRODUTOS AVULSOS */}
        {carrinho.produtos?.map((p) => (
          <div key={p.id} className="flex items-center gap-4 bg-neutral-50 rounded-2xl p-4 border border-neutral-100/50">
            <div className="h-14 w-14 rounded-xl bg-white border border-neutral-100 overflow-hidden shrink-0 flex items-center justify-center text-2xl shadow-sm">
              {p.foto_url ? <img src={p.foto_url} alt={p.titulo} className="w-full h-full object-cover" /> : '🛠️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-neutral-900 truncate">{p.titulo}</p>
              <div className="flex justify-between items-end mt-1">
                <p className="text-xs text-neutral-500 font-medium">Qtd: {p.quantidade}</p>
                <p className="text-sm font-black text-primary">{formatCurrency(parseFloat(p.subtotal))}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex justify-between items-center group hover:bg-primary/10 transition-colors">
        <span className="font-bold text-primary font-poppins">Total do pedido</span>
        <span className="text-2xl font-black text-primary font-poppins">{formatCurrency(parseFloat(carrinho.totais.total))}</span>
      </div>
      
      <Link to="/carrinho" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-primary transition-colors tracking-widest pl-1 uppercase">
        <ChevronLeft size={16} />
        Editar meu carrinho
      </Link>
    </div>
  )
}

// ---- Step 2: Endereço ----
function Step2Endereco({
  data,
  dispatch,
}: {
  data: WizardData
  dispatch: React.Dispatch<WizardAction>
}) {
  const { data: enderecos, isLoading } = useEnderecos()
  const [showForm, setShowForm] = useState(false)
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const [novoEnd, setNovoEnd] = useState({ rua: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', ponto_de_referencia: '' })

  const criarEndereco = useMutation({
    mutationFn: () => clientesService.criarEndereco({ ...novoEnd, ativo: false }),
    onSuccess: (end) => {
      qc.invalidateQueries({ queryKey: ['cliente', 'enderecos'] })
      dispatch({ type: 'SET_ENDERECO', id: end.id })
      setShowForm(false)
      addToast({ type: 'success', title: 'Endereço adicionado!' })
    },
  })

  const buscarCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const d = await res.json()
      if (!d.erro) {
        setNovoEnd((prev) => ({ ...prev, rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }))
      }
    } catch {}
  }

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900">Selecione o endereço</h2>
      <div className="space-y-3">
        {enderecos?.map((end) => (
          <label key={end.id} className={`flex items-start gap-4 p-5 rounded-[24px] border-2 cursor-pointer transition-all ${
            data.endereco_id === end.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-neutral-100 bg-white hover:border-neutral-200'
          }`}>
            <input
              type="radio"
              name="endereco"
              checked={data.endereco_id === end.id}
              onChange={() => dispatch({ type: 'SET_ENDERECO', id: end.id })}
              className="mt-1.5 accent-primary h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-black text-neutral-900">
                    {end.rua}
                  </p>
                  <p className="text-xs font-bold text-neutral-400 mt-0.5">{end.bairro} — {end.cidade}/{end.estado}</p>
                </div>
                {end.ativo && (
                  <span className="text-[10px] bg-success/10 text-success font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">Ativo</span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
                <MapPin size={12} className="shrink-0" />
                CEP {end.cep} {end.complemento ? ` — ${end.complemento}` : ''}
              </p>
            </div>
          </label>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
        >
          <Plus size={16} />
          Usar novo endereço
        </button>
      ) : (
        <div className="bg-neutral-50 border border-neutral-100 rounded-[32px] p-6 space-y-4 animate-in zoom-in-95 duration-300">
          <h3 className="text-sm font-black text-neutral-900 font-poppins pl-1">Novo endereço</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">CEP</label>
              <input
                value={novoEnd.cep}
                onChange={(e) => { setNovoEnd((p) => ({ ...p, cep: e.target.value })); buscarCep(e.target.value) }}
                placeholder="00000-000"
                className="w-full mt-1.5 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Rua / Logradouro</label>
              <input value={novoEnd.rua} onChange={(e) => setNovoEnd((p) => ({ ...p, rua: e.target.value }))} className="w-full mt-1.5 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Complemento</label>
              <input value={novoEnd.complemento} onChange={(e) => setNovoEnd((p) => ({ ...p, complemento: e.target.value }))} className="w-full mt-1.5 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Bairro</label>
              <input value={novoEnd.bairro} onChange={(e) => setNovoEnd((p) => ({ ...p, bairro: e.target.value }))} className="w-full mt-1.5 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Cidade</label>
              <input value={novoEnd.cidade} onChange={(e) => setNovoEnd((p) => ({ ...p, cidade: e.target.value }))} className="w-full mt-1.5 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Ponto de Referência</label>
              <input value={novoEnd.ponto_de_referencia} onChange={(e) => setNovoEnd((p) => ({ ...p, ponto_de_referencia: e.target.value }))} className="w-full mt-1.5 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">UF</label>
              <input maxLength={2} value={novoEnd.estado} onChange={(e) => setNovoEnd((p) => ({ ...p, estado: e.target.value.toUpperCase() }))} className="w-full mt-1.5 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setShowForm(false)} className="flex-1 bg-white border border-neutral-200 text-neutral-500 font-bold py-3 rounded-2xl text-xs hover:bg-neutral-50 transition-all tracking-widest">CANCELAR</button>
            <button
              onClick={() => criarEndereco.mutate()}
              disabled={criarEndereco.isPending}
              className="flex-1 bg-neutral-900 border border-neutral-900 text-white font-bold py-3 rounded-2xl text-xs hover:bg-black transition-all tracking-widest shadow-xl shadow-neutral-900/10"
            >
              {criarEndereco.isPending ? <Spinner size="sm" color="white" /> : 'CRIAR ENDEREÇO'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Step 3: Agendamento ----
function Step3Agendamento({ data, dispatch }: { data: WizardData; dispatch: React.Dispatch<WizardAction> }) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const [currentDate, setCurrentDate] = useState(minDate)
  const [currentPeriod, setCurrentPeriod] = useState<'manha' | 'tarde'>('manha')
  const addToast = useUIStore((s) => s.addToast)

  const handleAdd = () => {
    if (data.agendamentos.length >= 3) {
      addToast({ type: 'warning', title: 'Você já selecionou 3 propostas.' })
      return
    }

    const exists = data.agendamentos.some(a => a.data === currentDate && a.periodo === currentPeriod)
    if (exists) {
      addToast({ type: 'warning', title: 'Esta proposta já foi adicionada.' })
      return
    }

    const newAgendamentos = [...data.agendamentos, { data: currentDate, periodo: currentPeriod }]
    dispatch({ type: 'SET_AGENDAMENTOS', values: newAgendamentos })
  }

  const handleRemove = (index: number) => {
    const newAgendamentos = data.agendamentos.filter((_, i) => i !== index)
    dispatch({ type: 'SET_AGENDAMENTOS', values: newAgendamentos })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-neutral-900 font-poppins">Sugestões de Agendamento</h2>
        <p className="text-xs font-medium text-neutral-500">Selecione exatamente <span className="text-primary font-bold">3 janelas de horário</span> para o prestador.</p>
      </div>

      <div className="bg-neutral-50 rounded-[32px] p-6 border border-neutral-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Data</label>
            <input
              type="date"
              min={minDate}
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Período</label>
             <select 
               value={currentPeriod} 
               onChange={(e) => setCurrentPeriod(e.target.value as any)}
               className="w-full bg-white border border-neutral-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
             >
               <option value="manha">Manhã (8h - 12h)</option>
               <option value="tarde">Tarde (13h - 18h)</option>
             </select>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={data.agendamentos.length >= 3}
          className="w-full bg-neutral-900 text-white font-bold py-4 rounded-2xl text-xs hover:bg-black transition-all tracking-widest flex items-center justify-center gap-2 disabled:opacity-30"
        >
          <Plus size={16} />
          ADICIONAR PROPOSTA ({data.agendamentos.length}/3)
        </button>
      </div>

      {data.agendamentos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">Propostas Selecionadas</h3>
          <div className="space-y-2">
            {data.agendamentos.map((ag, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{formatDate(ag.data)}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {ag.periodo === 'manha' ? 'Manhã' : 'Tarde'}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleRemove(idx)} className="p-2 hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors rounded-xl">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-bold text-neutral-700 block mb-2 font-poppins">Observações (opcional)</label>
        <textarea
          value={data.observacoes}
          onChange={(e) => dispatch({ type: 'SET_OBSERVACOES', value: e.target.value })}
          placeholder="Algo específico que o prestador precise saber?"
          rows={3}
          maxLength={500}
          className="w-full border border-neutral-200 rounded-[24px] px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
        />
        <p className="text-[10px] font-black text-neutral-400 text-right mt-1 tracking-widest">{data.observacoes.length}/500</p>
      </div>
    </div>
  )
}

// ---- Step 4: Resumo + Cupom ----
function Step4Resumo({
  data,
  dispatch,
  carrinho,
}: {
  data: WizardData
  dispatch: React.Dispatch<WizardAction>
  carrinho: ReturnType<typeof useCarrinho>['data']
}) {
  const { data: enderecos } = useEnderecos()
  const { aplicarCupom } = useCarrinho()
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()
  const [cupomInput, setCupomInput] = useState('')

  const removerCupom = useMutation({
    mutationFn: carrinhoService.removerCupom,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['carrinho'] }); addToast({ type: 'success', title: 'Cupom removido.' }) },
  })

  const endereco = enderecos?.find((e) => e.id === data.endereco_id)

  if (!carrinho) return null
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-neutral-900">Resumo do pedido</h2>

      <div className="bg-neutral-50 rounded-[28px] p-5 space-y-3 text-sm border border-neutral-100">
        <div className="flex items-start gap-3 text-neutral-600">
          <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
          {endereco ? (
            <div className="flex flex-col">
              <span className="font-bold text-neutral-900">{endereco.rua}</span>
              <span className="text-xs">{endereco.bairro} — {endereco.cidade}/{endereco.estado}</span>
            </div>
          ) : (
            <span className="text-neutral-400 italic">Endereço não selecionado</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {data.agendamentos.map((ag, i) => (
            <div key={i} className="flex items-center gap-3 text-neutral-600">
              <Calendar size={16} className="text-primary shrink-0" />
              <span className="font-bold text-neutral-900">
                {formatDate(ag.data)} — {ag.periodo === 'manha' ? 'Manhã' : 'Tarde'}
              </span>
            </div>
          ))}
          {data.agendamentos.length === 0 && (
             <div className="flex items-center gap-3 text-neutral-400 italic">
               <Calendar size={16} className="shrink-0" />
               <span>Nenhum agendamento selecionado</span>
             </div>
          )}
        </div>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
        {/* SERVIÇOS */}
        {carrinho.servicos?.map((s) => (
          <div key={s.id} className="flex justify-between items-start text-xs py-1 border-b border-neutral-50 last:border-0 pb-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-neutral-800 truncate">{s.titulo}</p>
              <p className="text-[10px] text-neutral-400">Quantidade: {s.quantidade} {s.unidade_medida && `(${s.unidade_medida})`}</p>
            </div>
            <span className="font-black text-neutral-900 shrink-0 ml-4">{formatCurrency(parseFloat(s.subtotal))}</span>
          </div>
        ))}
        {/* ITENS */}
        {carrinho.itens?.map((i) => (
          <div key={i.id} className="flex justify-between items-start text-xs py-1 border-b border-neutral-50 last:border-0 pb-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-neutral-800 truncate">{i.titulo}</p>
              <p className="text-[10px] text-neutral-400">Quantidade: {i.quantidade}</p>
            </div>
            <span className="font-black text-neutral-900 shrink-0 ml-4">{formatCurrency(parseFloat(i.subtotal))}</span>
          </div>
        ))}
        {/* PRODUTOS */}
        {carrinho.produtos?.map((p) => (
          <div key={p.id} className="flex justify-between items-start text-xs py-1 border-b border-neutral-50 last:border-0 pb-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-neutral-800 truncate">{p.titulo}</p>
              <p className="text-[10px] text-neutral-400">Quantidade: {p.quantidade}</p>
            </div>
            <span className="font-black text-neutral-900 shrink-0 ml-4">{formatCurrency(parseFloat(p.subtotal))}</span>
          </div>
        ))}
      </div>

      {/* Cupom */}
      <div>
        <label className="text-sm font-medium text-neutral-700 block mb-1">
          <Tag size={14} className="inline mr-1" />
          Cupom de desconto
        </label>
        {carrinho.cupom_aplicado ? (
          <div className="flex items-center gap-2 bg-success-light text-success border border-green-200 rounded-lg px-3 py-2 text-sm">
            <span className="flex-1 font-medium">{carrinho.cupom_aplicado.codigo}</span>
            <button onClick={() => removerCupom.mutate()}><X size={14} className="hover:text-red-600" /></button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={cupomInput}
              onChange={(e) => setCupomInput(e.target.value)}
              placeholder="CÓDIGO"
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
            />
            <button
              onClick={() => aplicarCupom.mutate(cupomInput, { onSuccess: () => setCupomInput('') })}
              disabled={!cupomInput.trim()}
              className="bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 text-neutral-700 font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>


      <div className="bg-neutral-900 rounded-[32px] p-6 space-y-3 text-white shadow-2xl shadow-neutral-900/20">
        <div className="flex justify-between text-neutral-400 text-xs font-bold uppercase tracking-widest">
          <span>Subtotal</span>
          <span>{formatCurrency(parseFloat(carrinho.totais.subtotal_geral))}</span>
        </div>
        {parseFloat(carrinho.totais.desconto) > 0 && (
          <div className="flex justify-between text-success-light text-xs font-black uppercase tracking-widest">
            <span>Desconto</span>
            <span>-{formatCurrency(parseFloat(carrinho.totais.desconto))}</span>
          </div>
        )}
        <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-2">
          <span className="text-xs font-black uppercase tracking-tighter opacity-60">Total a pagar</span>
          <span className="text-3xl font-black text-white font-poppins">{formatCurrency(parseFloat(carrinho.totais.total))}</span>
        </div>
      </div>
    </div>
  )
}

// ---- Step 5: Pagamento (Mercado Pago) ----
function Step5Pagamento({ pedidoId, onPagar, isLoading }: { pedidoId: string; onPagar: () => void; isLoading: boolean }) {
  return (
    <div className="space-y-8 text-center py-4">
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-[3000ms]" />
        <div className="relative h-24 w-24 rounded-full bg-primary-light flex items-center justify-center shadow-inner">
          <CreditCard size={40} className="text-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-neutral-900 font-poppins">Tudo pronto!</h2>
        <p className="text-sm text-neutral-500 font-medium px-6 leading-relaxed">
          Seu pedido <span className="text-neutral-900 font-bold">#{pedidoId.slice(0, 8).toUpperCase()}</span> foi processado. 
          Agora você será levado ao ambiente seguro para finalizar o pagamento.
        </p>
      </div>

      <div className="bg-neutral-50 rounded-[32px] p-6 border border-neutral-100 flex items-center gap-4 text-left mx-4">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-neutral-100">
          <Check className="text-success" size={24} />
        </div>
        <div>
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Status do Checkout</p>
          <p className="text-sm font-bold text-neutral-700">Aguardando Pagamento</p>
        </div>
      </div>

      <div className="px-4">
        <button
          onClick={onPagar}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-black py-5 rounded-[24px] transition-all flex items-center justify-center gap-3 text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 group"
        >
          {isLoading ? <Spinner size="sm" color="white" /> : (
            <>
              PAGAR COM SEGURANÇA
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ---- Confirmação ----
function Confirmacao({ pedidoId }: { pedidoId: string }) {
  const navigate = useNavigate()
  return (
    <div className="text-center space-y-6 py-8">
      <div className="h-20 w-20 rounded-full bg-success-light flex items-center justify-center mx-auto">
        <Check size={40} className="text-success" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 font-poppins">Pedido realizado! 🎉</h2>
        <p className="text-neutral-500 mt-2">
          Seu pedido <span className="font-semibold text-neutral-700">#{pedidoId.slice(0, 8).toUpperCase()}</span> foi criado com sucesso.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate(`/pedidos/${pedidoId}`)}
          className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Acompanhar pedido
        </button>
        <button
          onClick={() => navigate('/marketplace')}
          className="border border-neutral-200 text-neutral-700 font-semibold px-6 py-3 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          Continuar comprando
        </button>
      </div>
    </div>
  )
}

// ---- Componente principal ----
export default function Checkout() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, dispatch] = useReducer(reducer, initialData)
  const [pedidoId, setPedidoId] = useState('')
  const [pagamentoLoading, setPagamentoLoading] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()

  const { data: carrinho, isLoading: carrinhoLoading } = useCarrinho()
  const criarPedido = useCriarPedido()

  const canNext = () => {
    if (step === 1 && !data.endereco_id) { addToast({ type: 'warning', title: 'Selecione um endereço.' }); return false }
    if (step === 2 && data.agendamentos.length < 3) { addToast({ type: 'warning', title: 'Selecione exatamente 3 propostas de agendamento.' }); return false }
    return true
  }

  const handleNext = async () => {
    if (!canNext()) return

    if (step === 3) {
      // GAP-004: payload alinhado com FinalizarPedidoRequest do backend
      try {
        const pedido = await criarPedido.mutateAsync({
          endereco_id: data.endereco_id,
          agendamentos: data.agendamentos,
          tipo_pagamento: data.tipo_pagamento,
          cupom_codigo: carrinho?.cupom_aplicado?.codigo || undefined,
          observacoes: data.observacoes || undefined,
          url_retorno_sucesso: `${window.location.origin}/pedidos`,
          url_retorno_falha: `${window.location.origin}/checkout`
        })
        const pedidoId = (pedido as any).id
        setPedidoId(pedidoId)
        
        // Se o backend retornar url_pagamento direto no pedido, redirecionamos
        if ((pedido as any).url_pagamento) {
          window.location.href = (pedido as any).url_pagamento
        } else {
          setStep(4)
        }
      } catch {}
      return
    }

    setStep((s) => s + 1)
  }

  const handlePagar = async () => {
    setPagamentoLoading(true)
    try {
      const res = await pedidosService.pagar(pedidoId, { 
        tipo: 'total',
        url_retorno_sucesso: `${window.location.origin}/pedidos/${pedidoId}?status=pago`,
        url_retorno_falha: `${window.location.origin}/pedidos/${pedidoId}?status=erro`
      })
      
      if (res?.url_pagamento) {
        window.location.href = res.url_pagamento
      } else {
        qc.invalidateQueries({ queryKey: ['carrinho'] })
        qc.invalidateQueries({ queryKey: ['pedidos'] })
        setConcluido(true)
      }
    } catch {
      addToast({ type: 'error', title: 'Erro ao processar pagamento. Tente novamente.' })
    } finally {
      setPagamentoLoading(false)
    }
  }

  if (carrinhoLoading) {
    return <PageWrapper><Container><div className="flex justify-center py-20"><Spinner size="lg" /></div></Container></PageWrapper>
  }

  if (!carrinho || (carrinho.itens.length === 0 && carrinho.servicos.length === 0 && carrinho.produtos.length === 0)) {
    return (
      <PageWrapper>
        <Container>
          <div className="text-center py-20">
            <ShoppingBag size={48} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-500 font-medium">Seu carrinho está vazio</p>
            <button onClick={() => navigate('/marketplace')} className="mt-4 text-primary text-sm font-medium hover:underline">Explorar serviços</button>
          </div>
        </Container>
      </PageWrapper>
    )
  }

  if (concluido) {
    return <PageWrapper><Container><Confirmacao pedidoId={pedidoId} /></Container></PageWrapper>
  }

  return (
    <PageWrapper>
      <Container className="pb-24 sm:pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-neutral-900 mb-6 font-poppins">Finalizar pedido</h1>
          <WizardProgress current={step} />

          <div className="bg-white border border-neutral-100 rounded-2xl shadow-md p-6 min-h-[300px]">
            {step === 0 && <Step1Revisao carrinho={carrinho} />}
            {step === 1 && <Step2Endereco data={data} dispatch={dispatch} />}
            {step === 2 && <Step3Agendamento data={data} dispatch={dispatch} />}
            {step === 3 && <Step4Resumo data={data} dispatch={dispatch} carrinho={carrinho} />}
            {step === 4 && <Step5Pagamento pedidoId={pedidoId} onPagar={handlePagar} isLoading={pagamentoLoading} />}
          </div>

          {step < 4 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1 border border-neutral-200 text-neutral-700 font-semibold px-5 py-3 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                  Voltar
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={criarPedido.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {criarPedido.isPending ? <Spinner size="sm" color="white" /> : null}
                {step === 3 ? 'Confirmar e ir para pagamento' : 'Próximo'}
                {!criarPedido.isPending && step < 3 && <ChevronRight size={18} />}
              </button>
            </div>
          )}
        </div>
      </Container>
    </PageWrapper>
  )
}
