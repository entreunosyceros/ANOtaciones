import { RECENTS_KEY, RECENTS_MAX } from './constants'

export function readRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export function pushRecentId(id: string): string[] {
  const next = [id, ...readRecentIds().filter((x) => x !== id)].slice(0, RECENTS_MAX)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  return next
}
