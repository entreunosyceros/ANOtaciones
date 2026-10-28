import type { DbProperty } from '../db/types'

const PROP_REF = /prop\s*\(\s*["']([^"']+)["']\s*\)/gi

export function extractFormulaDeps(expression: string): string[] {
  const deps = new Set<string>()
  let m: RegExpExecArray | null
  const re = new RegExp(PROP_REF.source, 'gi')
  while ((m = re.exec(expression))) {
    if (m[1]) deps.add(m[1])
  }
  return [...deps]
}

/** Build adjacency: formulaColId -> dependency names (by property name). */
export function buildFormulaGraph(schema: DbProperty[]): Map<string, string[]> {
  const byName = new Map(schema.map((p) => [p.name, p.id]))
  const graph = new Map<string, string[]>()
  for (const prop of schema) {
    if (prop.type !== 'formula' || !prop.formula) continue
    const depNames = extractFormulaDeps(prop.formula)
    const depIds = depNames
      .map((n) => byName.get(n))
      .filter((id): id is string => !!id)
    graph.set(prop.id, depIds)
  }
  return graph
}

export function detectFormulaCycles(schema: DbProperty[]): string[] | null {
  const graph = buildFormulaGraph(schema)
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []

  const dfs = (id: string): boolean => {
    if (visiting.has(id)) {
      stack.push(id)
      return true
    }
    if (visited.has(id)) return false
    visiting.add(id)
    for (const dep of graph.get(id) ?? []) {
      if (dfs(dep)) {
        stack.push(id)
        return true
      }
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }

  for (const id of graph.keys()) {
    if (dfs(id)) return stack.reverse()
  }
  return null
}

/** Topological order of formula property ids; throws if cycle. */
export function formulaEvalOrder(schema: DbProperty[]): string[] {
  const cycle = detectFormulaCycles(schema)
  if (cycle) throw new Error(`Ciclo en fórmulas: ${cycle.join(' → ')}`)
  const graph = buildFormulaGraph(schema)
  const order: string[] = []
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visited.has(id)) return
    visited.add(id)
    for (const dep of graph.get(id) ?? []) visit(dep)
    if (graph.has(id)) order.push(id)
  }
  for (const id of graph.keys()) visit(id)
  return order
}

/**
 * Minimal safe evaluator: prop("Name"), numbers, + - * /, if(cond,a,b), string concat via +.
 * Names resolve from row values keyed by property name.
 */
export function evaluateFormula(
  expression: string,
  valuesByName: Record<string, string | number | boolean | null>,
): string | number | boolean | null {
  const expr = expression.trim()
  if (!expr) return null

  const replaced = expr.replace(/prop\s*\(\s*["']([^"']+)["']\s*\)/gi, (_, name: string) => {
    const v = valuesByName[name]
    if (typeof v === 'string') return JSON.stringify(v)
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    if (v == null) return 'null'
    return String(v)
  })

  // if(cond, a, b) — simple single-level
  const ifMatch = replaced.match(/^if\s*\((.+)\)$/i)
  if (ifMatch) {
    const inner = ifMatch[1]!
    const parts = splitArgs(inner)
    if (parts.length === 3) {
      const cond = evaluateFormula(parts[0]!, valuesByName)
      return cond ? evaluateFormula(parts[1]!, valuesByName) : evaluateFormula(parts[2]!, valuesByName)
    }
  }

  if (!/^[\d\s.+\-*/()truefalsenull"']+$/i.test(replaced.replace(/"[^"]*"/g, '""'))) {
    // Allow only safe tokens after prop substitution
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`"use strict"; return (${replaced});`)
      const result = fn()
      if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
        return result
      }
      return result == null ? null : String(result)
    } catch {
      return null
    }
  }

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${replaced});`)
    const result = fn()
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
      return result
    }
    return result == null ? null : String(result)
  } catch {
    return null
  }
}

function splitArgs(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}
