// Billeteras que todo usuario tiene desde el inicio.
// No existen en la base de datos hasta que el usuario las guarda (por ejemplo, al poner su saldo inicial).
export const defaultWallets = [
  { name: 'Efectivo',        color: '#888780', bg: '#F1EFE8' },
  { name: 'Nequi',           color: '#1D9E75', bg: '#E1F5EE' },
  { name: 'Banco Falabella', color: '#185FA5', bg: '#E6F1FB' },
]

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
