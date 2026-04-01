import { api } from '@/lib/axios'
import type { User } from '@/types/domain'

export interface LoginInput { 
  email: string
  senha: string 
}

export interface RegisterInput {
  nome: string
  sobrenome: string
  email: string
  senha: string
  cpf: string       
  telefone: string  
}

export interface AuthResponse { 
  access_token: string
  refresh_token: string
  token_type: string
  // Campos achatados (Flat) enviados pelo seu backend
  usuario_id?: string
  nome_completo?: string
  tipo_usuario?: string
  // Possíveis objetos aninhados (Retrocompatibilidade)
  user?: User
  cliente?: User
  prestador?: User
  colaborador?: User
  usuario?: User
}

export const authService = {
  login: (data: LoginInput) =>
    api.post<AuthResponse>('/auth/cliente/login', data).then(r => r.data),
  register: (data: RegisterInput) =>
    api.post<AuthResponse>('/auth/cliente', data).then(r => r.data),
  refresh: (refresh_token: string) =>
    api.post<AuthResponse>('/auth/refresh', { refresh_token }).then(r => r.data),
}