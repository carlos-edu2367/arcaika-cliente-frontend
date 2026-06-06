import type { User } from '@/types/domain'

type AuthLikeResponse = {
  user?: User | null
  cliente?: User | null
  usuario?: User | null
  prestador?: User | null
  colaborador?: User | null
  usuario_id?: string | null
  nome_completo?: string | null
  email?: string | null
}

export function resolveAuthUser(data: AuthLikeResponse, fallback: User | null): User | null {
  const nestedUser =
    data.user ||
    data.cliente ||
    data.usuario ||
    data.prestador ||
    data.colaborador

  if (nestedUser) return nestedUser

  if (data.usuario_id && data.nome_completo) {
    return {
      id: data.usuario_id,
      nome: data.nome_completo,
      email: data.email ?? '',
    }
  }

  return fallback
}
