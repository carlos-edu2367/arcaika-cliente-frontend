import { describe, it, expect } from 'vitest'
import type { Pedido, MensagemArky } from '@/types/domain'

/**
 * Testes de tipo para garantir que os tipos do domínio estão corretos.
 * Estes testes verificam em tempo de compilação — se o TypeScript compilar, os tipos estão certos.
 */
describe('Domain types', () => {
  it('Pedido aceita o campo avaliado como opcional', () => {
    const pedidoSemAvaliado: Pedido = {
      id: '1',
      status: 'CONCLUIDO',
      itens: [],
      endereco: {
        id: 'e1',
        logradouro: 'Rua A',
        numero: '10',
        bairro: 'Centro',
        cidade: 'Goiânia',
        estado: 'GO',
        cep: '74000-000',
        principal: true,
      },
      subtotal: 100,
      desconto: 0,
      total: 100,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    }

    const pedidoComAvaliado: Pedido = {
      ...pedidoSemAvaliado,
      avaliado: true,
    }

    expect(pedidoSemAvaliado.avaliado).toBeUndefined()
    expect(pedidoComAvaliado.avaliado).toBe(true)
  })

  it('MensagemArky tem os tipos corretos para tipo', () => {
    const msg: MensagemArky = {
      id: '1',
      conteudo: 'Olá',
      tipo: 'usuario',
      criado_em: new Date().toISOString(),
    }

    expect(msg.tipo).toBe('usuario')

    const arkyMsg: MensagemArky = { ...msg, tipo: 'arky' }
    expect(arkyMsg.tipo).toBe('arky')
  })
})
