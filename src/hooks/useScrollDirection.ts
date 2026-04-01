import { useState, useEffect } from 'react'

export type ScrollDirection = 'up' | 'down' | 'idle'

export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('idle')
  useEffect(() => {
    let lastY = window.scrollY
    const handleScroll = () => {
      const current = window.scrollY
      if (Math.abs(current - lastY) < threshold) return
      setDirection(current > lastY ? 'down' : 'up')
      lastY = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])
  return direction
}
