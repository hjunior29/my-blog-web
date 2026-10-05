import { A } from '@solidjs/router'
import { Show } from 'solid-js'
import { Button, Icon, StatusBadge } from '../../design-system'
import { useI18n } from '../../i18n'
import type { PostStatus } from '../../lib/api'

export interface EditorHeaderBarProps {
  readonly isEditMode: boolean
  readonly status: PostStatus
  readonly hasDraft: boolean
  readonly currentId?: string
  readonly loading: boolean
  readonly saving: boolean
  readonly publishing: boolean
  readonly unpublishing?: boolean
  readonly archiving: boolean
  readonly discarding: boolean
  readonly onArchiveToggle: () => void
  readonly onDiscardDraft: () => void
  readonly onSaveDraft: () => void
  readonly onPublish: () => void
  readonly onUnpublish?: () => void
}

export function EditorHeaderBar(props: EditorHeaderBarProps) {
  const { t } = useI18n()

  const isBusy = () =>
    props.loading || props.saving || props.publishing || props.unpublishing || props.archiving || props.discarding

  return (
    <div class="editor-header-bar">
      <div class="editor-header-left">
        <A href="/studio/posts" class="editor-back-link" aria-label={t().backToPostsAction}>
          <Icon name="arrowLeft" size={18} />
        </A>
        <h1 class="serif editor-page-title">
          {props.isEditMode ? t().editorEditTitle : t().editorNewTitle}
        </h1>
        <div class="editor-badges-group">
          <StatusBadge status={props.status} />
          <Show when={props.status === 'published' && props.hasDraft}>
            <span
              class="draft-revision-badge"
              title={t().hasDraftBadge}
              aria-label={t().hasDraftBadge}
              role="status"
            >
              <Icon name="fileText" size={13} />
            </span>
          </Show>
        </div>

        <Show when={props.currentId}>
          <div class="editor-lifecycle-actions desktop-only">
            <Button
              variant="ghost"
              busy={props.archiving}
              disabled={isBusy()}
              onClick={props.onArchiveToggle}
              class="header-lifecycle-btn"
              title={props.status === 'archived' ? t().unarchiveButton : t().archiveButton}
            >
              <Icon name="archive" size={15} />
              <span class="btn-text-desktop">{props.status === 'archived' ? t().unarchiveButton : t().archiveButton}</span>
            </Button>

            <Show when={props.status === 'published' && props.onUnpublish}>
              <Button
                variant="ghost"
                busy={props.unpublishing}
                disabled={isBusy()}
                onClick={props.onUnpublish}
                class="header-lifecycle-btn unpublish-btn"
                title={t().unpublishButton}
              >
                <Icon name="eyeOff" size={15} />
                <span class="btn-text-desktop">{t().unpublishButton}</span>
              </Button>
            </Show>
          </div>
        </Show>
      </div>

      <div class="editor-header-actions">
        <div class="editor-actions-secondary mobile-only">
          <Show when={props.currentId}>
            <Button
              variant="ghost"
              busy={props.archiving}
              disabled={isBusy()}
              onClick={props.onArchiveToggle}
            >
              <Icon name="archive" size={15} />
              <span>{props.status === 'archived' ? t().unarchiveButton : t().archiveButton}</span>
            </Button>
          </Show>

          <Show when={props.status === 'published' && props.onUnpublish}>
            <Button
              variant="ghost"
              busy={props.unpublishing}
              disabled={isBusy()}
              onClick={props.onUnpublish}
              class="unpublish-btn"
            >
              <Icon name="eyeOff" size={15} />
              <span>{t().unpublishButton}</span>
            </Button>
          </Show>

          <Show when={props.status === 'published' && props.hasDraft}>
            <Button
              variant="ghost"
              busy={props.discarding}
              disabled={isBusy()}
              onClick={props.onDiscardDraft}
              class="discard-draft-btn"
            >
              <Icon name="close" size={14} />
              <span>{t().discardDraftButton}</span>
            </Button>
          </Show>
        </div>

        <div class="editor-actions-primary">
          <Show when={props.status === 'published' && props.hasDraft}>
            <Button
              variant="ghost"
              busy={props.discarding}
              disabled={isBusy()}
              onClick={props.onDiscardDraft}
              class="discard-draft-btn desktop-only"
              title={t().discardDraftButton}
            >
              <Icon name="close" size={14} />
              <span class="btn-text-desktop">{t().discardDraftButton}</span>
            </Button>
          </Show>

          <Button
            variant="secondary"
            busy={props.saving}
            disabled={isBusy()}
            onClick={props.onSaveDraft}
          >
            {props.saving ? t().savingButton : t().saveDraftButton}
          </Button>

          <Show
            when={props.status === 'published'}
            fallback={
              <Button
                variant="primary"
                busy={props.publishing}
                disabled={isBusy()}
                onClick={props.onPublish}
              >
                {t().publishButton}
              </Button>
            }
          >
            <Button
              variant="primary"
              busy={props.publishing}
              disabled={isBusy() || !props.hasDraft}
              onClick={props.onPublish}
            >
              {t().publishNewVersionButton}
            </Button>
          </Show>
        </div>
      </div>
    </div>
  )
}
