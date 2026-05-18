/** Query param names — User Contributions route only. */

export const USER_CONTRIB_NON_ADMIN_MODE = 'mode'
export const USER_CONTRIB_NON_ADMIN_START = 'start'
export const USER_CONTRIB_NON_ADMIN_END = 'end'

export const USER_CONTRIB_ADMIN_PERIODS = 'gp'
export const USER_CONTRIB_ADMIN_EXPAND = 'exp'

export const NON_ADMIN_MODE_HISTORY = 'history'
export const NON_ADMIN_MODE_ROLLING30 = 'rolling30'

const YMD = /^\d{4}-\d{2}-\d{2}$/

export function isValidYmd(value: string): boolean {
  if (!YMD.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export function isValidInclusiveRange(start: string, end: string): boolean {
  if (!isValidYmd(start) || !isValidYmd(end)) return false
  return start <= end
}

export function encodeAdminPeriodsMap(
  map: Record<string, { start: string; end: string }>
): string {
  const json = JSON.stringify(map)
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return encodeURIComponent(base64)
}

export function decodeAdminPeriodsParam(
  encoded: string | null
): Record<string, { start: string; end: string }> {
  if (!encoded) return {}
  try {
    const base64 = decodeURIComponent(encoded)
    const json = decodeURIComponent(escape(atob(base64)))
    const parsed = JSON.parse(json) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, { start: string; end: string }> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        v &&
        typeof v === 'object' &&
        'start' in v &&
        'end' in v &&
        typeof (v as { start: unknown }).start === 'string' &&
        typeof (v as { end: unknown }).end === 'string'
      ) {
        const start = (v as { start: string }).start
        const end = (v as { end: string }).end
        if (isValidInclusiveRange(start, end)) out[k] = { start, end }
      }
    }
    return out
  } catch {
    return {}
  }
}

export function parseAdminExpandedIds(exp: string | null): string[] {
  if (!exp) return []
  return exp
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function serializeAdminExpandedIds(ids: string[]): string {
  return ids.join(',')
}

export function isNonAdminMode(value: string | null): value is typeof NON_ADMIN_MODE_HISTORY | typeof NON_ADMIN_MODE_ROLLING30 {
  return value === NON_ADMIN_MODE_HISTORY || value === NON_ADMIN_MODE_ROLLING30
}
