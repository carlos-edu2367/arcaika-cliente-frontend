import { describe, expect, it } from 'vitest'
import {
  coerceServiceQuantity,
  getServiceQuantityQuestion,
  getServiceQuantityUnitLabel,
} from '@/lib/serviceQuantity'

describe('serviceQuantity helpers', () => {
  it('asks for square meters when the service unit is m2-like', () => {
    expect(getServiceQuantityQuestion('m²')).toBe('Quantos m² serão necessários?')
    expect(getServiceQuantityQuestion('m2')).toBe('Quantos m² serão necessários?')
    expect(getServiceQuantityQuestion('metro quadrado')).toBe('Quantos m² serão necessários?')
  })

  it('asks for units for unit-like or missing units', () => {
    expect(getServiceQuantityQuestion('un')).toBe('Quantas unidades serão necessárias?')
    expect(getServiceQuantityQuestion()).toBe('Quantas unidades serão necessárias?')
  })

  it('normalizes the unit label shown beside the numeric quantity', () => {
    expect(getServiceQuantityUnitLabel('m2')).toBe('m²')
    expect(getServiceQuantityUnitLabel('hora')).toBe('hora')
    expect(getServiceQuantityUnitLabel()).toBe('unidade')
  })

  it('coerces quantities to backend-safe positive integers', () => {
    expect(coerceServiceQuantity('3')).toBe(3)
    expect(coerceServiceQuantity('3.8')).toBe(3)
    expect(coerceServiceQuantity('0')).toBe(1)
    expect(coerceServiceQuantity('abc')).toBe(1)
  })
})
