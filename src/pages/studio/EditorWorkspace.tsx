import { Show } from 'solid-js'
import {
  ArticleProse,
  EditorToolbar,
  Icon,
  ResizableSplit,
  type MarkdownSyntax,
} from '../../design-system'

export interface EditorWorkspaceProps {
  readonly splitRatio: number
  readonly onSplitRatioChange: (ratio: number) => void
  readonly activeTab: 'edit' | 'preview'
  readonly contentMd: string
  readonly onContentChange: (value: string) => void
  readonly previewHtml: string
  readonly previewLoading: boolean
  readonly onToolbarInsert: (syntax: MarkdownSyntax) => void
  readonly onUploadMedia?: () => void
  readonly isUploadingMedia?: boolean
  readonly textareaRef?: (el: HTMLTextAreaElement) => void
  readonly placeholder?: string
  readonly previewBadge?: string
}

export function EditorWorkspace(props: EditorWorkspaceProps) {
  return (
    <ResizableSplit
      ratio={props.splitRatio}
      onRatioChange={props.onSplitRatioChange}
      left={
        <div class={`editor-pane ${props.activeTab === 'edit' ? 'show-pane' : 'hide-pane-mobile'}`}>
          <EditorToolbar
            onInsert={props.onToolbarInsert}
            onUploadMedia={props.onUploadMedia}
            isUploadingMedia={props.isUploadingMedia}
          />
          <textarea
            ref={props.textareaRef}
            class="editor-textarea"
            placeholder={props.placeholder}
            value={props.contentMd}
            onInput={e => props.onContentChange(e.currentTarget.value)}
            rows={22}
          />
        </div>
      }
      right={
        <div class={`preview-pane ${props.activeTab === 'preview' ? 'show-pane' : 'hide-pane-mobile'}`}>
          <div class="preview-pane-header">
            <span class="preview-badge">{props.previewBadge ?? 'PREVIEW'}</span>
            <Show when={props.previewLoading}>
              <span class="preview-loading-indicator">
                <Icon name="loader" size={14} class="spinner" />
              </span>
            </Show>
          </div>
          <div class="preview-content-box">
            <Show
              when={props.previewHtml}
              fallback={<p class="preview-placeholder-text">{props.placeholder}</p>}
            >
              <ArticleProse html={props.previewHtml} />
            </Show>
          </div>
        </div>
      }
    />
  )
}
