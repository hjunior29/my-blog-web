import { For, Show } from 'solid-js'
import { BOOK_COLOR_PRESETS, getBookColor } from './bookColors'
import './book-color-picker.css'

export interface BookColorPickerProps {
  readonly value?: string | null
  readonly onChange: (color: string | null) => void
  readonly label?: string
  readonly defaultSeed?: string | number
  readonly resetLabel?: string
  readonly customLabel?: string
}

export function BookColorPicker(props: BookColorPickerProps) {
  const currentColor = () => props.value || getBookColor(undefined, props.defaultSeed)

  return (
    <div class="book-color-picker">
      <span class="book-color-picker-label">
        {props.label ?? 'Book Color'}
      </span>
      <div class="book-color-picker-palette">
        <For each={BOOK_COLOR_PRESETS}>
          {(preset) => {
            const isSelected = () => (props.value ? props.value.toLowerCase() === preset.hex.toLowerCase() : currentColor().toLowerCase() === preset.hex.toLowerCase())
            return (
              <button
                type="button"
                class="book-color-swatch"
                classList={{ active: isSelected() }}
                style={{ '--swatch-color': preset.hex }}
                title={preset.label}
                aria-label={preset.label}
                aria-pressed={isSelected()}
                onClick={() => props.onChange(preset.hex)}
              />
            )
          }}
        </For>
        <div class="book-color-custom-wrapper" title={props.customLabel ?? 'Custom color'}>
          <input
            type="color"
            class="book-color-custom-input"
            value={currentColor()}
            onInput={(e) => props.onChange(e.currentTarget.value)}
            aria-label={props.customLabel ?? 'Custom color'}
          />
          <div class="book-color-custom-btn" aria-hidden="true">+</div>
        </div>
        <Show when={props.value}>
          <button
            type="button"
            class="book-color-reset-btn"
            onClick={() => props.onChange(null)}
          >
            {props.resetLabel ?? 'Auto preset'}
          </button>
        </Show>
      </div>
    </div>
  )
}
