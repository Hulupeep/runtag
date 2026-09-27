'use client'

import { motion } from 'framer-motion'
import { COPY } from '@/lib/constants'
import { MapView } from '@/components/MapView'

interface Scene7DiscoveryProps {
  onContinue: () => void
}

export function Scene7Discovery({ onContinue }: Scene7DiscoveryProps) {
  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-7"
    >
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
        <motion.h2
          className="headline text-4xl md:text-5xl text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {COPY.scene7.headline}
        </motion.h2>

        <motion.div
          className="w-full"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <MapView />
        </motion.div>

        <motion.p
          className="subline text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {COPY.scene7.subline}
        </motion.p>

        <motion.button
          className="cta-button mt-4"
          onClick={onContinue}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          See How It Works
        </motion.button>
      </div>
    </motion.section>
  )
}
