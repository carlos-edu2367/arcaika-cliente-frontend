export interface MarketplaceItem {
  id: string;
  estoque_id: string;
  titulo: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  em_promocao: boolean;
  fotos_count: number; // Indicador de que existem fotos. Carregar via hook de mídia.
  visivel: boolean;
}

export interface MarketplaceServico {
  id: string;
  estoque_id?: string;
  organizacao_id?: string;
  nome?: string;
  titulo?: string;
  descricao: string;
  preco?: number | string;
  preco_promocional?: number | string;
  preco_efetivo?: string;
  em_promocao?: boolean;
  categoria?: string;
  tipo_servico?: string;
  fotos_count: number;
  motivo?: string;
}

export interface MarketplaceCategoria {
  nome: string;
  valor: string;
}

export interface RecomendacoesResponse {
  servicos: MarketplaceServico[];
  status: 'completed' | 'processing' | 'unavailable';
}

export interface ProdutoRelacionado {
  id: string;
  servico_id: string;
  titulo: string;
  descricao: string;
  preco: number;
  valor_efetivo?: number;
  unidade: string;
  por_unidade?: boolean;
  tem_foto?: boolean;
}

export interface OrganizacaoPublica {
  id: string;
  titulo: string;
  nome_fantasia: string;
  ativa: boolean;
  criado_em?: string;
}

export interface ListarServicosOrgResponse {
  servicos: MarketplaceServico[];
  total: number;
  pagina: number;
  por_pagina: number;
}
