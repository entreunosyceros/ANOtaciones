import type { Page } from '../db/types'

export interface BackupPayload {
  version: 1
  exportedAt: number
  pages: Page[]
}

export function buildBackup(pages: Page[]): BackupPayload {
  return {
    version: 1,
    exportedAt: Date.now(),
    pages,
  }
}

export function parseBackup(raw: unknown): Page[] {
  if (!raw || typeof raw !== 'object') throw new Error('Backup inválido')
  const data = raw as Partial<BackupPayload>
  if (!Array.isArray(data.pages)) throw new Error('Backup sin páginas')
  return data.pages.filter((p): p is Page => !!p && typeof p === 'object' && typeof p.id === 'string')
}

export function downloadBackupJson(pages: Page[], filename = 'anotaciones-backup.json') {
  const blob = new Blob([JSON.stringify(buildBackup(pages), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
