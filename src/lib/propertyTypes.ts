import type { DbProperty, DbPropertyType, PropertyValue } from '../db/types'

export function coercePropertyValue(type: DbPropertyType, raw: unknown): PropertyValue {
  switch (type) {
    case 'checkbox':
      return Boolean(raw)
    case 'number': {
      if (raw == null || raw === '') return null
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(n) ? n : null
    }
    case 'date': {
      if (typeof raw !== 'string' || !raw) return null
      return raw.slice(0, 10)
    }
    case 'multi_select':
    case 'relation': {
      if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string')
      if (typeof raw === 'string' && raw) return [raw]
      return []
    }
    case 'formula':
      return typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean'
        ? raw
        : null
    case 'select':
    case 'text':
    default:
      if (raw == null) return ''
      return String(raw)
  }
}

export function emptyValueForType(type: DbPropertyType): PropertyValue {
  switch (type) {
    case 'checkbox':
      return false
    case 'number':
    case 'date':
    case 'formula':
      return null
    case 'multi_select':
    case 'relation':
      return []
    default:
      return ''
  }
}

export function displayPropertyValue(value: PropertyValue): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export function isValidPropertyType(type: string): type is DbPropertyType {
  return (
    type === 'text' ||
    type === 'select' ||
    type === 'number' ||
    type === 'checkbox' ||
    type === 'date' ||
    type === 'multi_select' ||
    type === 'relation' ||
    type === 'formula'
  )
}

export function normalizeSchemaProp(prop: DbProperty): DbProperty {
  return {
    ...prop,
    type: isValidPropertyType(prop.type) ? prop.type : 'text',
    options: prop.options ?? [],
  }
}
