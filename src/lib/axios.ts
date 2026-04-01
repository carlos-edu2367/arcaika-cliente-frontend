import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 8_000,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arcaika_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ detail?: string | Array<{ msg: string; loc: string[] }> }>) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('arcaika_refresh_token')

      if (!refreshToken) {
        useAuthStore.getState().logout()
        window.dispatchEvent(new CustomEvent('arcaika:unauthorized'))
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/auth/refresh`,
          { refresh_token: refreshToken }
        )

        const currentUser = useAuthStore.getState().user
        // Se a resposta vier com user, usa, senão mantém o atual
        const incomingUser =
          data.user ||
          data.cliente ||
          data.usuario ||
          data.prestador ||
          data.colaborador ||
          currentUser

        useAuthStore.getState().login(data.access_token, data.refresh_token, incomingUser)

        processQueue(null, data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.dispatchEvent(new CustomEvent('arcaika:unauthorized'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // API-06: Parseia erros 422 do FastAPI (Unprocessable Entity) em mensagem legível
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail
      if (Array.isArray(detail) && detail.length > 0) {
        // Extrai mensagens de cada campo e adiciona ao error para uso nos handlers
        const msg = detail.map((e: any) => e.msg).join('; ')
        ;(error as AxiosError & { userMessage?: string }).userMessage = msg
      } else if (typeof detail === 'string') {
        ;(error as AxiosError & { userMessage?: string }).userMessage = detail
      }
    }

    // API-14: rate limit — erro amigável
    if (error.response?.status === 429) {
      ;(error as AxiosError & { userMessage?: string }).userMessage =
        'Muitas requisições. Aguarde um momento antes de tentar novamente.'
    }

    return Promise.reject(error)
  },
)
