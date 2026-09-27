'use client'

import { motion } from 'framer-motion'
import { COPY } from '@/lib/constants'
import { RunnerAnimation } from '@/components/RunnerAnimation'

interface Scene4RunProps {
  onComplete: () => void
}

export function Scene4Run({ onComplete }: Scene4RunProps) {
  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-4"
    >
      <div className="flex flex-col items-center gap-12 w-full max-w-2xl">
        <motion.p
          className="narrative"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {COPY.scene4.narrative}
        </motion.p>

        <RunnerAnimation onComplete={onComplete} className="w-full" />

        <motion.p
          className="subline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {COPY.scene4.subline}
        </motion.p>
      </div>
    </motion.section>
  )
}
