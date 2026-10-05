import { useNavigate, useParams } from '@solidjs/router'
import { createEffect, createSignal, on, onCleanup, Show } from 'solid-js'
import { useI18n } from '../../i18n'
import { apiClient, ApiError, type PostResponse, type PostStatus } from '../../lib/api'
import { Alert, Skeleton, Toast, type MarkdownSyntax } from '../../design-system'
import { downloadMarkdownFile, formatMarkdownInsertion, formatMediaMarkdown, insertTextAtCursor, readMarkdownFile } from './editorUtils'
import { clearPostCache } from '../../lib/api/postsCache'
import { useAutosave } from './useAutosave'
import { EditorSubbar } from './EditorSubbar'
import { EditorMetaCard } from './EditorMetaCard'
import { EditorHeaderBar } from './EditorHeaderBar'
import { EditorWorkspace } from './EditorWorkspace'
import { ConflictDialog } from './ConflictDialog'
import { DiscardDraftDialog } from './DiscardDraftDialog'
import './studio-editor.css'

export function StudioEditorPage() {
  const { t } = useI18n()
  const params = useParams()
  const navigate = useNavigate()

  const isEditMode = () => Boolean(params.id)
  const [savedId, setSavedId] = createSignal<string>()
  const currentId = () => params.id || savedId()
  let previewSequence = 0
  let loadSequence = 0

  const [loading, setLoading] = createSignal(isEditMode())
  const [saving, setSaving] = createSignal(false)
  const [publishing, setPublishing] = createSignal(false)
  const [unpublishing, setUnpublishing] = createSignal(false)
  const [archiving, setArchiving] = createSignal(false)
  const [discarding, setDiscarding] = createSignal(false)
  const [showDiscardDialog, setShowDiscardDialog] = createSignal(false)
  const [hasDraft, setHasDraft] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [toastMessage, setToastMessage] = createSignal<string | null>(null)

  const [title, setTitle] = createSignal('')
  const [summary, setSummary] = createSignal('')
  const [contentMd, setContentMd] = createSignal('')
  const [tags, setTags] = createSignal<string[]>([])
  const [status, setStatus] = createSignal<PostStatus>('draft')
  const [slug, setSlug] = createSignal('')
  const [bookColor, setBookColor] = createSignal<string | null>(null)
  const [coverImage, setCoverImage] = createSignal<string | null>(null)
  const [etag, setEtag] = createSignal<string | undefined>(undefined)
  const [version, setVersion] = createSignal<number | undefined>(undefined)

  const [previewHtml, setPreviewHtml] = createSignal('')
  const [previewLoading, setPreviewLoading] = createSignal(false)
  const [activeTab, setActiveTab] = createSignal<'edit' | 'preview'>('edit')
  const [splitRatio, setSplitRatio] = createSignal(50)
  const [conflictModalOpen, setConflictModalOpen] = createSignal(false)
  const [uploadingMedia, setUploadingMedia] = createSignal(false)

  let fileInputRef: HTMLInputElement | undefined
  let mediaInputRef: HTMLInputElement | undefined
  let textareaRef: HTMLTextAreaElement | undefined
  let previewTimer: ReturnType<typeof setTimeout> | undefined

  const getSnapshot = () =>
    `${title().trim()}:::${summary().trim()}:::${contentMd()}:::${tags().join(',')}:::${bookColor() ?? ''}:::${coverImage() ?? ''}`

  const applyPostData = (post: PostResponse, newEtag?: string) => {
    clearPostCache()
    setTitle(post.title); setSummary(post.summary ?? ''); setContentMd(post.content_md)
    setTags(post.tags.map(t => (typeof t === 'string' ? t : t.name)))
    setStatus(post.status); setSlug(post.slug); setBookColor(post.book_color ?? null)
    setVersion(post.version); setCoverImage(post.featured_image_media_id ?? null)
    setHasDraft(Boolean(post.has_draft))
    if (newEtag) setEtag(newEtag)
  }

  const loadPost = async (id: string) => {
    const sequence = ++loadSequence
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getAdminPost(id)
      if (sequence !== loadSequence) return
      applyPostData(res.post, res.etag)
      void updatePreview(res.post.content_md)
      autosave.markSaved(getSnapshot())
    } catch (err: unknown) {
      if (sequence !== loadSequence) return
      setError(err instanceof Error ? err.message : t().genericErrorMessage)
    } finally {
      if (sequence === loadSequence) setLoading(false)
    }
  }

  createEffect(on(() => params.id, id => {
    if (id) {
      const createdId = savedId()
      setSavedId(undefined)
      if (id !== createdId) void loadPost(id)
    } else {
      loadSequence++
      setSavedId(undefined); setTitle(''); setSummary(''); setContentMd(''); setTags([])
      setStatus('draft'); setSlug(''); setBookColor(null); setCoverImage(null)
      setEtag(undefined); setVersion(undefined); setHasDraft(false); setLoading(false)
    }
  }))

  const updatePreview = async (markdown: string) => {
    const sequence = ++previewSequence
    if (!markdown.trim()) {
      setPreviewLoading(false)
      setPreviewHtml('')
      return
    }
    setPreviewLoading(true)
    try {
      const res = await apiClient.previewPost({ content_md: markdown })
      if (sequence === previewSequence) setPreviewHtml(res.content_html)
    } catch {
      if (sequence === previewSequence) setError(t().genericErrorMessage)
    } finally {
      if (sequence === previewSequence) setPreviewLoading(false)
    }
  }

  createEffect(() => {
    const md = contentMd()
    if (previewTimer) clearTimeout(previewTimer)
    previewTimer = setTimeout(() => {
      void updatePreview(md)
    }, 600)
  })

  onCleanup(() => {
    previewSequence++
    loadSequence++
    if (previewTimer) clearTimeout(previewTimer)
  })

  const handleConflict = (err: unknown): boolean => {
    if (err instanceof ApiError && (err.status === 412 || err.code === 'conflict' || err.status === 409)) {
      setConflictModalOpen(true)
      return true
    }
    return false
  }

  const handleResolveConflict = async (strategy: 'local' | 'remote') => {
    if (!params.id) return
    try {
      const res = await apiClient.getAdminPost(params.id)
      if (strategy === 'remote') {
        applyPostData(res.post, res.etag)
      } else {
        setVersion(res.post.version)
        if (res.etag) setEtag(res.etag)
      }
      setConflictModalOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t().genericErrorMessage)
    }
  }

  const executeSave = async () => {
    const currentTitle = title().trim()
    if (!currentTitle) return false

    if (!currentId()) {
      const res = await apiClient.createPost({
        title: currentTitle,
        summary: summary().trim(),
        content_md: contentMd(),
        tags: tags(),
        status: 'draft',
        book_color: bookColor() || undefined,
        featured_image_media_id: coverImage() || undefined,
      })
      setSavedId(String(res.post.id))
      applyPostData(res.post, res.etag)
      navigate(`/studio/posts/${res.post.id}/edit`, { replace: true })
    } else {
      const dto = {
        title: currentTitle,
        summary: summary().trim(),
        content_md: contentMd(),
        tags: tags(),
        version: version() ?? 1,
        book_color: bookColor() ?? null,
        featured_image_media_id: coverImage() ?? null,
      }
      const res = status() === 'published'
        ? await apiClient.savePostDraft(currentId()!, dto, etag())
        : await apiClient.updatePost(currentId()!, dto, etag())
      applyPostData(res.post, res.etag)
    }
    return true
  }

  const autosave = useAutosave({
    canSave: () =>
      Boolean(title().trim()) &&
      !loading() &&
      !saving() &&
      !publishing() &&
      !archiving() &&
      !discarding(),
    getSnapshot,
    onSave: async () => {
      try {
        return await executeSave()
      } catch {
        return false
      }
    },
  })

  const handleSaveDraft = async () => {
    const currentTitle = title().trim()
    if (!currentTitle) {
      setError(t().titleRequiredError)
      return false
    }

    setSaving(true)
    setError(null)
    try {
      const isNew = !currentId()
      await executeSave()
      autosave.markSaved(getSnapshot())
      setToastMessage(isNew ? t().draftCreatedSuccess : t().draftUpdatedSuccess)
      return true
    } catch (err: unknown) {
      if (!handleConflict(err)) {
        setError(err instanceof Error ? err.message : t().genericErrorMessage)
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDiscardDraft = async () => {
    if (!currentId() || !hasDraft()) return
    setDiscarding(true)
    setError(null)
    try {
      const res = await apiClient.discardPostDraft(currentId()!, etag())
      applyPostData(res.post, res.etag)
      void updatePreview(res.post.content_md)
      autosave.markSaved(getSnapshot())
      setShowDiscardDialog(false)
      setToastMessage(t().draftDiscardedSuccess)
    } catch (err: unknown) {
      if (!handleConflict(err)) {
        setError(err instanceof Error ? err.message : t().genericErrorMessage)
      }
    } finally {
      setDiscarding(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    setError(null)
    try {
      if (!await handleSaveDraft()) return
      const res = await apiClient.publishPost(currentId()!, etag())
      applyPostData(res.post, res.etag)
      autosave.markSaved(getSnapshot())
      setToastMessage(t().articlePublishedSuccess)
    } catch (err: unknown) {
      if (!handleConflict(err)) {
        setError(err instanceof Error ? err.message : t().genericErrorMessage)
      }
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!currentId()) return
    setUnpublishing(true)
    setError(null)
    try {
      const res = await apiClient.unpublishPost(currentId()!, etag())
      setStatus(res.post.status)
      setVersion(res.post.version)
      if (res.etag) setEtag(res.etag)
      setToastMessage(t().articleUnpublishedSuccess)
    } catch (err: unknown) {
      if (!handleConflict(err)) {
        setError(err instanceof Error ? err.message : t().genericErrorMessage)
      }
    } finally {
      setUnpublishing(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!currentId()) return
    setArchiving(true)
    setError(null)
    try {
      const isArchived = status() === 'archived'
      const res = isArchived
        ? await apiClient.unarchivePost(currentId()!, etag())
        : await apiClient.archivePost(currentId()!, etag())
      setStatus(res.post.status)
      setVersion(res.post.version)
      if (res.etag) setEtag(res.etag)
      setToastMessage(isArchived ? t().articleUnarchivedSuccess : t().articleArchivedSuccess)
    } catch (err: unknown) {
      if (!handleConflict(err)) {
        setError(err instanceof Error ? err.message : t().genericErrorMessage)
      }
    } finally {
      setArchiving(false)
    }
  }

  const handleToolbarInsert = (syntax: MarkdownSyntax) => {
    const textarea = textareaRef
    if (!textarea) return
    const { nextValue, cursor } = formatMarkdownInsertion(
      textarea.value,
      textarea.selectionStart,
      textarea.selectionEnd,
      syntax,
    )
    setContentMd(nextValue)
    autosave.notifyChange()
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    }, 0)
  }

  const handleExport = () => {
    downloadMarkdownFile(slug() || 'article', contentMd())
  }

  const handleImport = (file: File) => {
    readMarkdownFile(file, text => {
      setContentMd(text)
      autosave.notifyChange()
      setToastMessage(t().markdownImportedSuccess)
    })
  }

  const handleMediaUpload = async (file: File) => {
    setUploadingMedia(true)
    setError(null)
    try {
      const res = await apiClient.uploadMedia(file)
      const textarea = textareaRef
      if (textarea) {
        const snippet = formatMediaMarkdown(res.media_kind, res.public_url, res.filename)
        const { nextValue, cursor } = insertTextAtCursor(
          textarea.value,
          textarea.selectionStart,
          textarea.selectionEnd,
          snippet,
        )
        setContentMd(nextValue)
        autosave.notifyChange()
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(cursor, cursor)
        }, 0)
      }
      setToastMessage(t().mediaUploadedSuccess)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t().mediaUploadFailed)
    } finally {
      setUploadingMedia(false)
    }
  }

  return (
    <div class="studio-editor-page">
      <EditorHeaderBar
        isEditMode={isEditMode()}
        status={status()}
        hasDraft={hasDraft()}
        currentId={currentId()}
        loading={loading()}
        saving={saving()}
        publishing={publishing()}
        unpublishing={unpublishing()}
        archiving={archiving()}
        discarding={discarding()}
        onArchiveToggle={handleArchiveToggle}
        onDiscardDraft={() => setShowDiscardDialog(true)}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept=".md,text/markdown"
        class="sr-only"
        onChange={e => { const f = e.currentTarget.files?.[0]; if (f) handleImport(f) }}
      />
      <input
        type="file"
        ref={mediaInputRef}
        accept="image/*,video/*,audio/*"
        class="sr-only"
        onChange={e => { const f = e.currentTarget.files?.[0]; if (f) void handleMediaUpload(f); e.currentTarget.value = '' }}
      />

      <Show when={error()}>
        <div class="editor-alert-wrapper"><Alert error title={t().genericErrorMessage}><p>{error()}</p></Alert></div>
      </Show>

      <Show when={loading()}>
        <div class="editor-loading-state" aria-busy="true">
          <Skeleton label={t().loadingMessage} /><Skeleton label={t().loadingMessage} /><Skeleton label={t().loadingMessage} />
        </div>
      </Show>

      <Show when={!loading()}>
        <EditorMetaCard
          title={title()}
          onTitleChange={val => { setTitle(val); autosave.notifyChange() }}
          summary={summary()}
          onSummaryChange={val => { setSummary(val); autosave.notifyChange() }}
          tags={tags()}
          onTagsChange={newTags => { setTags(newTags); autosave.notifyChange() }}
          bookColor={bookColor()}
          onBookColorChange={newColor => { setBookColor(newColor); autosave.notifyChange() }}
          coverImage={coverImage()}
          onCoverImageChange={newCover => { setCoverImage(newCover); autosave.notifyChange() }}
          defaultSeed={slug() || title()}
          onNotifyToast={setToastMessage}
        />

        <EditorSubbar
          onImportClick={() => fileInputRef?.click()}
          onExportClick={handleExport}
          autosaveStatus={autosave.status()}
          lastSavedAt={autosave.lastSavedAt()}
          splitRatio={splitRatio()}
          onSetRatio={setSplitRatio}
          activeTab={activeTab()}
          onSelectTab={setActiveTab}
        />

        <EditorWorkspace
          splitRatio={splitRatio()}
          onSplitRatioChange={setSplitRatio}
          activeTab={activeTab()}
          contentMd={contentMd()}
          onContentChange={val => {
            setContentMd(val)
            autosave.notifyChange()
          }}
          previewHtml={previewHtml()}
          previewLoading={previewLoading()}
          onToolbarInsert={handleToolbarInsert}
          onUploadMedia={() => mediaInputRef?.click()}
          isUploadingMedia={uploadingMedia()}
          textareaRef={el => { textareaRef = el }}
          placeholder={t().postContentPlaceholder}
          previewBadge={t().tabPreview}
        />
      </Show>

      <DiscardDraftDialog
        open={showDiscardDialog()}
        busy={discarding()}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleConfirmDiscardDraft}
      />

      <ConflictDialog
        open={conflictModalOpen()}
        onClose={() => setConflictModalOpen(false)}
        onResolveLocal={() => void handleResolveConflict('local')}
        onResolveRemote={() => void handleResolveConflict('remote')}
      />

      <Toast
        message={toastMessage() ?? ''}
        closeLabel={t().cancelAction}
        onClose={() => setToastMessage(null)}
      />
    </div>
  )
}
