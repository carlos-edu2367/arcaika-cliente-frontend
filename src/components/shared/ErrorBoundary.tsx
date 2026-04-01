import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Em produção, enviar para serviço de monitoramento (ex: Sentry)
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 p-8">
          <p className="text-5xl">⚠️</p>
          <h2 className="text-xl font-bold text-neutral-800">Algo deu errado</h2>
          <p className="text-sm text-neutral-500 max-w-sm">
            Ocorreu um erro inesperado nesta página. Tente recarregar ou voltar ao início.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="text-sm font-semibold text-primary-600 border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-light transition-colors"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="text-sm font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-colors"
            >
              Voltar ao início
            </a>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="text-left mt-4 w-full max-w-lg">
              <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-600">
                Detalhes do erro (dev)
              </summary>
              <pre className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg mt-2 overflow-auto max-h-48">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
