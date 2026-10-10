import { describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { ReadingResumeBanner } from './ReadingResumeBanner'

describe('ReadingResumeBanner component', () => {
  it('renders progress and custom labels', () => {
    const onResume = vi.fn()
    const onDismiss = vi.fn()
    const { container, getByText } = render(() => (
      <ReadingResumeBanner
        progress={0.64}
        onResume={onResume}
        onDismiss={onDismiss}
        label="Resume from 64%"
        resumeActionLabel="Continue"
        dismissLabel="Close"
      />
    ))
    expect(getByText('Resume from 64%')).not.toBeNull()
    const resumeBtn = getByText('Continue')
    expect(resumeBtn).not.toBeNull()
    resumeBtn.click()
    expect(onResume).toHaveBeenCalled()

    const dismissBtn = container.querySelector('.ds-reading-resume-dismiss') as HTMLButtonElement
    expect(dismissBtn.getAttribute('aria-label')).toBe('Close')
    dismissBtn.click()
    expect(onDismiss).toHaveBeenCalled()
  })
})
