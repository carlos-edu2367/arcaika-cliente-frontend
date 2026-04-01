import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))

export const formatCurrency = (v: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(v)

export const formatDate = (date: string | Date, opts?: Intl.DateTimeFormatOptions) => {
  if (typeof date === 'string' && date.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number)
    return new Intl.DateTimeFormat('pt-BR', opts).format(new Date(y, m - 1, d))
  }
  return new Intl.DateTimeFormat('pt-BR', opts).format(typeof date === 'string' ? new Date(date) : date)
}

export const truncate = (str: string, n: number) => str.length > n ? str.slice(0, n) + '...' : str

export const generateId = () => Math.random().toString(36).slice(2, 11)

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}
