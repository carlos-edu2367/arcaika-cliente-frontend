import { api } from '@/lib/axios'

export interface FotoServico {
  id: string
  url: string
  criada_em: string
}

export interface FotoItem {
  id: string
  url: string
  criada_em: string
}

export interface FotosPaginadasResponse<T> {
  fotos: T[]
  total: number
}

export interface FotoAssinada {
  foto_id: string
  url: string
  expira_em_segundos: number
}

export interface AssinarUrlsResponse {
  urls_por_referencia: Record<string, FotoAssinada[]>
}

export interface FotoReferencia {
  tipo: 'item' | 'servico' | 'produto-servico'
  id: string
}

export interface OrcamentoAnexo {
  id: string
  url: string
  tipo_arquivo: string
  nome_arquivo: string
  criado_em: string
}

export interface AnexosOrcamentoResponse {
  anexos: OrcamentoAnexo[]
  total: number
}

export const midiaService = {
  // Anexos de orçamentos (propostas)
  listarAnexosOrcamento: (orcamentoId: string) =>
    api.get<AnexosOrcamentoResponse>(`/midia/orcamentos/${orcamentoId}/anexos`).then((r) => r.data),

  // Fotos de serviços
  listarFotosServico: (servicoId: string) =>
    api.get<FotosPaginadasResponse<FotoServico>>(`/midia/servicos/${servicoId}/fotos`).then((r) => r.data),

  // Fotos de itens
  listarFotosItem: (itemId: string) =>
    api.get<FotosPaginadasResponse<FotoItem>>(`/midia/itens/${itemId}/fotos`).then((r) => r.data),

  // Fotos de produtos de serviço (upsells)
  listarFotosProdutoServico: (produtoId: string) =>
    api.get<FotosPaginadasResponse<FotoItem>>(`/midia/produtos-servico/${produtoId}/fotos`).then((r) => r.data),

  uploadFotoServico: (servicoId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<FotoServico>(`/midia/servicos/${servicoId}/fotos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  deletarFotoServico: (servicoId: string, fotoId: string) =>
    api.delete(`/midia/servicos/${servicoId}/fotos/${fotoId}`),

  // Fotos de perfil / organização
  uploadFotoOrganizacao: (organizacaoId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<{ url: string }>(`/midia/organizacoes/${organizacaoId}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  // Anexos de cotações (solicitações)
  uploadAnexoSolicitacao: (solicitacaoId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<{ id: string; url: string; nome_arquivo: string }>(`/midia/solicitacoes/${solicitacaoId}/anexos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  uploadAnexoCotacao: (cotacaoId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<{ url: string }>(`/midia/cotacoes/${cotacaoId}/anexos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  // URLs assinadas para acesso seguro a arquivos privados
  assinarUrls: (referencias: FotoReferencia[], expiraEmSegundos: number = 3600) =>
    api
      .post<AssinarUrlsResponse>('/midia/assinar-urls', { 
        referencias, 
        expira_em_segundos: expiraEmSegundos 
      })
      .then((r) => r.data),
}
