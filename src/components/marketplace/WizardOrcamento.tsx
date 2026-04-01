import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Paintbrush, 
  Zap, 
  Droplets, 
  Wrench, 
  Hammer, 
  LayoutGrid, 
  CheckCircle2,
  Send,
  FilePlus,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { useCriarCotacao } from '@/hooks/useCotacoes';
import { useUploadAnexoSolicitacao } from '@/hooks/useMidia';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

const CATEGORIAS = [
  { id: 'Pintura', label: 'Pintura', icon: Paintbrush },
  { id: 'Hidráulica', label: 'Hidráulica', icon: Droplets },
  { id: 'Elétrica', label: 'Elétrica', icon: Zap },
  { id: 'Reformas', label: 'Reformas', icon: Wrench },
  { id: 'Montagem', label: 'Montagem', icon: Hammer },
  { id: 'Outros', label: 'Outros Serviços', icon: LayoutGrid },
];

interface WizardData {
  titulo: string;
  tipo_servico: string;
  descricao: string;
  metragem?: number;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const initialData: WizardData = {
  titulo: '',
  tipo_servico: '',
  descricao: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

export default function WizardOrcamento({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 'anexos' | 'sucesso'>(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [loadingCep, setLoadingCep] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { isAuthenticated } = useAuthStore();
  const { openLoginModal, addToast } = useUIStore();
  const criarCotacao = useCriarCotacao();
  const { mutateAsync: uploadAnexos, isPending: isUploading } = useUploadAnexoSolicitacao();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset estado ao fechar
    setTimeout(() => {
      setStep(1);
      setData(initialData);
    }, 300);
    onClose();
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formattedCep = rawCep.replace(/^(\d{5})(\d)/, '$1-$2');
    setData((prev) => ({ ...prev, cep: formattedCep }));

    if (rawCep.length === 8) {
      setLoadingCep(true);
      try {
        const { data: viacep } = await axios.get(`https://viacep.com.br/ws/${rawCep}/json/`);
        if (!viacep.erro) {
          setData((prev) => ({
            ...prev,
            rua: viacep.logradouro,
            bairro: viacep.bairro,
            cidade: viacep.localidade,
            estado: viacep.uf,
          }));
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      addToast({ type: 'warning', title: 'Quase lá!', message: 'Faça login rápido para enviar o seu pedido.' });
      openLoginModal();
      return;
    }

    const payload = {
      titulo: data.titulo, // Campo titulo devidamente incluído no payload
      tipo_servico: data.tipo_servico,
      descricao: data.descricao,
      cidade: data.cidade,
      estado: data.estado,
      endereco_completo: `${data.rua}, ${data.numero}${data.complemento ? ` - ${data.complemento}` : ''}, ${data.bairro}, CEP: ${data.cep}`,
      metragem: data.metragem || undefined,
    };

    try {
      const res = await criarCotacao.mutateAsync(payload);
      setCreatedId(res.id);
      setStep('anexos');
    } catch (err) {
      // Erro já tratado no hook useCriarCotacao via toast
    }
  };

  const handleFileUpload = async () => {
    if (!createdId || selectedFiles.length === 0) return;
    
    try {
      await uploadAnexos({ solicitacaoId: createdId, files: selectedFiles });
      setStep('sucesso');
    } catch (err) {
      // Toast já exibido no hook
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Regras de bloqueio/avanço
  const canGoNext = () => {
    if (step === 1) return data.tipo_servico.length > 0;
    if (step === 2) return data.titulo.length >= 5 && data.descricao.length >= 15 && (data.tipo_servico !== 'Pintura' || (data.metragem && data.metragem > 0));
    if (step === 3) return data.cep.length === 9 && data.rua && data.numero && data.cidade && data.estado;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl h-[95vh] sm:h-[85vh] max-h-[800px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'sucesso' && step !== 'anexos' && (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={cn("h-2 w-8 rounded-full transition-all duration-300", step >= s ? "bg-primary" : "bg-neutral-100")} />
                ))}
              </div>
            )}
          </div>
          <button onClick={handleClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body scrollável */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2 font-poppins">Do que você precisa?</h3>
              <p className="text-neutral-500 mb-8 text-sm sm:text-base">Selecione a categoria que melhor descreve o serviço desejado.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CATEGORIAS.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = data.tipo_servico === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setData({ ...data, tipo_servico: cat.id })}
                      className={cn(
                        "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all duration-200",
                        isSelected 
                          ? "border-primary bg-primary-light/20 text-primary shadow-md scale-[1.02]" 
                          : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                      )}
                    >
                      <Icon size={36} className="mb-3" strokeWidth={isSelected ? 2.5 : 2} />
                      <span className="font-bold text-sm">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2 font-poppins">Detalhes do serviço</h3>
              <p className="text-neutral-500 mb-8 text-sm sm:text-base">Quanto mais detalhes, mais precisos serão os orçamentos recebidos.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Título do Pedido</label>
                  <input
                    value={data.titulo}
                    onChange={(e) => setData({ ...data, titulo: e.target.value })}
                    placeholder="Ex: Pintura completa de apartamento"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-neutral-900 font-medium"
                  />
                </div>

                {data.tipo_servico === 'Pintura' && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Metragem aproximada (m²)</label>
                    <input
                      type="number"
                      value={data.metragem || ''}
                      onChange={(e) => setData({ ...data, metragem: Number(e.target.value) })}
                      placeholder="Ex: 50"
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-neutral-900 font-medium"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Descrição do pedido</label>
                  <textarea
                    value={data.descricao}
                    onChange={(e) => setData({ ...data, descricao: e.target.value })}
                    placeholder={data.tipo_servico === 'Pintura' ? "Ex: Pintura interna de 2 quartos e sala, cor branca, paredes com poucas imperfeições..." : "Descreva o problema ou o serviço que você deseja contratar..."}
                    rows={6}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-neutral-900 resize-none font-medium"
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-xs text-neutral-400">Seja claro e objetivo.</span>
                    <span className={cn("text-xs font-bold", data.descricao.length < 15 ? "text-warning" : "text-success")}>
                      {data.descricao.length} / 15 min.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2 font-poppins">Onde será o serviço?</h3>
              <p className="text-neutral-500 mb-8 text-sm sm:text-base">Precisamos do endereço para o conectar a profissionais próximos.</p>
              
              <div className="space-y-5">
                <div className="relative">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">CEP</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={data.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-medium text-neutral-900"
                    />
                    {loadingCep && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                        <Spinner size="sm" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Rua / Logradouro</label>
                    <input value={data.rua} onChange={(e) => setData({...data, rua: e.target.value})} className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 outline-none font-medium text-neutral-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Número</label>
                    <input value={data.numero} onChange={(e) => setData({...data, numero: e.target.value})} className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 outline-none font-medium text-neutral-900" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Complemento (opcional)</label>
                    <input value={data.complemento} onChange={(e) => setData({...data, complemento: e.target.value})} placeholder="Apto 101, Bloco B" className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 outline-none font-medium text-neutral-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Bairro</label>
                    <input value={data.bairro} onChange={(e) => setData({...data, bairro: e.target.value})} className="w-full border border-neutral-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/50 outline-none font-medium text-neutral-900" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Cidade</label>
                    <input value={data.cidade} disabled className="w-full border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-3.5 font-medium text-neutral-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">UF</label>
                    <input value={data.estado} disabled className="w-full border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-3.5 font-medium text-neutral-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2 font-poppins">Revise o seu pedido</h3>
              <p className="text-neutral-500 mb-8 text-sm sm:text-base">Confirme os dados antes de disparar a solicitação aos profissionais.</p>
              
              <div className="bg-neutral-50 border border-neutral-100 rounded-[24px] p-6 space-y-5">
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Título do Pedido</span>
                  <p className="font-bold text-lg text-primary mt-1">{data.titulo}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Serviço Desejado</span>
                  <p className="font-semibold text-neutral-800 mt-1">{data.tipo_servico}</p>
                </div>
                {data.metragem && data.metragem > 0 && (
                  <div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Metragem Informada</span>
                    <p className="font-semibold text-neutral-800 mt-1">{data.metragem} m²</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Descrição Detalhada</span>
                  <p className="text-sm font-medium text-neutral-700 mt-1 whitespace-pre-wrap leading-relaxed">{data.descricao}</p>
                </div>
                <div className="pt-4 border-t border-neutral-200/60">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Local do Atendimento</span>
                  <p className="text-sm font-medium text-neutral-700 mt-1">
                    {data.rua}, {data.numero} {data.complemento && `- ${data.complemento}`}<br/>
                    {data.bairro} — {data.cidade} / {data.estado}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'anexos' && (
            <div className="h-full flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
              <div className="h-20 w-20 bg-primary-light/30 rounded-full flex items-center justify-center text-primary mb-6">
                <FilePlus size={40} />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 mb-2 font-poppins">Adicionar anexos?</h3>
              <p className="text-neutral-500 mb-8 max-w-sm text-center font-medium">
                Fotos do local ou documentos (PDF) ajudam muito os profissionais a entenderem o serviço.
              </p>

              <div className="w-full space-y-6">
                <label className="block w-full cursor-pointer group">
                  <div className="w-full border-2 border-dashed border-neutral-200 rounded-[24px] p-8 flex flex-col items-center justify-center gap-3 group-hover:border-primary/50 group-hover:bg-primary-light/5 transition-all">
                    <div className="h-12 w-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:text-primary transition-colors">
                      <UploadCloud size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-neutral-700">Clique para selecionar arquivos</p>
                      <p className="text-xs text-neutral-400 mt-1 uppercase font-black tracking-widest text-[10px]">Imagens ou PDFs</p>
                    </div>
                    <input type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf" />
                  </div>
                </label>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto px-1 custom-scrollbar">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-100 animate-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm shrink-0">
                            <FilePlus size={16} />
                          </div>
                          <p className="text-sm font-bold text-neutral-700 truncate pr-4">{file.name}</p>
                        </div>
                        <button onClick={() => removeFile(idx)} className="text-neutral-300 hover:text-error h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error-light transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={handleFileUpload}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-black h-16 rounded-[24px] shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                  >
                    {isUploading ? <Spinner size="sm" color="white" /> : <UploadCloud size={20} />}
                    Enviar {selectedFiles.length} {selectedFiles.length === 1 ? 'arquivo' : 'arquivos'}
                  </button>
                  <button 
                    onClick={() => setStep('sucesso')}
                    disabled={isUploading}
                    className="w-full text-neutral-400 font-bold hover:text-neutral-600 transition-colors py-2 text-sm"
                  >
                    Pular por enquanto
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'sucesso' && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-10">
              <div className="h-24 w-24 bg-success-light rounded-full flex items-center justify-center text-success shadow-inner mb-6">
                <CheckCircle2 size={56} />
              </div>
              <h3 className="text-3xl font-extrabold text-neutral-900 mb-3 font-poppins tracking-tight">Pedido Enviado!</h3>
              <p className="text-neutral-600 mb-10 max-w-sm leading-relaxed text-base">
                A sua solicitação já está disponível para a nossa rede de profissionais qualificados. Será notificado assim que receber propostas.
              </p>
              <button 
                onClick={() => { handleClose(); navigate('/conta/orcamentos'); }}
                className="w-full sm:w-auto px-8 bg-neutral-900 hover:bg-black text-white font-bold h-14 rounded-2xl transition-all shadow-xl shadow-neutral-900/20 flex items-center justify-center gap-2"
              >
                Acompanhar propostas <ArrowRight size={18} />
              </button>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        {step !== 'sucesso' && step !== 'anexos' && (
          <div className="p-5 border-t border-neutral-100 bg-white flex gap-3 shrink-0">
            {step > 1 && (
              <button 
                onClick={() => setStep((s) => ((s as number) - 1) as any)} 
                className="flex items-center justify-center px-5 h-14 border-2 border-neutral-200 text-neutral-600 font-bold rounded-2xl hover:bg-neutral-50 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            <button
              onClick={() => step === 4 ? handleSubmit() : setStep((s) => ((s as number) + 1) as any)}
              disabled={!canGoNext() || criarCotacao.isPending}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 text-white font-bold h-14 rounded-2xl transition-all shadow-xl disabled:opacity-50",
                step === 4 ? "bg-success hover:bg-green-700 shadow-success/20" : "bg-primary hover:bg-primary-hover shadow-primary/20"
              )}
            >
              {criarCotacao.isPending ? <Spinner size="sm" color="white" /> : null}
              {step === 4 ? (
                <><Send size={18} /> Confirmar e Enviar</>
              ) : (
                <>Continuar <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}