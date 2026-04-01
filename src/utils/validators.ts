/** Validate Brazilian CPF */
export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i] ?? '0') * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[9] ?? '0')) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i] ?? '0') * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(digits[10] ?? '0')
}

/** Validate Brazilian CEP */
export function validarCEP(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep.trim())
}
