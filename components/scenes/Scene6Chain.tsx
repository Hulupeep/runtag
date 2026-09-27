'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { COPY, TIMING } from '@/lib/constants'
import { ChainVisual, BigCheckmark } from '@/components/ChainVisual'

interface Scene6ChainProps {
  chainCount: number
  onContinue: () => void
}

export function Scene6Chain({ chainCount, onContinue }: Scene6ChainProps) {
  // Auto-advance after celebration
  useEffect(() => {
    const timer = setTimeout(onContinue, 3000)
    return () => clearTimeout(timer)
  }, [onContinue])

  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-6"
    >
      <div className="flex flex-col items-center gap-8">
        <BigCheckmark />

        <motion.p
          className="narrative font-headline text-4xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {COPY.scene6.narrative}
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <ChainVisual count={chainCount} highlightLast={true} />
        </motion.div>

        <motion.p
          className="subline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {COPY.scene6.celebration}
        </motion.p>

        <motion.button
          className="cta-button secondary mt-4"
          onClick={onContinue}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue
        </motion.button>
      </div>
    </motion.section>
  )
}
