export interface User {
  id: string; nome: string; email: string; cpf?: string; telefone?: string; data_nascimento?: string; foto_url?: string
}
export interface Endereco {
  id: string;
  rua: string;
  numero?: string;
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
  unidade_medida?: string;
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
  unidade_medida?: string;
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
  unidade_medida?: string;
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
export type CotacaoStatus =
  | 'aguardando_orcamento'
  | 'orcamento_recebido'
  | 'orcamento_aceito'
  | 'em_contato'
  | 'em_execucao'
  | 'finalizado'
  | 'cancelado'

export type OrcamentoStatus =
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'cancelado'

export interface Orcamento {
  id: string
  cotacao_id: string
  organizacao: Organizacao
  valor: number
  valor_com_desconto?: number | string | null
  descricao: string
  prazo_dias?: number
  validade_dias?: number
  status: OrcamentoStatus
  criado_em: string
  // Novos campos do backend
  provedor_nome?: string
  organizacao_id?: string
  prestador_id?: string | null
  titulo?: string
  numero_contrato?: string | null
  anexos_count?: number
  detalhamento?: Record<string, Record<string, number | string>> | null
  anexos?: any[]
  url_acompanhamento?: string | null
}

export interface Cotacao {
  id: string
  titulo?: string | null
  descricao: string
  categoria: Categoria
  localidade: string
  endereco_completo?: string | null
  metragem?: number | null
  data_desejada?: string
  orcamento_minimo?: number
  orcamento_maximo?: number
  status: CotacaoStatus
  criado_em: string
  orcamentos?: Orcamento[]
  anexos?: string[]
  numero_contrato?: string | null
  data_finalizacao_estimada?: string | null
  // Origem: presente quando a solicitação foi aberta pela imobiliária parceira
  parceiro_id?: string | null
  parceiro_nome?: string | null
}

export interface SolicitacaoResponse {
  id: string
  cliente_id: string
  titulo?: string | null
  descricao: string
  tipo_servico: string
  cidade: string
  estado: string
  endereco_completo?: string | null
  metragem?: number | null
  numero_contrato?: string | null
  ativa: boolean
  qtd_orcamentos?: number | null
  criada_em?: string | null
  status?: CotacaoStatus | string | null
  data_finalizacao_estimada?: string | null
  parceiro_id?: string | null
  parceiro_nome?: string | null
}

export interface ListaSolicitacoesClienteResponse {
  solicitacoes: SolicitacaoResponse[]
  total: number
  pagina: number
  por_pagina: number
}

export interface OrcamentoDetalheResponse {
  id: string
  solicitacao_id?: string | null
  organizacao_id?: string | null
  prestador_id?: string | null
  provedor_nome?: string | null
  titulo?: string | null
  descricao?: string | null
  valor: string | number
  valor_com_desconto?: string | number | null
  prazo_dias?: number | null
  validade_dias?: number | null
  numero_contrato?: string | null
  status: OrcamentoStatus | string
  criado_em?: string | null
  detalhamento?: Record<string, Record<string, number | string>> | null
  anexos_count?: number
  url_acompanhamento?: string | null
}

export interface SolicitacaoComOrcamentosResponse {
  solicitacao: SolicitacaoResponse
  orcamentos: OrcamentoDetalheResponse[]
}

export type SolicitacaoDetalheResponse = SolicitacaoComOrcamentosResponse
export interface Avaliacao { id: string; nota: number; comentario?: string; autor: { nome: string; foto_url?: string }; criado_em: string }
export interface ArkyToolCall {
  nome: string;
  input: Record<string, unknown>;
  output_resumido: unknown;
  status: string;
  duracao_ms: number;
  erro?: string | null;
}
export interface ProductCardData {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_label: string;
  unidade: string;
  href: string;
  categoria?: string | null;
  image_url?: string | null;
}
export interface MessageBlock {
  tipo: 'product_card';
  dados: ProductCardData;
}
export interface MensagemArky {
  id: string;
  conteudo: string;
  tipo: 'usuario' | 'arky';
  criado_em: string;
  tool_calls?: ArkyToolCall[];
  modelo_utilizado?: string;
  blocos?: MessageBlock[];
}
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
