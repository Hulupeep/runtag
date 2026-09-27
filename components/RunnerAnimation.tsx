'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TIMING } from '@/lib/constants'

interface RunnerAnimationProps {
  onComplete?: () => void
  className?: string
}

export function RunnerAnimation({ onComplete, className = '' }: RunnerAnimationProps) {
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRunning(false)
      onComplete?.()
    }, TIMING.runAnimation)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={`runner-path ${className}`} data-testid="runner-animation">
      {/* Dotted path */}
      <div className="runner-dotted-path" />

      {/* Runner silhouette */}
      <motion.div
        className="runner-silhouette"
        initial={{ left: '10%' }}
        animate={{ left: isRunning ? '90%' : '90%' }}
        transition={{ duration: TIMING.runAnimation / 1000, ease: 'linear' }}
      >
        <RunnerSVG />
      </motion.div>

      {/* Trees in background */}
      <div className="absolute inset-0 pointer-events-none">
        {[15, 35, 55, 75].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0"
            style={{ left: `${pos}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: i * 0.2 }}
          >
            <SmallTree />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function RunnerSVG() {
  return (
    <svg
      width="32"
      height="48"
      viewBox="0 0 32 48"
      fill="currentColor"
      className="text-runtag-white"
    >
      {/* Head */}
      <circle cx="16" cy="6" r="5" />
      {/* Body */}
      <path d="M16 11 L16 28" strokeWidth="3" stroke="currentColor" />
      {/* Arms (running pose) */}
      <motion.path
        d="M16 16 L8 22 M16 16 L24 12"
        strokeWidth="3"
        stroke="currentColor"
        fill="none"
        animate={{ d: ['M16 16 L8 22 M16 16 L24 12', 'M16 16 L8 12 M16 16 L24 22'] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
      />
      {/* Legs (running pose) */}
      <motion.path
        d="M16 28 L10 42 M16 28 L22 38"
        strokeWidth="3"
        stroke="currentColor"
        fill="none"
        animate={{ d: ['M16 28 L10 42 M16 28 L22 38', 'M16 28 L10 38 M16 28 L22 42'] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
      />
    </svg>
  )
}

function SmallTree() {
  return (
    <svg width="24" height="40" viewBox="0 0 24 40" className="text-green-900">
      <rect x="10" y="28" width="4" height="12" fill="#92400e" />
      <ellipse cx="12" cy="18" rx="10" ry="14" fill="currentColor" />
    </svg>
  )
}
