'use client'

import { AnimatePresence } from 'framer-motion'
import { useDemoState } from '@/hooks/useDemoState'
import { Scene1Hook } from '@/components/scenes/Scene1Hook'
import { Scene2Setup } from '@/components/scenes/Scene2Setup'
import { Scene3TapIn } from '@/components/scenes/Scene3TapIn'
import { Scene4Run } from '@/components/scenes/Scene4Run'
import { Scene5TapOut } from '@/components/scenes/Scene5TapOut'
import { Scene6Chain } from '@/components/scenes/Scene6Chain'
import { Scene7Discovery } from '@/components/scenes/Scene7Discovery'
import { Scene8CTA } from '@/components/scenes/Scene8CTA'

export default function Home() {
  const { state, actions } = useDemoState()

  return (
    <main className="min-h-screen bg-runtag-black" data-testid="demo-container">
      <AnimatePresence mode="wait">
        {state.currentScene === 1 && (
          <Scene1Hook key="scene1" onStart={actions.startDemo} />
        )}

        {state.currentScene === 2 && (
          <Scene2Setup
            key="scene2"
            chainCount={state.chainCount}
            onTapIn={actions.tapIn}
          />
        )}

        {state.currentScene === 3 && (
          <Scene3TapIn key="scene3" chainCount={state.chainCount} />
        )}

        {state.currentScene === 4 && (
          <Scene4Run key="scene4" onComplete={actions.finishRun} />
        )}

        {state.currentScene === 5 && (
          <Scene5TapOut
            key="scene5"
            chainCount={state.chainCount}
            onTapOut={actions.tapOut}
          />
        )}

        {state.currentScene === 6 && (
          <Scene6Chain
            key="scene6"
            chainCount={state.chainCount}
            onContinue={actions.advanceFromChain}
          />
        )}

        {state.currentScene === 7 && (
          <Scene7Discovery key="scene7" onContinue={actions.advanceToFinal} />
        )}

        {state.currentScene === 8 && (
          <Scene8CTA key="scene8" onRestart={actions.restart} />
        )}
      </AnimatePresence>

      {/* Scene indicator (hidden visually but available for testing) */}
      <div
        data-testid="scene-indicator"
        data-current-scene={state.currentScene}
        data-chain-count={state.chainCount}
        className="sr-only"
        aria-live="polite"
      >
        Scene {state.currentScene} of 8. Chain count: {state.chainCount}
      </div>
    </main>
  )
}
