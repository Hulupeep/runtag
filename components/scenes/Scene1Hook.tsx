'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Scene1HookProps {
  onStart: () => void
}

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <span className="text-4xl">✓</span>
        <p className="font-body">You&apos;re on the list!</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={status === 'loading'}
        className="flex-1 px-5 py-4 bg-white text-black font-body rounded-none border-2 border-black focus:outline-none focus:border-gray-600"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-8 py-4 bg-black text-white font-headline text-xl uppercase tracking-wide hover:bg-gray-900 disabled:opacity-50"
      >
        {status === 'loading' ? '...' : 'Join'}
      </button>
      {status === 'error' && (
        <p className="text-red-600 text-sm absolute -bottom-6">Something went wrong</p>
      )}
    </form>
  )
}

export function Scene1Hook({ onStart }: Scene1HookProps) {
  return (
    <motion.div
      className="min-h-screen bg-runtag-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scene-1"
    >
      {/* Hero Section */}
      <section className="hero-section">
        <motion.h1
          className="hero-headline"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Your watch<br />
          is making<br />
          you <span className="text-runtag-red animate-pulse">fat.</span>
        </motion.h1>

        <motion.p
          className="hero-subhead"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          You spent £400 on metrics. You check your VO2 max. You compare your splits. You haven&apos;t run in three weeks.
        </motion.p>

        <motion.div
          className="stats-waste"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="stat">
            <div className="stat-number">£400</div>
            <div className="stat-label">Watch you don&apos;t use</div>
          </div>
          <div className="stat">
            <div className="stat-number">47</div>
            <div className="stat-label">Metrics you ignore</div>
          </div>
          <div className="stat">
            <div className="stat-number">0</div>
            <div className="stat-label">Runs this month</div>
          </div>
        </motion.div>
      </section>

      {/* Truth Section */}
      <section className="truth-section">
        <motion.h2
          className="truth-heading"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          The uncomfortable truth
        </motion.h2>
        <ul className="truth-list">
          {[
            'Your body doesn\'t care about your pace',
            'Your heart doesn\'t care about zones',
            'Your lungs don\'t care about VO2 max',
            'Strava comparisons create anxiety, not fitness',
            'Optimizing before you\'re consistent is self-sabotage',
          ].map((truth, i) => (
            <motion.li
              key={i}
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="x">✕</span> {truth}
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Method Section */}
      <section className="method-section">
        <motion.h2
          className="method-heading"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          One tag. One tap.
        </motion.h2>
        <p className="method-sub">The only metric that matters is: did you go?</p>

        <div className="steps">
          {[
            { num: '1', title: 'Plant your tag', desc: 'Stick it on a tree in your local woods. A lamp post. A bench. Your starting line.' },
            { num: '2', title: 'Tap in. Tap out.', desc: 'Phone touches tag. That\'s it. Proof you showed up. No pace. No distance. No judgment.' },
            { num: '3', title: 'Keep the chain', desc: 'Every tap adds a link. Don\'t break the chain. That\'s your only job.' },
          ].map((step, i) => (
            <motion.div
              key={i}
              className="step"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="step-number">{step.num}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Chain Section */}
      <section className="chain-section">
        <div className="chain-visual-landing">
          {Array.from({ length: 11 }).map((_, i) => (
            <motion.div
              key={i}
              className="chain-day-landing"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
            >
              ✓
            </motion.div>
          ))}
          <motion.div
            className="chain-day-landing today"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            ?
          </motion.div>
        </div>
        <h2 className="chain-text">Don&apos;t break the chain</h2>
        <p className="chain-sub">Consistency beats intensity. Show up today. That&apos;s all.</p>
      </section>

      {/* CTA Section */}
      <section className="cta-section-landing">
        <motion.h2
          className="cta-heading-landing"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
        >
          Stop optimizing.<br />Start moving.
        </motion.h2>

        <WaitlistForm />

        <p className="price">Starter kit: 3 tags + app. Free to start.</p>

        <motion.button
          className="cta-button-landing mt-8"
          style={{ background: 'transparent', border: '2px solid #0a0a0a' }}
          onClick={onStart}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          data-testid="start-demo-button"
        >
          Try Interactive Demo →
        </motion.button>
      </section>

      {/* Manifesto */}
      <section className="manifesto">
        <p className="manifesto-text">
          &quot;The only metric that matters is <span className="text-runtag-green">showing up</span>. Everything else is vanity until you&apos;ve earned the right to care about it.&quot;
        </p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        RunTag © 2025 — Prove you showed up.
      </footer>
    </motion.div>
  )
}
