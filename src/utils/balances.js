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

// Saldo de la billetera antes y después de cada movimiento, como en un extracto bancario.
// Devuelve { [id del movimiento]: { before, after } }.
// Hay que pasarle TODOS los movimientos (no los filtrados) para que el saldo sea el real.
export function walletBalances(transactions) {
  const ordered = [...transactions].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '') ||
    (a.created_at || '').localeCompare(b.created_at || '') ||
    (a.id > b.id ? 1 : a.id < b.id ? -1 : 0)
  )

  const running = {}
  const result  = {}
  for (const t of ordered) {
    const before = running[t.wallet] || 0
    const after  = before + balanceDelta(t)
    running[t.wallet] = after
    result[t.id] = { before, after }
  }
  return result
}
