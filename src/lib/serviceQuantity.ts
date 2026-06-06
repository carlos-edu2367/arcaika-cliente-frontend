const SQUARE_METER_ALIASES = ['m2', 'm²', 'metro quadrado', 'metros quadrados']

function normalizeUnit(unit?: string) {
  return (unit ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/²/g, '2')
}

export function isSquareMeterUnit(unit?: string) {
  const normalized = normalizeUnit(unit)
  return SQUARE_METER_ALIASES.some((alias) => normalized.includes(normalizeUnit(alias)))
}

export function getServiceQuantityUnitLabel(unit?: string) {
  if (isSquareMeterUnit(unit)) return 'm²'
  const trimmed = unit?.trim()
  return trimmed || 'unidade'
}

export function getServiceQuantityQuestion(unit?: string) {
  if (isSquareMeterUnit(unit)) return 'Quantos m² serão necessários?'
  return 'Quantas unidades serão necessárias?'
}

export function coerceServiceQuantity(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(1, Math.floor(parsed))
}
