export const fmtNum = (v) =>
  v != null ? v.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'

export const fmtMoney = (v) =>
  v != null ? `$${v.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'

export const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const fmtMonth = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })
}

export const todayStr = () => new Date().toISOString().split('T')[0]

export const currentMonth = () => new Date().toISOString().slice(0, 7)

export const formatKB = (bytes) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
