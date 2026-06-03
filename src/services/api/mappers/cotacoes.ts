import type {
  Cotacao,
  CotacaoStatus,
  Orcamento,
  OrcamentoDetalheResponse,
  OrcamentoStatus,
  SolicitacaoResponse,
} from '@/types/domain'

export const SOLICITACAO_STATUS: CotacaoStatus[] = [
  'aguardando_orcamento',
  'orcamento_recebido',
  'orcamento_aceito',
  'em_contato',
  'em_execucao',
  'finalizado',
  'cancelado',
]

export const ORCAMENTO_STATUS: OrcamentoStatus[] = [
  'aguardando_aprovacao',
  'aprovado',
  'rejeitado',
  'cancelado',
]

export function normalizeSolicitacaoStatus(status: unknown, fallback: CotacaoStatus): CotacaoStatus {
  if (typeof status === 'string' && SOLICITACAO_STATUS.includes(status as CotacaoStatus)) {
    return status as CotacaoStatus
  }

  return fallback
}

export function inferLegacySolicitacaoStatus(item: { ativa?: boolean; qtd_orcamentos?: number | null }): CotacaoStatus {
  if (item.ativa === false) return 'cancelado'
  if ((item.qtd_orcamentos ?? 0) > 0) return 'orcamento_recebido'
  return 'aguardando_orcamento'
}

export function normalizeOrcamentoStatus(status: unknown): OrcamentoStatus {
  if (typeof status === 'string' && ORCAMENTO_STATUS.includes(status as OrcamentoStatus)) {
    return status as OrcamentoStatus
  }

  return 'aguardando_aprovacao'
}

export function parseValor(value: string | number): number {
  return typeof value === 'string' ? parseFloat(value) : value
}

export function mapOrcamento(orc: OrcamentoDetalheResponse, cotacaoId: string): Orcamento {
  return {
    id: orc.id,
    cotacao_id: cotacaoId,
    valor: parseValor(orc.valor),
    valor_com_desconto: orc.valor_com_desconto,
    descricao: orc.descricao || '',
    prazo_dias: orc.prazo_dias || orc.validade_dias || undefined,
    validade_dias: orc.validade_dias || orc.prazo_dias || undefined,
    status: normalizeOrcamentoStatus(orc.status),
    criado_em: orc.criado_em || '',
    provedor_nome: orc.provedor_nome || undefined,
    organizacao_id: orc.organizacao_id || undefined,
    prestador_id: orc.prestador_id,
    titulo: orc.titulo || undefined,
    numero_contrato: orc.numero_contrato,
    anexos_count: orc.anexos_count,
    detalhamento: orc.detalhamento,
    url_acompanhamento: orc.url_acompanhamento,
    organizacao: {
      id: orc.organizacao_id || orc.prestador_id || '',
      nome: orc.provedor_nome || 'Prestador',
      avaliacao_media: 0,
      total_avaliacoes: 0,
    },
  }
}

export function mapSolicitacao(item: SolicitacaoResponse): Cotacao {
  const status = normalizeSolicitacaoStatus(item.status, inferLegacySolicitacaoStatus(item))
  const qtdOrcamentos = item.qtd_orcamentos || 0

  return {
    ...item,
    status,
    criado_em: item.criada_em || '',
    titulo: item.titulo,
    orcamentos: new Array(qtdOrcamentos).fill({}) as Orcamento[],
    categoria: { id: '', valor: item.tipo_servico, slug: item.tipo_servico },
    localidade: `${item.cidade}, ${item.estado}`,
    endereco_completo: item.endereco_completo,
    metragem: item.metragem,
    numero_contrato: item.numero_contrato,
    data_finalizacao_estimada: item.data_finalizacao_estimada,
  } as Cotacao
}

export function mapSolicitacaoComOrcamentos(
  solicitacao: SolicitacaoResponse,
  orcamentos: OrcamentoDetalheResponse[],
): Cotacao {
  const status = normalizeSolicitacaoStatus(
    solicitacao.status,
    inferLegacySolicitacaoStatus({
      ativa: solicitacao.ativa,
      qtd_orcamentos: orcamentos.length,
    }),
  )

  return {
    id: solicitacao.id,
    titulo: solicitacao.titulo,
    descricao: solicitacao.descricao,
    categoria: { id: '', valor: solicitacao.tipo_servico, slug: solicitacao.tipo_servico },
    localidade: `${solicitacao.cidade}, ${solicitacao.estado}`,
    endereco_completo: solicitacao.endereco_completo,
    metragem: solicitacao.metragem,
    status,
    criado_em: solicitacao.criada_em || '',
    numero_contrato: solicitacao.numero_contrato,
    data_finalizacao_estimada: solicitacao.data_finalizacao_estimada,
    orcamentos: orcamentos.map((orc) => mapOrcamento(orc, solicitacao.id)),
  }
}
