import { Icon } from './Icon'

export type MarkdownSyntax = 'bold' | 'italic' | 'heading' | 'quote' | 'code' | 'list' | 'link'

export interface EditorToolbarProps {
  readonly onInsert: (syntax: MarkdownSyntax) => void
  readonly class?: string
}

export function EditorToolbar(props: EditorToolbarProps) {
  return (
    <div class={`editor-toolbar ${props.class ?? ''}`} role="toolbar" aria-label="Markdown formatting">
      <button
        type="button"
        class="toolbar-btn"
        title="Bold"
        aria-label="Insert bold"
        onClick={() => props.onInsert('bold')}
      >
        <Icon name="bold" size={15} />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Italic"
        aria-label="Insert italic"
        onClick={() => props.onInsert('italic')}
      >
        <Icon name="italic" size={15} />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Heading"
        aria-label="Insert heading"
        onClick={() => props.onInsert('heading')}
      >
        <Icon name="heading" size={15} />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Quote"
        aria-label="Insert quote"
        onClick={() => props.onInsert('quote')}
      >
        <Icon name="quote" size={15} />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Code"
        aria-label="Insert code"
        onClick={() => props.onInsert('code')}
      >
        <Icon name="code" size={15} />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="List"
        aria-label="Insert list"
        onClick={() => props.onInsert('list')}
      >
        <Icon name="list" size={15} />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        title="Link"
        aria-label="Insert link"
        onClick={() => props.onInsert('link')}
      >
        <Icon name="externalLink" size={15} />
      </button>
    </div>
  )
}
