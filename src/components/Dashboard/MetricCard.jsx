import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

// compact: versión más pequeña para cuando van dos tarjetas lado a lado en celular
function MetricCard({ label, value, sub, color, compact, onClick }) {
  const isClickable = Boolean(onClick)

  return (
    <motion.div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={e => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      whileHover={isClickable ? { y: -2, transition: { duration: 0.15 } } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: compact ? '14px 16px' : '16px 20px',
        height: '100%',
        cursor: isClickable ? 'pointer' : 'default',
        boxSizing: 'border-box',
        position: 'relative',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        {isClickable && (
          <ArrowUpRight size={14} color="var(--text-light)" style={{ opacity: 0.8 }} />
        )}
      </div>
      <div style={{ fontSize: compact ? '18px' : '22px', fontWeight: '600', color: color || 'var(--text-main)', overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
        {sub}
      </div>
    </motion.div>
  )
}

export default MetricCard
