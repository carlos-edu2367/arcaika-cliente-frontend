/** Format a number as BRL currency */
export function formatarMoeda(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/** Format a date string to pt-BR locale */
export function formatarData(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', options ?? { dateStyle: 'short' }).format(date)
}

/** Format a date string to relative time (e.g. "há 2 dias") */
export function formatarDataRelativa(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `há ${diffDays} dias`
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`
  return `há ${Math.floor(diffDays / 365)} anos`
}

/** Format a phone number string */
export function formatarTelefone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return value
}

/** Truncate a string to maxLength with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
