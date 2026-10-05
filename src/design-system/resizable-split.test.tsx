import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@solidjs/testing-library'
import { ResizableSplit } from './ResizableSplit'

describe('ResizableSplit component', () => {
  it('renders both panes by default at 50/50', () => {
    const { getByText } = render(() => (
      <ResizableSplit
        left={<div>Left Content</div>}
        right={<div>Right Content</div>}
        ratio={50}
      />
    ))
    expect(getByText('Left Content')).not.toBeNull()
    expect(getByText('Right Content')).not.toBeNull()
  })

  it('hides left pane when collapsed to 0 (preview only)', () => {
    const { container } = render(() => (
      <ResizableSplit
        left={<div>Left Content</div>}
        right={<div>Right Content</div>}
        ratio={0}
      />
    ))
    const leftPane = container.querySelector('.resizable-pane-left')
    expect(leftPane?.classList.contains('resizable-pane-collapsed')).toBe(true)
  })

  it('hides right pane when collapsed to 100 (editor only)', () => {
    const { container } = render(() => (
      <ResizableSplit
        left={<div>Left Content</div>}
        right={<div>Right Content</div>}
        ratio={100}
      />
    ))
    const rightPane = container.querySelector('.resizable-pane-right')
    expect(rightPane?.classList.contains('resizable-pane-collapsed')).toBe(true)
  })

  it('adjusts ratio on keyboard ArrowLeft and ArrowRight', () => {
    const handleRatioChange = vi.fn()
    const { container } = render(() => (
      <ResizableSplit
        left={<div>Left Content</div>}
        right={<div>Right Content</div>}
        ratio={50}
        onRatioChange={handleRatioChange}
      />
    ))
    const separator = container.querySelector('[role="separator"]') as HTMLElement
    expect(separator).not.toBeNull()

    fireEvent.keyDown(separator, { key: 'ArrowLeft' })
    expect(handleRatioChange).toHaveBeenCalledWith(45)

    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(handleRatioChange).toHaveBeenCalledWith(55)
  })

  it('resets to 50 on double click', () => {
    const handleRatioChange = vi.fn()
    const { container } = render(() => (
      <ResizableSplit
        left={<div>Left Content</div>}
        right={<div>Right Content</div>}
        ratio={80}
        onRatioChange={handleRatioChange}
      />
    ))
    const separator = container.querySelector('[role="separator"]') as HTMLElement
    fireEvent.dblClick(separator)
    expect(handleRatioChange).toHaveBeenCalledWith(50)
  })
})
