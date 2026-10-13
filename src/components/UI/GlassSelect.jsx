import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Componente GlassSelect: selector desplegable con estilo Liquid Glass
 * que respeta el modo oscuro y modo claro con alto contraste y desenfoque esmerilado.
 */
export default function GlassSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  style = {},
  onOpenChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // Normalizar opciones (acepta array de strings o de objetos { value, label })
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.name ?? '',
        label: opt.label ?? opt.name ?? opt.value ?? '',
      }
    }
    return { value: opt, label: opt }
  })

  const selectedIndex = normalizedOptions.findIndex(opt => opt.value === value)
  const selectedOption = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : null
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        if (onOpenChange) onOpenChange(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])


  // Scroll automático hacia el elemento resaltado
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-glass-option]')
      const targetItem = items[highlightedIndex]
      if (targetItem) {
        targetItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const toggleOpen = () => {
    if (disabled) return
    setIsOpen(prev => {
      const next = !prev
      if (next) {
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
      }
      if (onOpenChange) onOpenChange(next)
      return next
    })
  }

  const handleSelect = (val) => {
    if (onChange) {
      onChange(val)
    }
    setIsOpen(false)
    if (onOpenChange) onOpenChange(false)
  }

  const handleKeyDown = (e) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
        if (onOpenChange) onOpenChange(true)
      }
      return
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false)
      if (onOpenChange) onOpenChange(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev + 1) % normalizedOptions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev - 1 + normalizedOptions.length) % normalizedOptions.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        handleSelect(normalizedOptions[highlightedIndex].value)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        zIndex: isOpen ? 100 : 1,
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '14px',
          border: isOpen ? '1px solid rgba(124, 92, 255, 0.6)' : '1px solid var(--border-light)',
          borderRadius: '8px',
          background: 'var(--bg-input)',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          boxShadow: isOpen ? '0 0 0 2px rgba(124, 92, 255, 0.2)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          outline: 'none',
          userSelect: 'none',
          minHeight: '37px',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: '8px',
            color: selectedOption ? 'var(--text-main)' : 'var(--text-light)',
          }}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="liquid-glass-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 5px)',
              left: 0,
              right: 0,
              background: 'var(--bg-dropdown)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              boxShadow: 'inset 0 1px 0 var(--glass-edge), 0 16px 36px rgba(0, 0, 0, 0.45), var(--glass-shadow)',
              padding: '5px',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 200,
              boxSizing: 'border-box',
            }}
          >
            {normalizedOptions.map((opt, idx) => {
              const isSelected = opt.value === value
              const isHighlighted = idx === highlightedIndex
              return (
                <div
                  key={opt.value}
                  data-glass-option
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? '#fff' : 'var(--text-main)',
                    background: isSelected
                      ? '#7C5CFF'
                      : isHighlighted
                        ? 'rgba(124, 92, 255, 0.14)'
                        : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.12s ease, color 0.12s ease',
                    userSelect: 'none',
                    margin: '2px 0',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check size={14} color="#fff" style={{ flexShrink: 0, marginLeft: '6px' }} />
                  )}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
