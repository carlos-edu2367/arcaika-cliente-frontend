import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useArky } from '@/hooks/useArky'
import { assistenteService } from '@/services/api/assistente'

// Mock do serviço de assistente
vi.mock('@/services/api/assistente', () => ({
  assistenteService: {
    chat: vi.fn().mockResolvedValue({
      mensagem: {
        id: 'arky-1',
        conteudo: 'Resposta do Arky',
        tipo: 'arky',
        criado_em: new Date().toISOString(),
      },
    }),
  },
}))

describe('useArky', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(assistenteService.chat).mockClear()
    vi.mocked(assistenteService.chat).mockResolvedValue({
      resposta: 'Resposta do Arky',
      mensagens_processadas: 1,
      modelo_utilizado: 'modelo-teste',
      tool_calls: [],
    })
  })

  it('inicia com lista de mensagens vazia (sem histórico)', () => {
    const { result } = renderHook(() => useArky())
    expect(result.current.mensagens).toHaveLength(0)
  })

  it('persiste mensagens no sessionStorage ao enviar', async () => {
    const { result } = renderHook(() => useArky())

    await act(async () => {
      await result.current.enviar('Olá Arky')
    })

    const stored = JSON.parse(sessionStorage.getItem('arcaika_arky_history') ?? '[]')
    expect(stored.length).toBeGreaterThan(0)
    expect(stored[0].conteudo).toBe('Olá Arky')
    expect(stored[0].tipo).toBe('usuario')
  })

  it('restaura o histórico do sessionStorage ao reinicializar', async () => {
    // Popula o sessionStorage diretamente
    const msgs = [
      { id: '1', conteudo: 'oi', tipo: 'usuario', criado_em: new Date().toISOString() },
      { id: '2', conteudo: 'olá!', tipo: 'arky', criado_em: new Date().toISOString() },
    ]
    sessionStorage.setItem('arcaika_arky_history', JSON.stringify(msgs))

    const { result } = renderHook(() => useArky())
    expect(result.current.mensagens).toHaveLength(2)
    expect(result.current.mensagens[0].conteudo).toBe('oi')
  })

  it('limpar() remove mensagens do state e do sessionStorage', async () => {
    const { result } = renderHook(() => useArky())

    await act(async () => {
      await result.current.enviar('Teste')
    })

    act(() => {
      result.current.limpar()
    })

    expect(result.current.mensagens).toHaveLength(0)
    expect(sessionStorage.getItem('arcaika_arky_history')).toBeNull()
  })

  it('respeita o limite de 50 mensagens no sessionStorage', async () => {
    // Preenche com 49 mensagens
    const msgs = Array.from({ length: 49 }, (_, i) => ({
      id: String(i),
      conteudo: `msg ${i}`,
      tipo: i % 2 === 0 ? 'usuario' : 'arky',
      criado_em: new Date().toISOString(),
    }))
    sessionStorage.setItem('arcaika_arky_history', JSON.stringify(msgs))

    const { result } = renderHook(() => useArky())

    await act(async () => {
      await result.current.enviar('msg final')
    })

    const stored = JSON.parse(sessionStorage.getItem('arcaika_arky_history') ?? '[]')
    expect(stored.length).toBeLessThanOrEqual(50)
  })

  it('cria mensagem da Arky a partir de resposta e preserva tool_calls', async () => {
    vi.mocked(assistenteService.chat).mockResolvedValueOnce({
      resposta: 'Encontrei seus pedidos recentes.',
      mensagens_processadas: 1,
      modelo_utilizado: 'gemini-2.5-flash',
      tool_calls: [
        {
          nome: 'buscar_pedidos_cliente',
          input: { limite: 5 },
          output_resumido: { total: 2 },
          status: 'sucesso',
          duracao_ms: 42,
        },
      ],
    })

    const { result } = renderHook(() => useArky())

    await act(async () => {
      await result.current.enviar('Meus pedidos')
    })

    const arkyMsg = result.current.mensagens.find((m) => m.tipo === 'arky')
    expect(arkyMsg?.conteudo).toBe('Encontrei seus pedidos recentes.')
    expect(arkyMsg?.tool_calls).toHaveLength(1)
    expect(arkyMsg?.tool_calls?.[0].nome).toBe('buscar_pedidos_cliente')

    const stored = JSON.parse(sessionStorage.getItem('arcaika_arky_history') ?? '[]')
    expect(stored.at(-1).tool_calls).toHaveLength(1)
  })

  it('envia ao backend apenas os ultimos 10 turnos com papeis usuario e assistente', async () => {
    const msgs = Array.from({ length: 24 }, (_, i) => ({
      id: String(i),
      conteudo: `msg ${i}`,
      tipo: i % 2 === 0 ? 'usuario' : 'arky',
      criado_em: new Date().toISOString(),
    }))
    sessionStorage.setItem('arcaika_arky_history', JSON.stringify(msgs))

    const { result } = renderHook(() => useArky())

    await act(async () => {
      await result.current.enviar('continuar')
    })

    const historico = vi.mocked(assistenteService.chat).mock.calls[0][1]
    expect(historico).toHaveLength(20)
    expect(historico?.[0]).toEqual({ papel: 'usuario', conteudo: 'msg 4' })
    expect(historico?.at(-1)).toEqual({ papel: 'assistente', conteudo: 'msg 23' })
    expect(new Set(historico?.map((m) => m.papel))).toEqual(new Set(['usuario', 'assistente']))
  })
})
