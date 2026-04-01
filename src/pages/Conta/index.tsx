import { Navigate } from 'react-router-dom'

// GAP-014: redireciona /conta → /conta/perfil (página principal da área do usuário)
export default function ContaIndex() {
  return <Navigate to="/conta/perfil" replace />
}
