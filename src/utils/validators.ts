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

/** Validate Brazilian CNPJ */
export function validarCNPJ(cnpj: string): boolean {
  const digits = (cnpj || '').replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const calcularDigito = (parcial: string, pesos: number[]): number => {
    const soma = pesos.reduce(
      (acc, peso, i) => acc + parseInt(parcial[i] ?? '0') * peso,
      0,
    )
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const digito1 = calcularDigito(digits.slice(0, 12), pesos1)
  if (digito1 !== parseInt(digits[12] ?? '0')) return false

  const pesos2 = [6, ...pesos1]
  const digito2 = calcularDigito(digits.slice(0, 13), pesos2)
  return digito2 === parseInt(digits[13] ?? '0')
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) */
export function validarDocumento(valor: string): boolean {
  const digits = (valor || '').replace(/\D/g, '')
  if (digits.length === 11) return validarCPF(digits)
  if (digits.length === 14) return validarCNPJ(digits)
  return false
}

/** Máscara progressiva: CPF até 11 dígitos, CNPJ a partir do 12º */
export function mascararDocumento(valor: string): string {
  const digits = (valor || '').replace(/\D/g, '').slice(0, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** Formata um documento já completo para exibição */
export function formatarDocumento(
  valor?: string,
  fallback = 'Não informado',
): string {
  const digits = (valor || '').replace(/\D/g, '')
  if (digits.length !== 11 && digits.length !== 14) return valor || fallback
  return mascararDocumento(digits)
}
