import { createSignal, Show } from 'solid-js'
import { BookColorPicker, Button, Dialog, Icon, TagInput } from '../../design-system'
import { useI18n } from '../../i18n'
import { apiClient } from '../../lib/api'

export interface EditorMetaCardProps {
  readonly title: string
  readonly onTitleChange: (val: string) => void
  readonly summary: string
  readonly onSummaryChange: (val: string) => void
  readonly tags: string[]
  readonly onTagsChange: (tags: string[]) => void
  readonly bookColor: string | null
  readonly onBookColorChange: (color: string | null) => void
  readonly coverImage: string | null
  readonly onCoverImageChange: (image: string | null) => void
  readonly defaultSeed?: string | number
  readonly onNotifyToast?: (msg: string) => void
}

export function EditorMetaCard(props: EditorMetaCardProps) {
  const { t } = useI18n()
  const [uploading, setUploading] = createSignal(false)
  const [showPreview, setShowPreview] = createSignal(false)
  let coverInputRef: HTMLInputElement | undefined

  const handleFileSelect = async (e: Event) => {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await apiClient.uploadMedia(file)
      props.onCoverImageChange(res.public_url)
      props.onNotifyToast?.(t().mediaUploadedSuccess)
    } catch {
      props.onNotifyToast?.(t().mediaUploadFailed)
    } finally {
      setUploading(false)
      target.value = ''
    }
  }

  return (
    <div class="editor-meta-card">
      <div class="meta-field">
        <div class="meta-label-row">
          <label for="post-title-input" class="form-label">{t().postTitleLabel}</label>
          <span class="char-counter">{props.title.length}/160</span>
        </div>
        <input
          id="post-title-input"
          type="text"
          maxlength={160}
          placeholder={t().postTitlePlaceholder}
          class="form-input editor-title-input"
          value={props.title}
          onInput={e => props.onTitleChange(e.currentTarget.value)}
        />
      </div>

      <div class="meta-field">
        <div class="meta-label-row">
          <label for="post-summary-input" class="form-label">{t().postSummaryLabel}</label>
          <span class="char-counter">{props.summary.length}/320</span>
        </div>
        <input
          id="post-summary-input"
          type="text"
          maxlength={320}
          placeholder={t().postSummaryPlaceholder}
          class="form-input editor-summary-input"
          value={props.summary}
          onInput={e => props.onSummaryChange(e.currentTarget.value)}
        />
      </div>

      <div class="meta-field">
        <label for="post-tags-input" class="form-label">{t().postTagsLabel}</label>
        <TagInput
          id="post-tags-input"
          tags={props.tags}
          onChange={props.onTagsChange}
          placeholder={t().postTagsPlaceholder}
          maxTags={10}
        />
      </div>

      <div class="meta-field">
        <div class="meta-label-row">
          <label class="form-label">{t().coverImageLabel}</label>
          <Show when={props.coverImage}>
            <button
              type="button"
              class="clear-cover-btn"
              onClick={() => props.onCoverImageChange(null)}
              title={t().clearCoverButton}
            >
              {t().clearCoverButton}
            </button>
          </Show>
        </div>
        <div class="cover-input-group">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <Button
            variant="secondary"
            onClick={() => coverInputRef?.click()}
            disabled={uploading()}
            class="cover-upload-btn"
            title={t().uploadCoverButton}
          >
            <Show when={uploading()} fallback={<Icon name="upload" size={14} />}>
              <Icon name="loader" size={14} class="spinner" />
            </Show>
            <span>{uploading() ? t().uploadingMedia : t().uploadCoverButton}</span>
          </Button>
          <Show when={props.coverImage}>
            <button
              type="button"
              class="cover-thumb-preview"
              title={t().coverPreviewAria}
              aria-label={t().coverPreviewAria}
              onClick={() => setShowPreview(true)}
            >
              <img src={props.coverImage!} alt={t().coverPreviewTitle} onError={e => (e.currentTarget.style.display = 'none')} />
              <span class="cover-thumb-overlay" aria-hidden="true">
                <Icon name="zoomIn" size={14} />
              </span>
            </button>
          </Show>
        </div>
      </div>

      <div class="meta-field">
        <BookColorPicker
          value={props.bookColor}
          onChange={props.onBookColorChange}
          label={t().bookColorLabel}
          defaultSeed={props.defaultSeed}
          resetLabel={t().bookColorAuto}
        />
      </div>

      <Show when={props.coverImage}>
        <Dialog
          open={showPreview()}
          title={t().coverPreviewTitle}
          badge="Preview"
          closeLabel={t().close}
          hideFooterClose={true}
          className="cover-preview-dialog"
          onClose={() => setShowPreview(false)}
        >
          <div class="cover-dialog-body">
            <div class="cover-dialog-img-wrap">
              <img src={props.coverImage!} alt={t().coverPreviewTitle} class="cover-dialog-img" />
            </div>
          </div>
        </Dialog>
      </Show>
    </div>
  )
}
