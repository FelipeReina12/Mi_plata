function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: '12px',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: '600', color: color || 'var(--text-main)' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
        {sub}
      </div>
    </div>
  )
}

export default MetricCard