'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface TreeIllustrationProps {
  children?: ReactNode
  className?: string
}

export function TreeIllustration({ children, className = '' }: TreeIllustrationProps) {
  return (
    <motion.div
      className={`tree-container ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      data-testid="tree-illustration"
    >
      {/* Tree trunk */}
      <div className="tree-trunk" />

      {/* Tree canopy */}
      <div className="tree-canopy" />

      {/* NFC tag mount position */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
        {children}
      </div>

      {/* Ground */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-green-900 rounded-full opacity-50" />
    </motion.div>
  )
}
