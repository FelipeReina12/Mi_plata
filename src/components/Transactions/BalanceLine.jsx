function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

// Saldo antes → después del movimiento, como en un extracto bancario.
// label: nombre de la billetera (por defecto "Saldo").
// showTotal: agrega una segunda línea con el saldo total de todas las billeteras.
function BalanceLine({ balance, label = 'Saldo', showTotal = false }) {
  if (!balance) return null

  const strong = value => (
    <span style={{ fontWeight: '600', color: value < 0 ? '#F43F5E' : 'var(--text-muted)' }}>
      {formatCOP(value)}
    </span>
  )

  return (
    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
      <div>
        {label}: {formatCOP(balance.before)} → {strong(balance.after)}
      </div>
      {showTotal && (
        <div>
          {balance.totalBefore === balance.totalAfter
            // Las transferencias solo mueven plata entre billeteras: el total no cambia
            ? <>Total: {strong(balance.totalAfter)} (sin cambio)</>
            : <>Total: {formatCOP(balance.totalBefore)} → {strong(balance.totalAfter)}</>}
        </div>
      )}
    </div>
  )
}

export default BalanceLine
