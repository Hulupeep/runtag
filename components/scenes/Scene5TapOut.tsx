'use client'

import { motion } from 'framer-motion'
import { COPY } from '@/lib/constants'
import { IPhoneMockup, PhoneScreen } from '@/components/IPhoneMockup'
import { TreeIllustration } from '@/components/TreeIllustration'
import { NFCTag } from '@/components/NFCTag'

interface Scene5TapOutProps {
  chainCount: number
  onTapOut: () => void
}

export function Scene5TapOut({ chainCount, onTapOut }: Scene5TapOutProps) {
  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-5"
    >
      <motion.p
        className="narrative mb-12"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {COPY.scene5.narrative}
      </motion.p>

      <div className="split-view">
        {/* iPhone showing in-progress */}
        <motion.div
          className="split-left"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <IPhoneMockup>
            <PhoneScreen
              status="RUNNING"
              subtitle="Tap out to finish"
              chainCount={chainCount}
              showChain={false}
            />
          </IPhoneMockup>
        </motion.div>

        {/* Tree with glowing NFC tag */}
        <motion.div
          className="split-right"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TreeIllustration>
            <NFCTag
              onTap={onTapOut}
              glowing={true}
              label="Tap to finish your run"
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
        {COPY.scene5.instruction}
      </motion.p>
    </motion.section>
  )
}
