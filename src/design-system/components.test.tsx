import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@solidjs/testing-library'
import { Pagination } from './Pagination'
import { StatusBadge } from './StatusBadge'
import { SearchField } from './SearchField'
import { TagInput } from './TagInput'
import { PasswordField } from './PasswordField'
import { ArticleProse } from './ArticleProse'
import { MotionControl, isMotionPaused, setMotionPaused } from './MotionControl'
import { PostCard } from './editorial'

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

  it('renders default fallback labels for draft, scheduled and archived', () => {
    const { container: cDraft } = render(() => <StatusBadge status="draft" />)
    expect(cDraft.textContent).toBe('Draft')

    const { container: cSched } = render(() => <StatusBadge status="scheduled" />)
    expect(cSched.textContent).toBe('Scheduled')

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
