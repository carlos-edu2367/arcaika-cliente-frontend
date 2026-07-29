import { describe, expect, it } from 'vitest'
import {
  formatarDocumento,
  mascararDocumento,
  validarCNPJ,
  validarCPF,
  validarDocumento,
} from '@/utils/validators'

const CPF_VALIDO = '529.982.247-25'
const CNPJ_VALIDO = '11.222.333/0001-81'

describe('validarCNPJ', () => {
  it('aceita CNPJ válido com máscara', () => {
    expect(validarCNPJ(CNPJ_VALIDO)).toBe(true)
  })

  it('aceita CNPJ válido sem máscara', () => {
    expect(validarCNPJ('11222333000181')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(validarCNPJ('11.222.333/0001-00')).toBe(false)
  })

  it('rejeita dígitos repetidos', () => {
    expect(validarCNPJ('11111111111111')).toBe(false)
  })

  it('rejeita comprimento diferente de 14', () => {
    expect(validarCNPJ('1122233300018')).toBe(false)
  })
})

describe('validarDocumento', () => {
  it('aceita CPF válido', () => {
    expect(validarDocumento(CPF_VALIDO)).toBe(true)
  })

  it('aceita CNPJ válido', () => {
    expect(validarDocumento(CNPJ_VALIDO)).toBe(true)
  })

  it('rejeita comprimento intermediário', () => {
    expect(validarDocumento('123456789012')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(validarDocumento('')).toBe(false)
  })
})

describe('validarCPF não regrediu', () => {
  it('continua aceitando CPF válido', () => {
    expect(validarCPF(CPF_VALIDO)).toBe(true)
  })

  it('continua rejeitando CNPJ', () => {
    expect(validarCPF(CNPJ_VALIDO)).toBe(false)
  })
})

describe('mascararDocumento', () => {
  it('aplica máscara de CPF até 11 dígitos', () => {
    expect(mascararDocumento('52998224725')).toBe('529.982.247-25')
  })

  it('troca para máscara de CNPJ a partir do 12º dígito', () => {
    expect(mascararDocumento('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('trunca acima de 14 dígitos', () => {
    expect(mascararDocumento('112223330001819999')).toBe('11.222.333/0001-81')
  })

  it('máscara parcial de CPF durante a digitação', () => {
    expect(mascararDocumento('529982')).toBe('529.982')
  })
})

describe('formatarDocumento', () => {
  it('formata CPF completo', () => {
    expect(formatarDocumento('52998224725')).toBe('529.982.247-25')
  })

  it('formata CNPJ completo', () => {
    expect(formatarDocumento('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('devolve o fallback quando o valor é inutilizável', () => {
    expect(formatarDocumento(undefined)).toBe('Não informado')
  })
})
