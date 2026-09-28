import { For, Show, createSignal } from 'solid-js'
import { Icon } from './Icon'

export interface TagInputProps {
  readonly tags: readonly string[]
  readonly onChange: (tags: string[]) => void
  readonly maxTags?: number
  readonly placeholder?: string
  readonly id?: string
  readonly disabled?: boolean
}

export function TagInput(props: TagInputProps) {
  const [inputValue, setInputValue] = createSignal('')
  const max = () => props.maxTags ?? 10
  const inputId = () => props.id ?? 'tag-input'

  const addTag = (text: string) => {
    const trimmed = text.trim().toLowerCase()
    if (!trimmed || trimmed.length > 40) return
    if (props.tags.includes(trimmed)) {
      setInputValue('')
      return
    }
    if (props.tags.length >= max()) return
    props.onChange([...props.tags, trimmed])
    setInputValue('')
  }

  const removeTag = (indexToRemove: number) => {
    props.onChange(props.tags.filter((_, idx) => idx !== indexToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue())
    } else if (e.key === 'Backspace' && !inputValue() && props.tags.length > 0) {
      e.preventDefault()
      removeTag(props.tags.length - 1)
    }
  }

  return (
    <div class="tag-input-container">
      <div class="tag-chips-wrapper">
        <For each={props.tags}>
          {(tag, index) => (
            <span class="tag-chip">
              <span class="tag-chip-text">{tag}</span>
              <button
                type="button"
                class="tag-chip-remove"
                aria-label={`Remove tag ${tag}`}
                disabled={props.disabled}
                onClick={() => removeTag(index())}
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          )}
        </For>

        <Show when={props.tags.length < max()}>
          <input
            id={inputId()}
            type="text"
            class="tag-input-field"
            placeholder={props.placeholder ?? 'Add tags...'}
            aria-label={props.placeholder ?? 'Add tags'}
            value={inputValue()}
            disabled={props.disabled}
            onInput={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue().trim()) {
                addTag(inputValue())
              }
            }}
          />
        </Show>
      </div>
    </div>
  )
}
