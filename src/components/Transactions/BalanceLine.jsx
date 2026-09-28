function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

// Saldo de la billetera antes → después del movimiento, como en un extracto bancario
function BalanceLine({ balance }) {
  if (!balance) return null

  return (
    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
      Saldo: {formatCOP(balance.before)} →{' '}
      <span style={{ fontWeight: '600', color: balance.after < 0 ? '#D85A30' : 'var(--text-muted)' }}>
        {formatCOP(balance.after)}
      </span>
    </div>
  )
}

export default BalanceLine
