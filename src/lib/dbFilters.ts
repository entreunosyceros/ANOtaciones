import type { FilterCondition, FilterNode, Page, PropertyValue, SortSpec } from '../db/types'
import { displayPropertyValue } from './propertyTypes'

function isFilterNode(x: FilterCondition | FilterNode): x is FilterNode {
  return 'conditions' in x && (x.op === 'and' || x.op === 'or')
}

function matchCondition(page: Page, cond: FilterCondition): boolean {
  const raw = page.properties[cond.propId] as PropertyValue | undefined
  switch (cond.op) {
    case 'is_empty':
      return (
        raw == null ||
        raw === '' ||
        (Array.isArray(raw) && raw.length === 0)
      )
    case 'is_not_empty':
      return !(
        raw == null ||
        raw === '' ||
        (Array.isArray(raw) && raw.length === 0)
      )
    case 'contains': {
      const needle = displayPropertyValue(cond.value ?? '').toLowerCase()
      return displayPropertyValue(raw ?? null).toLowerCase().includes(needle)
    }
    case 'eq':
      return JSON.stringify(raw ?? null) === JSON.stringify(cond.value ?? null)
    case 'neq':
      return JSON.stringify(raw ?? null) !== JSON.stringify(cond.value ?? null)
    case 'gt':
      return Number(raw) > Number(cond.value)
    case 'lt':
      return Number(raw) < Number(cond.value)
    default:
      return true
  }
}

export function matchFilter(page: Page, node: FilterNode | null | undefined): boolean {
  if (!node || !node.conditions.length) return true
  const results = node.conditions.map((c) =>
    isFilterNode(c) ? matchFilter(page, c) : matchCondition(page, c),
  )
  return node.op === 'and' ? results.every(Boolean) : results.some(Boolean)
}

export function applyDbView(
  rows: Page[],
  opts: { filters?: FilterNode | null; sorts?: SortSpec[]; groupBy?: string | null },
): { rows: Page[]; groups: Map<string, Page[]> | null } {
  let filtered = rows.filter((r) => matchFilter(r, opts.filters))
  const sorts = opts.sorts ?? []
  if (sorts.length) {
    filtered = filtered.slice().sort((a, b) => {
      for (const s of sorts) {
        const av = a.properties[s.propId]
        const bv = b.properties[s.propId]
        const as = displayPropertyValue(av ?? null)
        const bs = displayPropertyValue(bv ?? null)
        const cmp = as.localeCompare(bs, undefined, { numeric: true })
        if (cmp !== 0) return s.dir === 'desc' ? -cmp : cmp
      }
      return a.order - b.order
    })
  }

  if (!opts.groupBy) return { rows: filtered, groups: null }
  const groups = new Map<string, Page[]>()
  for (const row of filtered) {
    const key = displayPropertyValue(row.properties[opts.groupBy!] ?? null) || '(vacío)'
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }
  return { rows: filtered, groups }
}
