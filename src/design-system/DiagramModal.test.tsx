import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@solidjs/testing-library'
import { DiagramModal } from './DiagramModal'

describe('DiagramModal component', () => {
  const sampleSvg = '<svg data-testid="test-svg"><circle cx="10" cy="10" r="5" /></svg>'

  it('renders dialog when open is true', () => {
    const handleClose = vi.fn()
    const { getByRole, getByTestId } = render(() => (
      <DiagramModal
        open={true}
        svgHtml={sampleSvg}
        title="Test Architecture"
        onClose={handleClose}
      />
    ))

    const dialog = getByRole('dialog')
    expect(dialog).not.toBeNull()
    expect(getByTestId('test-svg')).not.toBeNull()
  })

  it('does not render when open is false', () => {
    const handleClose = vi.fn()
    const { queryByRole } = render(() => (
      <DiagramModal
        open={false}
        svgHtml={sampleSvg}
        onClose={handleClose}
      />
    ))

    expect(queryByRole('dialog')).toBeNull()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    const { getByLabelText } = render(() => (
      <DiagramModal
        open={true}
        svgHtml={sampleSvg}
        onClose={handleClose}
        labels={{ close: 'Close diagram' }}
      />
    ))

    const closeBtn = getByLabelText('Close diagram')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('updates zoom percentage when zoom in and zoom out are clicked', () => {
    const { getByLabelText, getByText } = render(() => (
      <DiagramModal
        open={true}
        svgHtml={sampleSvg}
        onClose={() => {}}
        labels={{ zoomIn: 'Zoom In', zoomOut: 'Zoom Out', resetZoom: 'Reset' }}
      />
    ))

    expect(getByText('100%')).not.toBeNull()
    const zoomInBtn = getByLabelText('Zoom In')
    fireEvent.click(zoomInBtn)
    expect(getByText('125%')).not.toBeNull()

    const zoomOutBtn = getByLabelText('Zoom Out')
    fireEvent.click(zoomOutBtn)
    expect(getByText('100%')).not.toBeNull()
  })

  it('resets scale to 100% when reset button is clicked', () => {
    const { getByLabelText, getByText } = render(() => (
      <DiagramModal
        open={true}
        svgHtml={sampleSvg}
        onClose={() => {}}
        labels={{ zoomIn: 'Zoom In', resetZoom: 'Reset' }}
      />
    ))

    const zoomInBtn = getByLabelText('Zoom In')
    fireEvent.click(zoomInBtn)
    fireEvent.click(zoomInBtn)
    expect(getByText('156%')).not.toBeNull()

    const resetBtn = getByLabelText('Reset')
    fireEvent.click(resetBtn)
    expect(getByText('100%')).not.toBeNull()
  })

  it('calls onClose on Escape key', () => {
    const handleClose = vi.fn()
    render(() => (
      <DiagramModal
        open={true}
        svgHtml={sampleSvg}
        onClose={handleClose}
      />
    ))

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('renders image when imageSrc is provided', () => {
    const handleClose = vi.fn()
    const { getByRole } = render(() => (
      <DiagramModal
        open={true}
        imageSrc="/api/v1/media/img1.png"
        imageAlt="Architecture Diagram"
        onClose={handleClose}
      />
    ))

    const img = getByRole('img')
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('/api/v1/media/img1.png')
    expect(img.getAttribute('alt')).toBe('Architecture Diagram')
  })
})
