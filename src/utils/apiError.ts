import axios from 'axios'

/** Parse an API error into a user-friendly string */
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as
      | { detail?: string | Array<{ msg: string }> }
      | undefined

    if (status === 422 && data?.detail) {
      return Array.isArray(data.detail)
        ? (data.detail[0]?.msg ?? 'Dados inválidos.')
        : data.detail
    }
    if (status === 404) return 'Recurso não encontrado.'
    if (status === 403) return 'Você não tem permissão para esta ação.'
    if (status === 429) return 'Muitas tentativas. Aguarde alguns segundos.'
    if (status === 500) return 'Erro interno do servidor. Tente novamente.'
    if (status === 503) return 'Serviço temporariamente indisponível. Tente novamente em instantes.'
    if (!status) return 'Sem conexão com a internet. Verifique sua rede.'
  }
  return 'Ocorreu um erro inesperado.'
}
