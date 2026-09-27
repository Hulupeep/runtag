'use client'

import { useState, useCallback } from 'react'
import { Scene, CHAIN, TIMING } from '@/lib/constants'

export interface DemoState {
  currentScene: Scene
  chainCount: number
  hasTappedIn: boolean
  hasTappedOut: boolean
  isAnimating: boolean
}

export function useDemoState() {
  const [state, setState] = useState<DemoState>({
    currentScene: 1,
    chainCount: CHAIN.initial,
    hasTappedIn: false,
    hasTappedOut: false,
    isAnimating: false,
  })

  const setAnimating = useCallback((isAnimating: boolean) => {
    setState(prev => ({ ...prev, isAnimating }))
  }, [])

  const goToScene = useCallback((scene: Scene) => {
    setState(prev => ({ ...prev, currentScene: scene, isAnimating: false }))
  }, [])

  const nextScene = useCallback(() => {
    setState(prev => {
      const next = Math.min(prev.currentScene + 1, 8) as Scene
      return { ...prev, currentScene: next, isAnimating: false }
    })
  }, [])

  const startDemo = useCallback(() => {
    setState(prev => ({ ...prev, currentScene: 2, isAnimating: true }))
    setTimeout(() => setAnimating(false), TIMING.sceneTransition)
  }, [setAnimating])

  const tapIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasTappedIn: true,
      isAnimating: true,
    }))
    // Auto-advance to scene 3, then 4 after delay
    setTimeout(() => {
      setState(prev => ({ ...prev, currentScene: 3 }))
      setTimeout(() => {
        setState(prev => ({ ...prev, currentScene: 4, isAnimating: true }))
      }, TIMING.autoAdvanceDelay)
    }, TIMING.nfcRipple)
  }, [])

  const tapOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasTappedOut: true,
      isAnimating: true,
    }))
    // Advance to scene 6 with chain increment
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentScene: 6,
        chainCount: CHAIN.afterRun,
      }))
    }, TIMING.nfcRipple)
  }, [])

  const finishRun = useCallback(() => {
    setState(prev => ({ ...prev, currentScene: 5 }))
  }, [])

  const advanceFromChain = useCallback(() => {
    setState(prev => ({ ...prev, currentScene: 7 }))
  }, [])

  const advanceToFinal = useCallback(() => {
    setState(prev => ({ ...prev, currentScene: 8 }))
  }, [])

  const restart = useCallback(() => {
    setState({
      currentScene: 1,
      chainCount: CHAIN.initial,
      hasTappedIn: false,
      hasTappedOut: false,
      isAnimating: false,
    })
  }, [])

  return {
    state,
    actions: {
      startDemo,
      tapIn,
      tapOut,
      finishRun,
      advanceFromChain,
      advanceToFinal,
      nextScene,
      goToScene,
      restart,
      setAnimating,
    },
  }
}
