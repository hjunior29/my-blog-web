import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import { I18nProvider } from '../../i18n'
import { apiClient } from '../../lib/api'
import { EditorMetaCard } from './EditorMetaCard'
import { EditorToolbar } from '../../design-system'
import { formatMediaMarkdown, insertTextAtCursor } from './editorUtils'

describe('editor media utils', () => {
  it('formats image markdown correctly', () => {
    const md = formatMediaMarkdown('image', 'https://storage/photo.jpg', 'photo.jpg')
    expect(md).toContain('![photo.jpg](https://storage/photo.jpg)')
  })

  it('formats video markdown with HTML5 video tag and controls', () => {
    const md = formatMediaMarkdown('video', 'https://storage/clip.mp4', 'clip.mp4')
    expect(md).toContain('<video controls src="https://storage/clip.mp4" preload="metadata"></video>')
  })

  it('formats audio markdown with HTML5 audio tag and controls', () => {
    const md = formatMediaMarkdown('audio', 'https://storage/song.mp3', 'song.mp3')
    expect(md).toContain('<audio controls src="https://storage/song.mp3" preload="metadata"></audio>')
  })

  it('inserts text at cursor position', () => {
    const initial = 'Hello world'
    const insertion = ' beautiful'
    const { nextValue, cursor } = insertTextAtCursor(initial, 5, 5, insertion)
    expect(nextValue).toBe('Hello beautiful world')
    expect(cursor).toBe(15)
  })
})

describe('EditorToolbar media button', () => {
  it('invokes onUploadMedia callback when clicked', () => {
    const onInsert = vi.fn()
    const onUploadMedia = vi.fn()

    const screen = render(() => (
      <EditorToolbar onInsert={onInsert} onUploadMedia={onUploadMedia} />
    ))

    const uploadBtn = screen.getByTitle(/Upload media/i)
    fireEvent.click(uploadBtn)
    expect(onUploadMedia).toHaveBeenCalledTimes(1)
  })
})

describe('EditorMetaCard cover upload', () => {
  it('uploads cover image and notifies onCoverImageChange', async () => {
    const onCoverChange = vi.fn()
    const onToast = vi.fn()
    const uploadSpy = vi.spyOn(apiClient, 'uploadMedia').mockResolvedValue({
      id: 'm1',
      filename: 'cover.png',
      content_type: 'image/png',
      media_kind: 'image',
      size_bytes: 500,
      public_url: 'https://storage/cover.png',
      created_at: '2026-10-04T00:00:00Z',
    })

    const screen = render(() => (
      <I18nProvider>
        <EditorMetaCard
          title="Test"
          onTitleChange={() => {}}
          summary="Test summary"
          onSummaryChange={() => {}}
          tags={[]}
          onTagsChange={() => {}}
          bookColor={null}
          onBookColorChange={() => {}}
          coverImage={null}
          onCoverImageChange={onCoverChange}
          onNotifyToast={onToast}
        />
      </I18nProvider>
    ))

    const uploadBtn = screen.getByTitle(/Upload de imagem|Upload image/i)
    expect(uploadBtn).toBeTruthy()

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const file = new File(['image'], 'cover.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await vi.waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(file)
      expect(onCoverChange).toHaveBeenCalledWith('https://storage/cover.png')
      expect(onToast).toHaveBeenCalledWith(expect.stringMatching(/sucesso|success/i))
    })
  })
})
