export const LAST_BACKUP_KEY = 'anotacion-last-backup-at'
/** Remind if last export older than this (ms). Default 7 days. */
export const BACKUP_REMINDER_MS = 7 * 24 * 60 * 60 * 1000

export function readLastBackupAt(): number | null {
  const raw = localStorage.getItem(LAST_BACKUP_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function markBackupExported(at = Date.now()): void {
  localStorage.setItem(LAST_BACKUP_KEY, String(at))
}

export function shouldRemindBackup(
  now = Date.now(),
  lastAt: number | null = readLastBackupAt(),
  thresholdMs = BACKUP_REMINDER_MS,
): boolean {
  if (lastAt == null) return true
  return now - lastAt >= thresholdMs
}
