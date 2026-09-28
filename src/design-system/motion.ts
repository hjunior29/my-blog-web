export type MotionPreset = 'scale' | 'slide' | 'fade'

export function animatePresence(element: HTMLElement, visible: boolean, preset: MotionPreset = 'scale') {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !element.animate) return null
  const styles = getComputedStyle(element)
  const hidden = { opacity: 0, transform: preset === 'scale' ? 'scale(.96)' : preset === 'slide' ? 'translateY(6px)' : 'none' }
  const shown = { opacity: 1, transform: 'none' }
  return element.animate(visible ? [hidden, shown] : [shown, hidden], {
    duration: parseFloat(styles.getPropertyValue(visible ? '--motion-enter' : '--motion-exit')),
    easing: styles.getPropertyValue(visible ? '--ease-enter' : '--ease-exit').trim(),
    fill: 'both',
  })
}
