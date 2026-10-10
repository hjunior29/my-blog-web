import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@solidjs/testing-library'
import { Pagination } from './Pagination'
import { StatusBadge } from './StatusBadge'
import { SearchField } from './SearchField'
import { TagInput } from './TagInput'
import { PasswordField } from './PasswordField'
import { OtpInput } from './OtpInput'
import { ArticleProse, normalizeMermaidCode } from './ArticleProse'
import { MotionControl, isMotionPaused, setMotionPaused } from './MotionControl'
import { EditorialScene } from './EditorialScene'
import { PostCard } from './editorial'
import { BookColorPicker } from './BookColorPicker'
import { getBookColor, BOOK_COLOR_PRESETS } from './bookColors'

describe('PostCard component', () => {
  it('renders semantic link when slug is provided', () => {
    const { container } = render(() => (
      <PostCard
        title="Post Title"
        description="A great post"
        category="Tech"
        date="2026-09-28"
        readingTime="5 min"
        slug="hello-world"
      />
    ))
    const link = container.querySelector('a.post-book-action') as HTMLAnchorElement
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toBe('/posts/hello-world')
    expect(link.getAttribute('aria-label')).toBe('Post Title')
  })

  it('renders button when neither slug nor href is provided', () => {
    const handleOpen = vi.fn()
    const { container } = render(() => (
      <PostCard
        title="Button Post"
        description="Opens modal"
        category="Design"
        date="2026-09-28"
        readingTime="2 min"
        onOpen={handleOpen}
      />
    ))
    const btn = container.querySelector('button.post-book-action') as HTMLButtonElement
    expect(btn).not.toBeNull()
    fireEvent.click(btn)
    expect(handleOpen).toHaveBeenCalled()
  })
})

describe('Pagination component', () => {
  it('renders correct page buttons and handles page changes', () => {
    const handleChange = vi.fn()
    const { getByText, getByLabelText } = render(() => (
      <Pagination page={2} total={50} limit={10} onChange={handleChange} />
    ))

    expect(getByText('2').classList.contains('active')).toBe(true)
    const page3Btn = getByText('3')
    fireEvent.click(page3Btn)
    expect(handleChange).toHaveBeenCalledWith(3)

    const prevBtn = getByLabelText('Previous page')
    fireEvent.click(prevBtn)
    expect(handleChange).toHaveBeenCalledWith(1)
  })

  it('disables previous button on first page and next on last page', () => {
    const handleChange = vi.fn()
    const { getByLabelText } = render(() => (
      <Pagination page={1} total={10} limit={10} onChange={handleChange} />
    ))

    const prevBtn = getByLabelText('Previous page') as HTMLButtonElement
    const nextBtn = getByLabelText('Next page') as HTMLButtonElement
    expect(prevBtn.disabled).toBe(true)
    expect(nextBtn.disabled).toBe(true)
  })

  it('renders ellipsis when totalPages > 7 and marks aria-current="page"', () => {
    const handleChange = vi.fn()
    const { container, getByText } = render(() => (
      <Pagination page={5} totalPages={10} onChange={handleChange} />
    ))

    const ellipses = container.querySelectorAll('.pagination-ellipsis')
    expect(ellipses.length).toBeGreaterThan(0)
    expect(getByText('5').getAttribute('aria-current')).toBe('page')
  })
})

describe('StatusBadge component', () => {
  it('renders status badge with custom label', () => {
    const { container } = render(() => (
      <StatusBadge status="published" label="Publicado" />
    ))
    const badge = container.querySelector('.status-badge')
    expect(badge?.classList.contains('status-published')).toBe(true)
    expect(badge?.textContent).toBe('Publicado')
  })

  it('renders default fallback labels for draft and archived', () => {
    const { container: cDraft } = render(() => <StatusBadge status="draft" />)
    expect(cDraft.textContent).toBe('Draft')

    const { container: cArch } = render(() => <StatusBadge status="archived" />)
    expect(cArch.textContent).toBe('Archived')
  })
})

