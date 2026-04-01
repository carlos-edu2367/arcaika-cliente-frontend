import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useArky } from '@/hooks/useArky'

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
})
