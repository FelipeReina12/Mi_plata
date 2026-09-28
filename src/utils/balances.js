// Cuánto cambia el saldo de la billetera con este movimiento
// (misma regla que usa Billeteras: la salida de una transferencia lleva →, la entrada ←)
export function balanceDelta(t) {
  const desc = t.description || ''
  if (t.type === 'income')  return t.amount
  if (t.type === 'expense') return -t.amount
  if (t.type === 'transfer') {
    if (desc.includes('→') || desc.includes('->')) return -t.amount
    if (desc.includes('←') || desc.includes('<-')) return t.amount
  }
  return 0
}

// Saldo inicial de cada billetera: { 'Nequi': 500000, ... }
// (las billeteras por defecto que no están guardadas en la base de datos empiezan en 0)
export function initialBalancesByName(wallets) {
  return Object.fromEntries((wallets || []).map(w => [w.name, w.initial_balance || 0]))
}

// Saldo de la billetera antes y después de cada movimiento, como en un extracto bancario.
// Devuelve { [id del movimiento]: { before, after } }.
// Hay que pasarle TODOS los movimientos (no los filtrados) para que el saldo sea el real.
// initialBalances: saldo con el que empieza cada billetera antes de su primer movimiento.
export function walletBalances(transactions, initialBalances = {}) {
  const ordered = [...transactions].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '') ||
    (a.created_at || '').localeCompare(b.created_at || '') ||
    (a.id > b.id ? 1 : a.id < b.id ? -1 : 0)
  )

  const running = {}
  const result  = {}
  for (const t of ordered) {
    const before = running[t.wallet] ?? initialBalances[t.wallet] ?? 0
    const after  = before + balanceDelta(t)
    running[t.wallet] = after
    result[t.id] = { before, after }
  }
  return result
}
