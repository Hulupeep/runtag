'use client'

import { motion } from 'framer-motion'
import { COPY } from '@/lib/constants'
import { IPhoneMockup, PhoneScreen } from '@/components/IPhoneMockup'

interface Scene3TapInProps {
  chainCount: number
}

export function Scene3TapIn({ chainCount }: Scene3TapInProps) {
  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-3"
    >
      <div className="flex flex-col items-center gap-8">
        <IPhoneMockup>
          <PhoneScreen
            status={COPY.scene3.status}
            subtitle={COPY.scene3.subtitle}
            chainCount={chainCount}
            showChain={false}
          />
        </IPhoneMockup>

        <motion.p
          className="narrative"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {COPY.scene3.narrative}
        </motion.p>
      </div>
    </motion.section>
  )
}
