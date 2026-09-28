import { createSignal, createEffect, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useI18n } from '../../i18n'
import { authStore } from '../../lib/auth'
import { PasswordField, Button, Alert } from '../../design-system'

export function StudioAccessPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)
  const [error, setError] = createSignal('')

  createEffect(() => {
    if (authStore.status() === 'authenticated') {
      navigate('/studio/posts', { replace: true })
    }
  })

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (submitting()) return

    const trimmedEmail = email().trim()
    const rawPassword = password()

    if (!trimmedEmail || !rawPassword) {
      setError(t().loginFailedGeneric)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await authStore.login({ email: trimmedEmail, password: rawPassword })
      if (authStore.status() === 'authenticated') {
        navigate('/studio/posts', { replace: true })
      } else if (authStore.status() === 'unauthorized') {
        setError(t().unauthorizedDescription)
      } else {
        setError(t().loginFailedGeneric)
      }
    } catch {
      setError(t().loginFailedGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div class="studio-access-page">
      <div class="studio-access-card">
        <header class="studio-access-header">
          <h1 class="serif">{t().studioAccessTitle}</h1>
          <p>{t().studioAccessSubtitle}</p>
        </header>

        <Show when={error()}>
          <div class="studio-access-error">
            <Alert error title={t().error}>
              <p>{error()}</p>
            </Alert>
          </div>
        </Show>

        <form class="studio-access-form" onSubmit={handleSubmit}>
          <div class="form-group">
            <label class="form-label" for="studio-email-input">
              {t().studioEmailLabel}
            </label>
            <input
              id="studio-email-input"
              class="form-input"
              type="email"
              autocomplete="username"
              placeholder={t().studioEmailPlaceholder}
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              disabled={submitting()}
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="studio-password-input">
              {t().passwordLabel}
            </label>
            <PasswordField
              id="studio-password-input"
              value={password()}
              onInput={setPassword}
              showPasswordLabel={t().showPassword}
              hidePasswordLabel={t().hidePassword}
              disabled={submitting()}
              required
            />
          </div>

          <div class="form-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting()}
              aria-busy={submitting()}
            >
              {submitting() ? t().signingInButton : t().signInButton}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
