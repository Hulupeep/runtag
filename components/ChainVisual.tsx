'use client'

import { motion } from 'framer-motion'

interface ChainVisualProps {
  count: number
  highlightLast?: boolean
  className?: string
}

export function ChainVisual({ count, highlightLast = false, className = '' }: ChainVisualProps) {
  const days = Array.from({ length: count }, (_, i) => i + 1)

  return (
    <div className={`chain-visual ${className}`} data-testid="chain-visual" data-count={count}>
      {days.map((day, index) => {
        const isLast = index === days.length - 1
        const shouldAnimate = highlightLast && isLast

        return (
          <motion.div
            key={day}
            className={`chain-day ${shouldAnimate ? 'current' : 'completed'}`}
            initial={shouldAnimate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              shouldAnimate
                ? { type: 'spring', stiffness: 500, damping: 25, delay: 0.3 }
                : { delay: index * 0.05 }
            }
            data-testid={`chain-day-${day}`}
          >
            ✓
          </motion.div>
        )
      })}
    </div>
  )
}

interface BigCheckmarkProps {
  className?: string
}

export function BigCheckmark({ className = '' }: BigCheckmarkProps) {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      data-testid="big-checkmark"
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        className="text-runtag-green"
      >
        <motion.circle
          cx="60"
          cy="60"
          r="55"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.path
          d="M35 60 L52 77 L85 44"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
      </svg>
    </motion.div>
  )
}
