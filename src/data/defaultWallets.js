// Billeteras que todo usuario tiene desde el inicio.
// No existen en la base de datos hasta que el usuario las guarda (por ejemplo, al poner su saldo inicial).
export const defaultWallets = [
  { name: 'Efectivo',        color: '#8B8FA8', bg: '#8B8FA826' },
  { name: 'Nequi',           color: '#0FA971', bg: '#0FA97126' },
  { name: 'Banco Falabella', color: '#3B82F6', bg: '#3B82F626' },
]

// Las billeteras guardadas en la base de datos conservan el color con el que se crearon.
// Los colores anteriores (más apagados) se muestran con su versión viva.
const vividColors = {
  '#888780': '#8B8FA8',
  '#1D9E75': '#0FA971',
  '#185FA5': '#3B82F6',
  '#D85A30': '#F43F5E',
  '#7F77DD': '#7C5CFF',
  '#EF9F27': '#F59E0B',
}

// Color del ícono de una billetera
export function walletColor(color) {
  return vividColors[(color || '').toUpperCase()] || color || '#8B8FA8'
}

// Fondo del ícono: el mismo color translúcido, así se ve bien en modo claro y oscuro
export function walletTint(color) {
  const c = walletColor(color)
  return /^#[0-9a-f]{6}$/i.test(c) ? c + '26' : 'var(--border-dim)'
}

// Billeteras por defecto primero (usando la guardada si ya existe) y después las que creó el usuario.
// Las eliminadas quedan guardadas con hidden = true para que una billetera por defecto no vuelva a aparecer.
export function mergeWithDefaults(walletRows) {
  const rows    = walletRows || []
  const visible = rows.filter(w => !w.hidden)
  const hidden  = rows.filter(w => w.hidden).map(w => w.name)
  const defaultNames = defaultWallets.map(w => w.name)

  const defaults = defaultWallets
    .map(d => visible.find(w => w.name === d.name) || (hidden.includes(d.name) ? null : d))
    .filter(Boolean)
  const custom = visible.filter(w => !defaultNames.includes(w.name))
  return [...defaults, ...custom]
}

// Reemplaza en la lista las billeteras que se acaban de guardar en la base de datos
export function replaceSaved(wallets, savedRows) {
  return wallets.map(w => savedRows.find(r => r.name === w.name) || w)
}
