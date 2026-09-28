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

// Una transferencia se guarda como dos movimientos:
//   salida:  "Ahorro → Nequi"            en la billetera Banco Falabella
//   entrada: "Ahorro ← Banco Falabella"  en la billetera Nequi
// Esta clave es la misma para las dos mitades, así se pueden emparejar.
function transferKey(t) {
  const desc = t.description || ''
  for (const [arrow, isOut] of [['→', true], ['->', true], ['←', false], ['<-', false]]) {
    const i = desc.lastIndexOf(arrow)
    if (i === -1) continue
    const base  = desc.slice(0, i).trim()
    const other = desc.slice(i + arrow.length).trim()
    const [from, to] = isOut ? [t.wallet, other] : [other, t.wallet]
    return { isOut, key: [t.date, t.amount, base, from, to].join('|') }
  }
  return null
}

// Ids de las transferencias que tienen sus dos mitades (salida y entrada).
// Si una mitad quedó sola (p. ej. se eliminó la otra billetera), no está en el conjunto.
export function pairedTransferIds(transactions) {
  const outs = {}
  const ins  = {}
  for (const t of transactions) {
    if (t.type !== 'transfer') continue
    const k = transferKey(t)
    if (!k) continue
    const bucket = k.isOut ? outs : ins
    ;(bucket[k.key] ||= []).push(t.id)
  }
  const paired = new Set()
  for (const key in outs) {
    const a = outs[key]
    const b = ins[key] || []
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      paired.add(a[i])
      paired.add(b[i])
    }
  }
  return paired
}

// Saldo inicial de cada billetera: { 'Nequi': 500000, ... }
// (las billeteras por defecto que no están guardadas en la base de datos empiezan en 0)
export function initialBalancesByName(wallets) {
  return Object.fromEntries((wallets || []).map(w => [w.name, w.initial_balance || 0]))
}

// Saldo antes y después de cada movimiento, como en un extracto bancario:
// el de su billetera (before/after) y el total de todas las billeteras (totalBefore/totalAfter).
// Devuelve { [id del movimiento]: { before, after, totalBefore, totalAfter } }.
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
  // Una transferencia completa solo mueve plata entre billeteras: no cambia el total
  const paired = pairedTransferIds(transactions)
  // El total arranca con la suma de los saldos iniciales (igual que el "Saldo total" del Resumen)
  let total = Object.values(initialBalances).reduce((sum, v) => sum + v, 0)
  for (const t of ordered) {
    const delta      = balanceDelta(t)
    const totalDelta = paired.has(t.id) ? 0 : delta
    const before = running[t.wallet] ?? initialBalances[t.wallet] ?? 0
    const after  = before + delta
    running[t.wallet] = after
    result[t.id] = { before, after, totalBefore: total, totalAfter: total + totalDelta }
    total += totalDelta
  }
  return result
}