describe('SearchField component', () => {
  it('triggers onInput and clear handlers', () => {
    const handleInput = vi.fn()
    const handleClear = vi.fn()
    const { getByRole, getByLabelText } = render(() => (
      <SearchField
        value="test query"
        onInput={handleInput}
        onClear={handleClear}
        label="Search posts"
        clearLabel="Clear"
      />
    ))

    const input = getByRole('searchbox') as HTMLInputElement
    expect(input.value).toBe('test query')

    const clearBtn = getByLabelText('Clear')
    fireEvent.click(clearBtn)
    expect(handleInput).toHaveBeenCalledWith('')
    expect(handleClear).toHaveBeenCalled()
  })

  it('triggers onSubmit on Enter and clears on Escape', () => {
    const handleInput = vi.fn()
    const handleClear = vi.fn()
    const handleSubmit = vi.fn()
    const { getByRole } = render(() => (
      <SearchField
        value="search term"
        onInput={handleInput}
        onClear={handleClear}
        onSubmit={handleSubmit}
      />
    ))

    const input = getByRole('searchbox') as HTMLInputElement
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleSubmit).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(handleInput).toHaveBeenCalledWith('')
    expect(handleClear).toHaveBeenCalledTimes(1)
  })
})

describe('TagInput component', () => {
  it('adds tags on Enter and removes tags on remove button click', () => {
    const handleChange = vi.fn()
    const { getByPlaceholderText, getByLabelText } = render(() => (
      <TagInput tags={['rust', 'solid']} onChange={handleChange} placeholder="Add tag" />
    ))

    const input = getByPlaceholderText('Add tag') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'vite' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleChange).toHaveBeenCalledWith(['rust', 'solid', 'vite'])

    const removeRustBtn = getByLabelText('Remove tag rust')
    fireEvent.click(removeRustBtn)
    expect(handleChange).toHaveBeenCalledWith(['solid'])
  })

  it('prevents duplicate tags and respects maxTags', () => {
    const handleChange = vi.fn()
    const { getByPlaceholderText } = render(() => (
      <TagInput tags={['rust', 'solid']} maxTags={3} onChange={handleChange} placeholder="Add tag" />
    ))

    const input = getByPlaceholderText('Add tag') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'rust' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('hides input when maxTags is reached', () => {
    const handleChange = vi.fn()
    const { queryByPlaceholderText } = render(() => (
      <TagInput tags={['rust', 'solid']} maxTags={2} onChange={handleChange} placeholder="Add tag" />
    ))
    expect(queryByPlaceholderText('Add tag')).toBeNull()
  })

  it('removes last tag on Backspace when input is empty', () => {
    const handleChange = vi.fn()
    const { getByPlaceholderText } = render(() => (
      <TagInput tags={['rust', 'solid']} onChange={handleChange} placeholder="Add tag" />
    ))

    const input = getByPlaceholderText('Add tag') as HTMLInputElement
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(handleChange).toHaveBeenCalledWith(['rust'])
  })
})

describe('PasswordField component', () => {
  it('toggles password visibility and updates aria attributes', () => {
    const handleInput = vi.fn()
    const { getByPlaceholderText, getByLabelText } = render(() => (
      <PasswordField
        id="test-pwd"
        value="secret"
        onInput={handleInput}
        placeholder="Password"
        showPasswordLabel="Show"
        hidePasswordLabel="Hide"
      />
    ))

    const input = getByPlaceholderText('Password') as HTMLInputElement
    expect(input.type).toBe('password')

    const toggleBtn = getByLabelText('Show')
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(toggleBtn)
    expect(input.type).toBe('text')
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')
    expect(toggleBtn.getAttribute('aria-label')).toBe('Hide')

    fireEvent.click(toggleBtn)
    expect(input.type).toBe('password')
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('OtpInput component', () => {
  it('filters out non-digits and truncates to 6 characters', () => {
    const handleInput = vi.fn()
    const { getByPlaceholderText } = render(() => (
      <OtpInput
        value=""
        onInput={handleInput}
        placeholder="000000"
      />
    ))

    const input = getByPlaceholderText('000000') as HTMLInputElement
    fireEvent.input(input, { target: { value: '12a3b4c5d6e7' } })
    expect(handleInput).toHaveBeenCalledWith('123456')
  })
})

describe('ArticleProse component', () => {
  it('sanitizes dangerous script and inline event handlers', () => {
    const dirtyHtml = '<p>Safe text</p><script>alert("xss")</script><img src="x" onerror="alert(1)" />'
    const { container } = render(() => <ArticleProse html={dirtyHtml} />)

    expect(container.querySelector('script')).toBeNull()
    const img = container.querySelector('img')
    expect(img?.getAttribute('onerror')).toBeNull()
    expect(container.querySelector('p')?.textContent).toBe('Safe text')
  })

  it('renders rich content like code, blockquotes, and tables safely', () => {
    const richHtml = '<blockquote>Quote</blockquote><pre><code>const a = 1;</code></pre><table><tbody><tr><td>Cell</td></tr></tbody></table>'
    const { container } = render(() => <ArticleProse html={richHtml} />)

    expect(container.querySelector('blockquote')?.textContent).toBe('Quote')
    expect(container.querySelector('code')?.textContent).toBe('const a = 1;')
    expect(container.querySelector('td')?.textContent).toBe('Cell')
  })

  it('renders video and audio tags with controls safely', () => {
    const mediaHtml = '<video controls src="/api/v1/media/vid1" preload="metadata"><source src="/api/v1/media/vid1" type="video/mp4"></video><audio controls src="/api/v1/media/aud1" preload="metadata"></audio>'
    const { container } = render(() => <ArticleProse html={mediaHtml} />)

    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    expect(video?.getAttribute('controls')).toBe('')
    expect(video?.getAttribute('src')).toBe('/api/v1/media/vid1')

    const audio = container.querySelector('audio')
    expect(audio).not.toBeNull()
    expect(audio?.getAttribute('controls')).toBe('')
    expect(audio?.getAttribute('src')).toBe('/api/v1/media/aud1')
  })

  it('normalizes mermaid code with unquoted parens in edge labels and invalid bidirectional arrows', () => {
    const input = 'flowchart LR\n  A -->|Busca O(1) sem locks| B\n  B <==>|Canal WebSocket TLS| C\n  C -- Decisão (tipo 1) --> D'
    const result = normalizeMermaidCode(input)
    expect(result).toContain('A -->|"Busca O(1) sem locks"| B')
    expect(result).toContain('B <-->|Canal WebSocket TLS| C')
    expect(result).toContain('C -- "Decisão (tipo 1)" --> D')
  })

  it('highlights code blocks and wraps with language header and copy button', async () => {
    const codeHtml = '<pre><code class="language-javascript">const answer = 42;</code></pre>'
    const { container } = render(() => <ArticleProse html={codeHtml} />)

    await new Promise((r) => setTimeout(r, 100))

    const code = container.querySelector('code')
    expect(code?.classList.contains('hljs')).toBe(true)
    expect(code?.querySelector('.hljs-keyword')?.textContent).toBe('const')
    expect(code?.querySelector('.hljs-number')?.textContent).toBe('42')

    const wrapper = container.querySelector('.article-code-container')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.querySelector('.article-code-lang')?.textContent).toBe('javascript')
    expect(wrapper?.querySelector('.article-code-copy-btn')).not.toBeNull()
  })
})

describe('MotionControl component', () => {
  it('toggles motion paused state', () => {
    setMotionPaused(false)
    expect(isMotionPaused()).toBe(false)

    const { getByRole } = render(() => (
      <MotionControl pauseLabel="Pause" resumeLabel="Resume" />
    ))

    const btn = getByRole('button')
    fireEvent.click(btn)
    expect(isMotionPaused()).toBe(true)
    expect(document.documentElement.getAttribute('data-motion-paused')).toBe('true')
  })
})

describe('EditorialScene component', () => {
  it('renders hero scene variant by default with scoped aria-hidden', () => {
    const { container } = render(() => (
      <EditorialScene motionLabel="Pause" />
    ))
    const scene = container.querySelector('.editorial-scene.scene-hero')
    expect(scene).not.toBeNull()
    const art = container.querySelector('.notebook-art')
    expect(art?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders workshop scene variant with accessible copy and hidden stage', () => {
    const { container, getByText } = render(() => (
      <EditorialScene
        variant="workshop"
        workshopTitle="Workshop Title"
        workshopText="Workshop Description"
      />
    ))
    const scene = container.querySelector('.editorial-scene.scene-workshop')
    expect(scene).not.toBeNull()
    expect(getByText('Workshop Title')).not.toBeNull()
    expect(getByText('Workshop Description')).not.toBeNull()
    const stage = container.querySelector('.workshop-stage')
    expect(stage?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('.workshop-folio-stack')).not.toBeNull()
  })

  it('updates data-in-view on visibilitychange event', () => {
    const { container } = render(() => <EditorialScene variant="hero" />)
    const scene = container.querySelector('.editorial-scene')
    expect(scene?.getAttribute('data-in-view')).toBe('true')

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(scene?.getAttribute('data-in-view')).toBe('false')

    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(scene?.getAttribute('data-in-view')).toBe('true')
  })

  it('observes element via IntersectionObserver and disconnects on unmount', () => {
    let observedEl: Element | null = null
    let disconnected = false
    let observerCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null

    class MockIntersectionObserver {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observerCallback = callback
      }
      observe(el: Element) {
        observedEl = el
      }
      disconnect() {
        disconnected = true
      }
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    const { container, unmount } = render(() => <EditorialScene variant="workshop" />)
    const scene = container.querySelector('.editorial-scene')
    expect(observedEl).toBe(scene)

    observerCallback!([{ isIntersecting: false } as IntersectionObserverEntry])
    expect(scene?.getAttribute('data-in-view')).toBe('false')

    observerCallback!([{ isIntersecting: true } as IntersectionObserverEntry])
    expect(scene?.getAttribute('data-in-view')).toBe('true')

    unmount()
    expect(disconnected).toBe(true)
    vi.unstubAllGlobals()
  })
})

describe('getBookColor helper', () => {
  it('returns explicit color when valid hex is provided', () => {
    expect(getBookColor('#123456')).toBe('#123456')
    expect(getBookColor('#abc')).toBe('#abc')
  })

  it('falls back to deterministic preset when explicit color is null or invalid', () => {
    const colorA = getBookColor(null, 'rust-architecture')
    const colorB = getBookColor(undefined, 'rust-architecture')
    expect(colorA).toBe(colorB)
    expect(BOOK_COLOR_PRESETS.map(p => p.hex)).toContain(colorA)
  })

  it('produces different colors for different seeds', () => {
    const color1 = getBookColor(null, 'article-alpha')
    const color2 = getBookColor(null, 'article-beta')
    expect(typeof color1).toBe('string')
    expect(typeof color2).toBe('string')
  })
})

describe('BookColorPicker component', () => {
  it('renders presets and triggers onChange when preset is clicked', () => {
    const handleChange = vi.fn()
    const { container } = render(() => (
      <BookColorPicker value={null} onChange={handleChange} />
    ))
    const presetButtons = container.querySelectorAll('.book-color-swatch')
    expect(presetButtons.length).toBe(BOOK_COLOR_PRESETS.length)
    fireEvent.click(presetButtons[0])
    expect(handleChange).toHaveBeenCalledWith(BOOK_COLOR_PRESETS[0].hex)
  })

  it('triggers onChange with null when reset button is clicked', () => {
    const handleChange = vi.fn()
    const { getByText } = render(() => (
      <BookColorPicker value="#123456" onChange={handleChange} resetLabel="Auto" />
    ))
    const resetBtn = getByText('Auto')
    fireEvent.click(resetBtn)
    expect(handleChange).toHaveBeenCalledWith(null)
  })
})

