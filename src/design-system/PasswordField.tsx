import { createSignal } from 'solid-js'
import { Icon } from './Icon'

export interface PasswordFieldProps {
  readonly id: string
  readonly name?: string
  readonly class?: string
  readonly value: string
  readonly onInput: (value: string) => void
  readonly autocomplete?: 'current-password' | 'new-password'
  readonly placeholder?: string
  readonly showPasswordLabel?: string
  readonly hidePasswordLabel?: string
  readonly required?: boolean
  readonly disabled?: boolean
  readonly enterkeyhint?: 'done' | 'next' | 'go'
}

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = createSignal(false)

  const showLabel = () => props.showPasswordLabel ?? 'Show password'
  const hideLabel = () => props.hidePasswordLabel ?? 'Hide password'

  return (
    <div class="password-field-wrapper">
      <input
        id={props.id}
        name={props.name ?? props.id}
        type={visible() ? 'text' : 'password'}
        class={`form-input password-field-input${props.class ? ` ${props.class}` : ''}`}
        value={props.value}
        required={props.required}
        disabled={props.disabled}
        autocomplete={props.autocomplete ?? 'current-password'}
        placeholder={props.placeholder ?? '••••••••'}
        enterkeyhint={props.enterkeyhint}
        onInput={(e) => props.onInput(e.currentTarget.value)}
      />
      <button
        type="button"
        class="password-toggle-button"
        aria-label={visible() ? hideLabel() : showLabel()}
        aria-pressed={visible()}
        disabled={props.disabled}
        onClick={() => setVisible(!visible())}
      >
        <Icon name={visible() ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  )
}
