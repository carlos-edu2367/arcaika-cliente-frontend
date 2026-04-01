import { Pedido } from './domain';

export interface PagedResponse<T> { items: T[]; total: number; page: number; page_size: number; has_next: boolean }
export interface MarketplacePagedResponse<T> {
  itens: T[];
  total: number;
  pagina: number;
  por_pagina: number;
}
export interface ApiError { detail: string | { msg: string; loc: string[] }[]; status_code?: number }
export interface MarketplaceParams {
  q?: string;
  categoria?: string;
  cidade?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface AvaliacoesPagedResponse {
  avaliacoes: any[];
  media_nota: number;
  total_avaliacoes: number;
  pagina: number;
  por_pagina: number;
}

export interface PedidosPagedResponse {
  pedidos: Pedido[];
  total: number;
  pagina: number;
  por_pagina: number;
}