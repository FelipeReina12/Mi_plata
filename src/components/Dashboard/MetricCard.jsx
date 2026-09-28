// compact: versión más pequeña para cuando van dos tarjetas lado a lado en celular
function MetricCard({ label, value, sub, color, compact }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: '12px',
      padding: compact ? '14px 16px' : '16px 20px',
      height: '100%',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: compact ? '18px' : '22px', fontWeight: '600', color: color || 'var(--text-main)', overflowWrap: 'anywhere' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
        {sub}
      </div>
    </div>
  )
}

export default MetricCard
