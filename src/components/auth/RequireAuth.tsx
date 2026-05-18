import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

interface RequireAuthProps {
  children: React.ReactNode
  redirectTo?: string
}

export function RequireAuth({ children, redirectTo = '/auth/login' }: RequireAuthProps) {
  const { isAuthenticated, token, login, logout, user } = useAuthStore()
  const location = useLocation()

  // Sempre que não há token em memória (reload, logout forçado por erro transiente),
  // tenta renovar via cookie HTTP-only antes de decidir redirecionar para login.
  const needsRefresh = !token
  const [refreshState, setRefreshState] = useState<'pending' | 'done' | 'failed'>(
    needsRefresh ? 'pending' : 'done'
  )

  useEffect(() => {
    if (refreshState !== 'pending') return

    axios
      .post(
        `${import.meta.env.VITE_API_URL ?? 'https://arcaika-api-197035729546.southamerica-east1.run.app'}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then(({ data }) => {
        const resolvedUser =
          data.user ?? data.cliente ?? data.usuario ?? data.prestador ?? data.colaborador ?? user
        login(data.access_token, null, resolvedUser)
        setRefreshState('done')
      })
      .catch(() => {
        logout()
        setRefreshState('failed')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || refreshState === 'failed') {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (refreshState === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
