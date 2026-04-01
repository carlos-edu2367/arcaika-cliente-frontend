import { api } from '@/lib/axios'
import type { Carrinho } from '@/types/domain'

export const carrinhoService = {
  obter: () => api.get<Carrinho>('/carrinho/').then(r => r.data),
  limpar: () => api.delete('/carrinho/').then(r => r.data),
  adicionarServico: (id: string, quantidade = 1, produtos_ids: string[] = []) => 
    api.post('/carrinho/servicos', { servico_id: id, quantidade, produtos_ids }).then(r => r.data),
  removerServico: (id: string) => api.delete(`/carrinho/servicos/${id}`).then(r => r.data),
  atualizarServico: (id: string, nova_quantidade: number) => api.put(`/carrinho/servicos/${id}/quantidade`, { nova_quantidade }).then(r => r.data),
  adicionarItem: (id: string, quantidade = 1) => api.post('/carrinho/itens', { item_id: id, quantidade }).then(r => r.data),
  removerItem: (id: string) => api.delete(`/carrinho/itens/${id}`).then(r => r.data),
  adicionarProduto: (id: string, quantidade = 1) => api.post('/carrinho/produtos', { produto_id: id, quantidade }).then(r => r.data),
  removerProduto: (id: string) => api.delete(`/carrinho/produtos/${id}`).then(r => r.data),
  atualizarProduto: (id: string, nova_quantidade: number) => api.put(`/carrinho/produtos/${id}/quantidade`, { nova_quantidade }).then(r => r.data),
  aplicarCupom: (codigo: string) => api.post('/carrinho/cupom', { codigo }).then(r => r.data),
  removerCupom: () => api.delete('/carrinho/cupom').then(r => r.data),
}
