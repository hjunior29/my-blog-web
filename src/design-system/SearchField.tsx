import { Show } from 'solid-js'
import { Icon } from './Icon'

export interface SearchFieldProps {
  readonly value: string
  readonly onInput: (value: string) => void
  readonly onSubmit?: () => void
  readonly onClear?: () => void
  readonly placeholder?: string
  readonly label?: string
  readonly clearLabel?: string
  readonly id?: string
  readonly autofocus?: boolean
}

export function SearchField(props: SearchFieldProps) {
  const inputId = () => props.id ?? 'search-field-input'
  const searchLabel = () => props.label ?? 'Search'
  const clearText = () => props.clearLabel ?? 'Clear search'

  let inputRef: HTMLInputElement | undefined

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      props.onSubmit?.()
    } else if (e.key === 'Escape' && props.value) {
      e.preventDefault()
      props.onInput('')
      props.onClear?.()
    }
  }

  const handleClear = () => {
    props.onInput('')
    props.onClear?.()
    inputRef?.focus()
  }

  return (
    <div class="search-field-container">
      <label for={inputId()} class="sr-only">
        {searchLabel()}
      </label>
      <div class="search-field-wrapper">
        <Icon name="search" size={18} class="search-field-icon" />
        <input
          ref={inputRef}
          id={inputId()}
          type="search"
          role="searchbox"
          enterkeyhint="search"
          autocomplete="off"
          autocorrect="off"
          spellcheck={false}
          class="search-field-input"
          placeholder={props.placeholder ?? 'Search...'}
          value={props.value}
          autofocus={props.autofocus}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Show when={props.value.trim().length > 0}>
          <button
            type="button"
            class="search-field-clear"
            aria-label={clearText()}
            onClick={handleClear}
          >
            <Icon name="x" size={16} />
          </button>
        </Show>
      </div>
    </div>
  )
}
