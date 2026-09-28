// Fecha de hoy según la hora del celular o computador, en formato "2026-09-27".
// No se usa toISOString() porque devuelve la fecha en UTC: en Colombia (UTC-5),
// después de las 7 p. m. daba la fecha de mañana.
export function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Mes actual en formato "2026-09"
export function currentMonthLocal() {
  return todayLocal().slice(0, 7)
}

// Para ordenar movimientos del más reciente al más antiguo: por fecha y, el mismo día, por hora de registro.
// Uso: [...transactions].sort(byDateDesc)
export function byDateDesc(a, b) {
  return (b.date || '').localeCompare(a.date || '') ||
         (b.created_at || '').localeCompare(a.created_at || '')
}
