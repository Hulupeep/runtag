'use client'

import { motion } from 'framer-motion'
import { COPY } from '@/lib/constants'
import { IPhoneMockup, PhoneScreen } from '@/components/IPhoneMockup'
import { TreeIllustration } from '@/components/TreeIllustration'
import { NFCTag } from '@/components/NFCTag'

interface Scene2SetupProps {
  chainCount: number
  onTapIn: () => void
}

export function Scene2Setup({ chainCount, onTapIn }: Scene2SetupProps) {
  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-2"
    >
      <motion.p
        className="narrative mb-12"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {COPY.scene2.narrative}
      </motion.p>

      <div className="split-view">
        {/* iPhone showing chain */}
        <motion.div
          className="split-left"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <IPhoneMockup>
            <PhoneScreen chainCount={chainCount} showChain={true} />
          </IPhoneMockup>
        </motion.div>

        {/* Tree with NFC tag */}
        <motion.div
          className="split-right"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TreeIllustration>
            <NFCTag
              onTap={onTapIn}
              glowing={true}
              label="Tap to start your run"
            />
          </TreeIllustration>
        </motion.div>
      </div>

      <motion.p
        className="subline mt-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {COPY.scene2.instruction}
      </motion.p>
    </motion.section>
  )
}
