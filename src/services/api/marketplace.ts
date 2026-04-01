import { api } from '@/lib/axios'
import type { MarketplaceParams, MarketplacePagedResponse } from '@/types/api'
import type { MarketplaceItem, MarketplaceServico, MarketplaceCategoria, RecomendacoesResponse, ProdutoRelacionado, OrganizacaoPublica, ListarServicosOrgResponse } from '@/types/marketplace'
import type { Item, Servico } from '@/types/domain'

export const marketplaceService = {
  listarItens: (params?: MarketplaceParams) =>
    api.get<MarketplacePagedResponse<MarketplaceItem>>('/marketplace/itens', { params }).then(r => r.data),
  
  listarServicos: (params?: MarketplaceParams) =>
    api.get<MarketplacePagedResponse<MarketplaceServico>>('/marketplace/servicos', { params }).then(r => r.data),
    
  categorias: () => 
    api.get<MarketplaceCategoria[]>('/marketplace/categorias').then(r => r.data),
    
  maisVendidos: (limit: number = 10) =>
    api.get<MarketplaceServico[]>('/marketplace/mais-vendidos', { params: { limit } }).then(r => r.data),
    
  recomendacoes: () =>
    api.get<RecomendacoesResponse>('/marketplace/recomendacoes').then(r => r.data),
    
  detalheServico: (id: string) => 
    api.get<Servico>(`/marketplace/servicos/${id}`).then(r => r.data),
    
  detalheItem: (id: string) => 
    api.get<Item>(`/marketplace/itens/${id}`).then(r => r.data),

  listarProdutosRelacionados: (servicoId: string) =>
    api.get<ProdutoRelacionado[]>(`/marketplace/servicos/${servicoId}/produtos`).then(r => r.data),

  obterOrganizacao: (id: string) =>
    api.get<OrganizacaoPublica>(`/marketplace/organizacoes/${id}`).then(r => r.data),
    
  obterServicosPorOrg: (id: string, pagina: number = 1, limite: number = 12) =>
    api.get<ListarServicosOrgResponse>(`/marketplace/organizacoes/${id}/servicos`, { params: { pagina, limite } }).then(r => r.data),
}
