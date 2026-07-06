function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #eee',
      borderRadius: '12px',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: '600', color: color || '#333' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
        {sub}
      </div>
    </div>
  )
}

export default MetricCard