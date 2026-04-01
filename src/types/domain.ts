export interface User {
  id: string; nome: string; email: string; cpf?: string; telefone?: string; data_nascimento?: string; foto_url?: string
}
export interface Endereco {
  id: string;
  rua: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  ponto_de_referencia?: string;
  ativo: boolean;
}
export interface Categoria { id: string; valor: string; slug: string; icone?: string; descricao?: string }
export interface Organizacao { id: string; nome: string; descricao?: string; logo_url?: string; avaliacao_media: number; total_avaliacoes: number; cidade?: string; estado?: string }
export interface Servico { 
  id: string; 
  organizacao_id?: string;
  nome?: string; 
  titulo?: string; 
  descricao: string; 
  preco: number | string; 
  preco_minimo?: number; 
  preco_maximo?: number; 
  preco_promocional?: number | string; 
  em_promocao?: boolean; 
  categoria: Categoria | string; 
  organizacao: Organizacao; 
  fotos?: string[]; 
  fotos_count?: number; 
  avaliacao_media: number; 
  total_avaliacoes: number; 
  localidade?: string; 
  disponivel?: boolean; 
  tags?: string[] 
}
export interface Item { id: string; nome: string; descricao: string; preco: number; categoria: Categoria; fotos?: string[]; /* @deprecated Usar hook de mídia para listar fotos */ fotos_count?: number; disponivel: boolean }
export type CarrinhoItemTipo = 'servico' | 'produto' | 'item'

export interface CarrinhoBaseItem {
  id: string;
  titulo: string;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
  foto_url?: string;
}

export interface CarrinhoItemBackend extends CarrinhoBaseItem {
  item_id: string;
}

export interface CarrinhoProdutoItem extends CarrinhoBaseItem {
  produto_id: string;
}

export interface CarrinhoServicoItem extends CarrinhoBaseItem {
  servico_id: string;
  produtos?: CarrinhoProdutoItem[];
}

export interface CarrinhoTotais {
  subtotal_itens: string;
  subtotal_servicos: string;
  subtotal_produtos: string;
  subtotal_geral: string;
  desconto: string;
  total: string;
}

export interface CarrinhoCupomAplicado {
  codigo: string;
  percentual: string;
  valor_desconto: string;
}

/** Interface de legado para compatibilidade se necessário */
export interface CarrinhoItem { 
  id: string; 
  tipo: CarrinhoItemTipo; 
  referencia_id: string; 
  nome: string; 
  preco: number; 
  quantidade: number; 
  foto_url?: string 
}

export interface Cupom { id: string; codigo: string; descricao?: string; desconto_percentual?: number; desconto_valor?: number; valido_ate?: string }

export interface Carrinho {
  cliente_id: string;
  itens: CarrinhoItemBackend[];
  servicos: CarrinhoServicoItem[];
  produtos: CarrinhoProdutoItem[];
  cupom_aplicado?: CarrinhoCupomAplicado;
  totais: CarrinhoTotais;
  criado_em: string;
  atualizado_em: string;
  // Campos de compatibilidade (opcionais, serão calculados ou usados os da totais)
  subtotal?: number;
  desconto?: number;
  total?: number;
}
export type PedidoStatus = 'PENDENTE' | 'PAGO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'
export type PagamentoStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'ESTORNADO'

export interface PedidoLinha {
  id: string;
  referencia_id: string;
  tipo: string;
  titulo: string;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
}

export interface PedidoAgendamento {
  id: string;
  data: string;
  periodo: string;
  confirmado: boolean;
  confirmado_em?: string;
}

export interface PedidoPagamento {
  id: string;
  tipo: string;
  status: PagamentoStatus;
  valor: string;
  criado_em: string;
}

export interface PedidoDesconto {
  codigo: string;
  percentual: string;
  valor_desconto: string;
}

export interface Pedido { 
  id: string; 
  cliente_id: string;
  codigo: string;
  status: PedidoStatus; 
  organizacao_id?: string;
  linhas: PedidoLinha[]; 
  endereco_entrega: Endereco; 
  agendamentos: PedidoAgendamento[];
  pagamento?: PedidoPagamento;
  desconto_aplicado?: PedidoDesconto;
  subtotal: string; 
  desconto: string; 
  total: string; 
  criado_em: string; 
  atualizado_em: string; 
  avaliado?: boolean;
  avaliacoes_feitas?: string[];
}
export type CotacaoStatus = 'ABERTA' | 'COM_PROPOSTAS' | 'ACEITA' | 'CANCELADA' | 'EXPIRADA'
export type OrcamentoStatus = 'PENDENTE' | 'ACEITO' | 'REJEITADO' | 'aguardando_aprovacao'

export interface Orcamento {
  id: string
  cotacao_id: string
  organizacao: Organizacao
  valor: number
  descricao: string
  prazo_dias?: number
  status: OrcamentoStatus
  criado_em: string
  // Novos campos do backend
  provedor_nome?: string
  organizacao_id?: string
  titulo?: string
}

export interface Cotacao {
  id: string
  descricao: string
  categoria: Categoria
  localidade: string
  data_desejada?: string
  orcamento_minimo?: number
  orcamento_maximo?: number
  status: CotacaoStatus
  criado_em: string
  orcamentos?: Orcamento[]
  anexos?: string[]
}

export interface SolicitacaoDetalheResponse {
  solicitacao: {
    id: string
    cliente_id: string
    descricao: string
    tipo_servico: string
    cidade: string
    estado: string
    endereco_completo: string
    metragem?: number | null
    ativa: boolean
    qtd_orcamentos?: number | null
    criada_em: string
  }
  orcamentos: Array<{
    id: string
    solicitacao_id?: string | null
    organizacao_id: string
    prestador_id?: string | null
    provedor_nome: string
    titulo?: string | null
    descricao?: string | null
    valor: string | number
    prazo_dias?: number | null
    status: string
    criado_em: string
  }>
}
export interface Avaliacao { id: string; nota: number; comentario?: string; autor: { nome: string; foto_url?: string }; criado_em: string }
export interface MensagemArky { id: string; conteudo: string; tipo: 'usuario' | 'arky'; criado_em: string }
export interface ClienteResponse {
  id: string;
  nome: string;
  sobrenome: string;
  nome_completo: string;
  email: string;
  telefone: string;
  ativo: boolean;
  enderecos: any[];
}