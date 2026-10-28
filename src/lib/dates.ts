/** Fecha/hora en locale español (España). Almacenamiento interno: ISO YYYY-MM-DD. */

export const ES_LOCALE = 'es-ES'

/** Día civil local → YYYY-MM-DD (no usar toISOString: desplaza el día en UTC). */
export function toIsoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parsea YYYY-MM-DD como mediodía local (evita desfases de zona). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y!, m! - 1, d!, 12, 0, 0)
}

/** Visualización corta: 28/10/2026 */
export function formatDateEs(isoOrDate: string | Date | null | undefined): string {
  if (isoOrDate == null || isoOrDate === '') return ''
  const d = typeof isoOrDate === 'string' ? parseIsoDate(isoOrDate) : isoOrDate
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(ES_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Visualización larga: miércoles, 28 de octubre de 2026 */
export function formatDateLongEs(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? parseIsoDate(isoOrDate) : isoOrDate
  return d.toLocaleDateString(ES_LOCALE, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Mes y año: octubre de 2026 */
export function formatMonthYearEs(d: Date): string {
  return d.toLocaleDateString(ES_LOCALE, { month: 'long', year: 'numeric' })
}

/** Fecha y hora local: 28/10/2026, 22:53 */
export function formatDateTimeEs(ms: number): string {
  return new Date(ms).toLocaleString(ES_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
