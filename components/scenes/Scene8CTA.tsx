'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { COPY } from '@/lib/constants'

interface Scene8CTAProps {
  onRestart: () => void
}

export function Scene8CTA({ onRestart }: Scene8CTAProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) throw new Error('Failed to join')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.section
      className="scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-8"
    >
      <div className="flex flex-col items-center gap-8 text-center max-w-xl">
        <motion.h1
          className="headline"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {COPY.scene8.headline}
        </motion.h1>

        {!submitted ? (
          <motion.form
            className="flex flex-col items-center gap-4 w-full"
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={COPY.scene8.emailPlaceholder}
              className="email-input"
              aria-label="Email address"
              disabled={isLoading}
              required
            />
            <button
              type="submit"
              className="cta-button"
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : COPY.scene8.cta}
            </button>
            {error && (
              <p className="text-runtag-red text-sm">{error}</p>
            )}
          </motion.form>
        ) : (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-6xl">✓</div>
            <p className="narrative">You&apos;re on the list!</p>
          </motion.div>
        )}

        <motion.p
          className="subline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {COPY.scene8.socialProof}
        </motion.p>

        <motion.button
          className="cta-button secondary mt-8"
          onClick={onRestart}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="restart-button"
        >
          {COPY.scene8.restart}
        </motion.button>
      </div>
    </motion.section>
  )
}
