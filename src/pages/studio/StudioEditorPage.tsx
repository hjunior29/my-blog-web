import { A, useNavigate, useParams } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { useI18n } from '../../i18n'
import { apiClient, ApiError, type PostResponse, type PostStatus } from '../../lib/api'
import {
  Alert,
  ArticleProse,
  Button,
  Dialog,
  EditorToolbar,
  Icon,
  Skeleton,
  StatusBadge,
  TagInput,
  Toast,
  type MarkdownSyntax,
} from '../../design-system'
import {
  downloadMarkdownFile,
  formatMarkdownInsertion,
  readMarkdownFile,
} from './editorUtils'
import './studio-editor.css'

export function StudioEditorPage() {
  const { t } = useI18n()
  const params = useParams()
  const navigate = useNavigate()

  const isEditMode = () => Boolean(params.id)

  const [loading, setLoading] = createSignal(isEditMode())
  const [saving, setSaving] = createSignal(false)
  const [publishing, setPublishing] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [toastMessage, setToastMessage] = createSignal<string | null>(null)

  const [title, setTitle] = createSignal('')
  const [summary, setSummary] = createSignal('')
  const [contentMd, setContentMd] = createSignal('')
  const [tags, setTags] = createSignal<string[]>([])
  const [status, setStatus] = createSignal<PostStatus>('draft')
  const [slug, setSlug] = createSignal('')
  const [etag, setEtag] = createSignal<string | undefined>(undefined)
  const [version, setVersion] = createSignal<number | undefined>(undefined)

  const [previewHtml, setPreviewHtml] = createSignal('')
  const [previewLoading, setPreviewLoading] = createSignal(false)
  const [activeTab, setActiveTab] = createSignal<'edit' | 'preview'>('edit')
  const [conflictModalOpen, setConflictModalOpen] = createSignal(false)

  let fileInputRef: HTMLInputElement | undefined
  let textareaRef: HTMLTextAreaElement | undefined
  let previewTimer: ReturnType<typeof setTimeout> | undefined

  const applyPostData = (post: PostResponse, newEtag?: string) => {
    setTitle(post.title)
    setSummary(post.summary ?? '')
    setContentMd(post.content_md)
    setTags(post.tags.map(t => (typeof t === 'string' ? t : t.name)))
    setStatus(post.status)
    setSlug(post.slug)
    setVersion(post.version)
    if (newEtag) setEtag(newEtag)
  }

  const loadPost = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getAdminPost(id)
      applyPostData(res.post, res.etag)
      void updatePreview(res.post.content_md)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t().genericErrorMessage
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    if (params.id) {
      void loadPost(params.id)
    }
  })

  const updatePreview = async (markdown: string) => {
    if (!markdown.trim()) {
      setPreviewHtml('')
      return
    }
    setPreviewLoading(true)
    try {
      const res = await apiClient.previewPost({ content_md: markdown })
      setPreviewHtml(res.content_html)
    } catch {
      // preview fallback
    } finally {
      setPreviewLoading(false)
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
    if (previewTimer) clearTimeout(previewTimer)
  })

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
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    }, 0)
  }

  const handleExport = () => {
    downloadMarkdownFile(slug() || 'article', contentMd())
  }

  const handleImport = (file: File) => {
    readMarkdownFile(file, (text) => {
      setContentMd(text)
      setToastMessage(t().markdownImportedSuccess)
    })
  }

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
      const msg = err instanceof Error ? err.message : t().genericErrorMessage
      setError(msg)
    }
  }

  const handleSaveDraft = async () => {
    const currentTitle = title().trim()
    if (!currentTitle) {
      setError(t().titleRequiredError)
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (!params.id) {
        const res = await apiClient.createPost({
          title: currentTitle,
          summary: summary().trim() || undefined,
          content_md: contentMd(),
          tags: tags(),
          status: 'draft',
        })
        setToastMessage(t().draftCreatedSuccess)
        navigate(`/studio/posts/${res.post.id}/edit`, { replace: true })
      } else {
        const res = await apiClient.updatePost(
          params.id,
          {
            title: currentTitle,
            summary: summary().trim() || undefined,
            content_md: contentMd(),
            tags: tags(),
            version: version() ?? 1,
          },
          etag(),
        )
        applyPostData(res.post, res.etag)
        setToastMessage(t().draftUpdatedSuccess)
      }
    } catch (err: unknown) {
      if (!handleConflict(err)) {
        const msg = err instanceof Error ? err.message : t().genericErrorMessage
        setError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePublishToggle = async () => {
    if (!params.id) {
      await handleSaveDraft()
      return
    }

    setPublishing(true)
    setError(null)
    try {
      if (status() === 'published') {
        const res = await apiClient.unpublishPost(params.id, etag())
        applyPostData(res.post, res.etag)
        setToastMessage(t().articleUnpublishedSuccess)
      } else {
        const res = await apiClient.publishPost(params.id, etag())
        applyPostData(res.post, res.etag)
        setToastMessage(t().articlePublishedSuccess)
      }
    } catch (err: unknown) {
      if (!handleConflict(err)) {
        const msg = err instanceof Error ? err.message : t().genericErrorMessage
        setError(msg)
      }
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div class="studio-editor-page">
      <div class="editor-header-bar">
        <div class="editor-header-left">
          <A href="/studio/posts" class="editor-back-link" aria-label={t().backToPostsAction}>
            <Icon name="arrowLeft" size={18} />
          </A>
          <h1 class="serif editor-page-title">
            {isEditMode() ? t().editorEditTitle : t().editorNewTitle}
          </h1>
          <StatusBadge status={status()} />
        </div>

        <div class="editor-header-actions">
          <input
            type="file"
            ref={fileInputRef}
            accept=".md,text/markdown"
            class="sr-only"
            onChange={e => {
              const file = e.currentTarget.files?.[0]
              if (file) handleImport(file)
            }}
          />
          <Button
            variant="ghost"
            onClick={() => fileInputRef?.click()}
            title={t().importMarkdownButton}
            aria-label={t().importMarkdownButton}
          >
            <Icon name="upload" size={16} />
            <span class="btn-label-desktop">{t().importMarkdownButton}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleExport}
            title={t().exportMarkdownButton}
            aria-label={t().exportMarkdownButton}
          >
            <Icon name="download" size={16} />
            <span class="btn-label-desktop">{t().exportMarkdownButton}</span>
          </Button>

          <Button
            variant="secondary"
            busy={saving()}
            disabled={saving() || publishing()}
            onClick={handleSaveDraft}
          >
            {saving() ? t().savingButton : t().saveDraftButton}
          </Button>

          <Button
            variant="primary"
            busy={publishing()}
            disabled={saving() || publishing()}
            onClick={handlePublishToggle}
          >
            {status() === 'published' ? t().unpublishButton : t().publishButton}
          </Button>
        </div>
      </div>

      <Show when={error()}>
        <div class="editor-alert-wrapper">
          <Alert error title={t().genericErrorMessage}>
            <p>{error()}</p>
          </Alert>
        </div>
      </Show>

      <Show when={loading()}>
        <div class="editor-loading-state" aria-busy="true">
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
        </div>
      </Show>

      <Show when={!loading()}>
        <div class="editor-meta-card">
          <div class="meta-field">
            <div class="meta-label-row">
              <label for="post-title-input" class="form-label">{t().postTitleLabel}</label>
              <span class="char-counter">{title().length}/160</span>
            </div>
            <input
              id="post-title-input"
              type="text"
              maxlength={160}
              placeholder={t().postTitlePlaceholder}
              class="form-input editor-title-input"
              value={title()}
              onInput={e => setTitle(e.currentTarget.value)}
            />
          </div>

          <div class="meta-field">
            <div class="meta-label-row">
              <label for="post-summary-input" class="form-label">{t().postSummaryLabel}</label>
              <span class="char-counter">{summary().length}/320</span>
            </div>
            <input
              id="post-summary-input"
              type="text"
              maxlength={320}
              placeholder={t().postSummaryPlaceholder}
              class="form-input editor-summary-input"
              value={summary()}
              onInput={e => setSummary(e.currentTarget.value)}
            />
          </div>

          <div class="meta-field">
            <label for="post-tags-input" class="form-label">{t().postTagsLabel}</label>
            <TagInput
              id="post-tags-input"
              tags={tags()}
              onChange={setTags}
              placeholder={t().postTagsPlaceholder}
              maxTags={10}
            />
          </div>
        </div>

        <div class="editor-view-toggle-bar" role="tablist" aria-label="Editor view modes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab() === 'edit'}
            class={`tab-toggle-btn ${activeTab() === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <Icon name="edit" size={14} />
            {t().tabEdit}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab() === 'preview'}
            class={`tab-toggle-btn ${activeTab() === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Icon name="eye" size={14} />
            {t().tabPreview}
          </button>
        </div>

        <div class="studio-editor-workspace">
          <div class={`editor-pane ${activeTab() === 'edit' ? 'show-pane' : 'hide-pane-mobile'}`}>
            <EditorToolbar onInsert={handleToolbarInsert} />

            <textarea
              ref={textareaRef}
              class="editor-textarea"
              placeholder={t().postContentPlaceholder}
              value={contentMd()}
              onInput={e => setContentMd(e.currentTarget.value)}
              rows={22}
            />
          </div>

          <div class={`preview-pane ${activeTab() === 'preview' ? 'show-pane' : 'hide-pane-mobile'}`}>
            <div class="preview-pane-header">
              <span class="preview-badge">{t().tabPreview}</span>
              <Show when={previewLoading()}>
                <span class="preview-loading-indicator">
                  <Icon name="loader" size={14} class="spinner" />
                </span>
              </Show>
            </div>

            <div class="preview-content-box">
              <Show when={previewHtml()} fallback={
                <p class="preview-placeholder-text">
                  {t().postContentPlaceholder}
                </p>
              }>
                <ArticleProse html={previewHtml()} />
              </Show>
            </div>
          </div>
        </div>
      </Show>

      <Dialog
        open={conflictModalOpen()}
        title={t().conflictTitle}
        badge="Conflict"
        closeLabel={t().cancelAction}
        onClose={() => setConflictModalOpen(false)}
      >
        <div class="conflict-dialog-body">
          <p class="conflict-dialog-text">{t().conflictMessage}</p>
          <div class="conflict-actions-row">
            <Button
              variant="secondary"
              onClick={() => void handleResolveConflict('local')}
            >
              {t().conflictResolveLocal}
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleResolveConflict('remote')}
            >
              {t().conflictResolveRemote}
            </Button>
          </div>
        </div>
      </Dialog>

      <Toast
        message={toastMessage() ?? ''}
        closeLabel={t().cancelAction}
        onClose={() => setToastMessage(null)}
      />
    </div>
  )
}
