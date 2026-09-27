'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { CHAIN } from '@/lib/constants'

interface IPhoneMockupProps {
  children: ReactNode
  className?: string
}

export function IPhoneMockup({ children, className = '' }: IPhoneMockupProps) {
  return (
    <motion.div
      className={`iphone-mockup ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      data-testid="iphone-mockup"
    >
      {/* Dynamic Island / Notch */}
      <div className="iphone-notch" />

      {/* Screen content */}
      <div className="iphone-screen">
        {children}
      </div>

      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full" />
    </motion.div>
  )
}

interface PhoneScreenProps {
  status?: string
  subtitle?: string
  chainCount?: number
  showChain?: boolean
}

export function PhoneScreen({ status, subtitle, chainCount = CHAIN.initial, showChain = true }: PhoneScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      {status && (
        <motion.div
          className="status-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {status}
        </motion.div>
      )}

      {subtitle && (
        <p className="font-body text-sm text-runtag-gray">{subtitle}</p>
      )}

      {showChain && (
        <div className="mt-4">
          <p className="font-body text-xs text-runtag-gray mb-2 text-center">
            {chainCount}-day chain
          </p>
          <div className="chain-visual">
            {Array.from({ length: Math.min(chainCount, 5) }).map((_, i) => (
              <motion.div
                key={i}
                className="chain-day completed"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                ✓
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
