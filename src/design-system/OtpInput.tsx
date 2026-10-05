export interface OtpInputProps {
  readonly id?: string
  readonly name?: string
  readonly value: string
  readonly onInput: (value: string) => void
  readonly disabled?: boolean
  readonly autoFocus?: boolean
  readonly placeholder?: string
  readonly required?: boolean
  readonly ariaLabel?: string
  readonly onEnter?: () => void
}

export function OtpInput(props: OtpInputProps) {
  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const raw = e.currentTarget.value
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    props.onInput(digits)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && props.value.length === 6 && props.onEnter) {
      e.preventDefault()
      props.onEnter()
    }
  }

  return (
    <div class="otp-input-wrapper">
      <input
        id={props.id ?? 'otp-input'}
        name={props.name ?? 'otp'}
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        autocomplete="one-time-code"
        maxLength={6}
        class="form-input otp-input-field"
        value={props.value}
        disabled={props.disabled}
        autofocus={props.autoFocus}
        placeholder={props.placeholder ?? '000000'}
        required={props.required}
        aria-label={props.ariaLabel ?? 'Verification code'}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
