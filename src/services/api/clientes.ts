import { api } from '@/lib/axios'
import type { User, Endereco } from '@/types/domain'

/**
 * Interface para refletir o que o backend (Pydantic) espera.
 * O backend exige 'rua', enquanto o frontend usa 'logradouro'.
 */
interface BackendEnderecoInput {
  rua: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  ponto_de_referencia?: string
  principal?: boolean
  ativo?: boolean
}

export const clientesService = {
  perfil: () => api.get<User>('/clientes/me').then(r => r.data),
  
  atualizarPerfil: (data: Partial<User>) => 
    api.put<User>('/clientes/me', data).then(r => r.data),
    
  alterarSenha: (senha_atual: string, nova_senha: string) => 
    api.post('/clientes/me/alterar-senha', { senha_atual, nova_senha }).then(r => r.data),
    
  listarEnderecos: () => 
    api.get<Endereco[]>('/clientes/me/enderecos').then(r => r.data),
  
  criarEndereco: (data: Omit<Endereco, 'id'>) => 
    api.post<Endereco>('/clientes/me/enderecos', data).then(r => r.data),

  atualizarEndereco: (id: string, data: Partial<Endereco>) => 
    api.put<Endereco>(`/clientes/me/enderecos/${id}`, data).then(r => r.data),

  deletarEndereco: (id: string) => 
    api.delete(`/clientes/me/enderecos/${id}`).then(r => r.data),
}