import { Show } from 'solid-js'
import { Button, Icon } from '../../design-system'
import type { AutosaveStatus } from './useAutosave'
import { useI18n } from '../../i18n'

export interface EditorSubbarProps {
  readonly onImportClick: () => void
  readonly onExportClick: () => void
  readonly autosaveStatus: AutosaveStatus
  readonly lastSavedAt: Date | null
  readonly splitRatio: number
  readonly onSetRatio: (ratio: number) => void
  readonly activeTab: 'edit' | 'preview'
  readonly onSelectTab: (tab: 'edit' | 'preview') => void
}

export function EditorSubbar(props: EditorSubbarProps) {
  const { t } = useI18n()

  const getStatusTooltip = () => {
    switch (props.autosaveStatus) {
      case 'unsaved':
        return t().autosaveUnsaved
      case 'saving':
        return t().autosaveSaving
      case 'saved':
        return t().autosaveSaved
      case 'paused':
        return t().autosavePaused
      default:
        return t().autosaveActive
    }
  }

  return (
    <div class="editor-subbar">
      <div class="editor-subbar-left">
        <Button
          variant="ghost"
          onClick={props.onImportClick}
          title={t().importMarkdownButton}
          aria-label={t().importMarkdownButton}
          class="subbar-action-btn"
        >
          <Icon name="upload" size={15} />
          <span>{t().importMarkdownButton}</span>
        </Button>

        <Button
          variant="ghost"
          onClick={props.onExportClick}
          title={t().exportMarkdownButton}
          aria-label={t().exportMarkdownButton}
          class="subbar-action-btn"
        >
          <Icon name="download" size={15} />
          <span>{t().exportMarkdownButton}</span>
        </Button>

        <div class="subbar-action-divider" aria-hidden="true" />

        <div
          class="autosave-status-badge"
          data-status={props.autosaveStatus}
          title={getStatusTooltip()}
          aria-label={getStatusTooltip()}
        >
          <Show when={props.autosaveStatus === 'unsaved'}>
            <span class="status-indicator unsaved">
              <span class="dot-unsaved" />
            </span>
          </Show>
          <Show when={props.autosaveStatus === 'saving'}>
            <span class="status-indicator saving">
              <Icon name="loader" size={14} class="spinner" />
            </span>
          </Show>
          <Show when={props.autosaveStatus === 'saved'}>
            <span class="status-indicator saved">
              <Icon name="check" size={14} />
            </span>
          </Show>
          <Show when={props.autosaveStatus === 'paused'}>
            <span class="status-indicator paused">
              <Icon name="pause" size={12} />
            </span>
          </Show>
          <Show when={props.autosaveStatus === 'idle'}>
            <span class="status-indicator idle">
              <span class="dot-idle" />
            </span>
          </Show>
        </div>
      </div>

      <div class="editor-subbar-right">
        <div class="split-presets desktop-only" role="group" aria-label={t().viewModeSplit}>
          <button
            type="button"
            class={`preset-btn ${props.splitRatio === 100 ? 'active' : ''}`}
            onClick={() => props.onSetRatio(100)}
            title={t().viewModeEditor}
            aria-label={t().viewModeEditor}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            type="button"
            class={`preset-btn ${Math.round(props.splitRatio) === 50 ? 'active' : ''}`}
            onClick={() => props.onSetRatio(50)}
            title="50 / 50"
            aria-label="50 / 50"
          >
            <span class="split-preset-half">
              <Icon name="edit" size={12} />
              <span class="split-preset-slash">/</span>
              <Icon name="eye" size={12} />
            </span>
          </button>
          <button
            type="button"
            class={`preset-btn ${props.splitRatio === 0 ? 'active' : ''}`}
            onClick={() => props.onSetRatio(0)}
            title={t().viewModePreview}
            aria-label={t().viewModePreview}
          >
            <Icon name="eye" size={14} />
          </button>
        </div>

        <div class="editor-view-toggle-bar mobile-only" role="tablist" aria-label="Editor view modes">
          <button
            type="button"
            role="tab"
            aria-selected={props.activeTab === 'edit'}
            class={`tab-toggle-btn ${props.activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => props.onSelectTab('edit')}
          >
            <Icon name="edit" size={14} />
            {t().tabEdit}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={props.activeTab === 'preview'}
            class={`tab-toggle-btn ${props.activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => props.onSelectTab('preview')}
          >
            <Icon name="eye" size={14} />
            {t().tabPreview}
          </button>
        </div>
      </div>
    </div>
  )
}
