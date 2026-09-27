'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TIMING } from '@/lib/constants'

interface NFCTagProps {
  onTap: () => void
  glowing?: boolean
  disabled?: boolean
  label?: string
}

export function NFCTag({ onTap, glowing = false, disabled = false, label = 'NFC Tag' }: NFCTagProps) {
  const [ripples, setRipples] = useState<number[]>([])
  const [feedbackTime, setFeedbackTime] = useState<number | null>(null)

  const handleTap = useCallback(() => {
    if (disabled) return

    const startTime = performance.now()
    const rippleId = Date.now()
    setRipples(prev => [...prev, rippleId])

    // Measure feedback time for INV-D5 compliance
    requestAnimationFrame(() => {
      const elapsed = performance.now() - startTime
      setFeedbackTime(elapsed)
    })

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(id => id !== rippleId))
    }, TIMING.nfcRipple)

    onTap()
  }, [disabled, onTap])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleTap()
    }
  }, [handleTap])

  return (
    <motion.button
      className="nfc-tag"
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      data-glowing={glowing}
      data-testid="nfc-tag"
      data-feedback-time={feedbackTime}
      disabled={disabled}
      aria-label={label}
      role="button"
      tabIndex={0}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* NFC Icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-runtag-black"
      >
        <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
        <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
        <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
        <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
      </svg>

      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(id => (
          <motion.span
            key={id}
            className="nfc-ripple"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TIMING.nfcRipple / 1000, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  )
}
