import { createSignal, createEffect, onMount, onCleanup, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useI18n } from '../../i18n'
import { authStore } from '../../lib/auth'
import { PasswordField, OtpInput, Button, Alert } from '../../design-system'

export function StudioAccessPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [step, setStep] = createSignal<'credentials' | 'two_factor'>('credentials')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [rememberMe, setRememberMe] = createSignal(false)
  const [challengeToken, setChallengeToken] = createSignal('')
  const [maskedEmail, setMaskedEmail] = createSignal('')
  const [otp, setOtp] = createSignal('')
  const [cooldown, setCooldown] = createSignal(0)
  const [submitting, setSubmitting] = createSignal(false)
  const [resending, setResending] = createSignal(false)
  const [error, setError] = createSignal('')
  const [successMessage, setSuccessMessage] = createSignal('')

  let timerId: ReturnType<typeof setInterval> | null = null

  const startCooldown = (secs: number) => {
    if (timerId) clearInterval(timerId)
    setCooldown(secs)
    timerId = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerId) clearInterval(timerId)
          timerId = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  onCleanup(() => {
    if (timerId) clearInterval(timerId)
  })

  onMount(() => {
    if (authStore.status() === 'unknown') {
      void authStore.checkAuth()
    }
  })

  createEffect(() => {
    if (authStore.status() === 'authenticated') {
      navigate('/studio/posts', { replace: true })
    }
  })

  const handleCredentialsSubmit = async (e: Event) => {
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
    setSuccessMessage('')

    try {
      const result = await authStore.login({
        email: trimmedEmail,
        password: rawPassword,
        remember_me: rememberMe(),
      })
      if (result.requires_2fa) {
        setChallengeToken(result.challenge_token)
        setMaskedEmail(result.email_masked)
        setStep('two_factor')
        setOtp('')
        startCooldown(30)
      } else if (authStore.status() === 'authenticated') {
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

  const handleVerifyOtp = async (e?: Event) => {
    if (e) e.preventDefault()
    if (submitting() || otp().length !== 6) return

    setSubmitting(true)
    setError('')

    try {
      await authStore.verify2Fa(challengeToken(), otp(), rememberMe() ? true : undefined)
      if (authStore.status() === 'authenticated') {
        navigate('/studio/posts', { replace: true })
      } else if (authStore.status() === 'unauthorized') {
        setError(t().unauthorizedDescription)
      } else {
        setError(t().invalidOtp)
      }
    } catch {
      setError(t().invalidOtp)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resending() || cooldown() > 0) return

    setResending(true)
    setError('')
    setSuccessMessage('')

    try {
      const res = await authStore.resend2Fa(challengeToken())
      setChallengeToken(res.challenge_token)
      setMaskedEmail(res.email_masked)
      setSuccessMessage(t().codeResentSuccess)
      startCooldown(30)
    } catch {
      setError(t().loginFailedGeneric)
    } finally {
      setResending(false)
    }
  }

  const handleBackToLogin = () => {
    setStep('credentials')
    setOtp('')
    setError('')
    setSuccessMessage('')
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  return (
    <div class="studio-access-page">
      <div class="studio-access-card">
        <header class="studio-access-header">
          <h1 class="serif">
            {step() === 'two_factor' ? t().twoFactorTitle : t().studioAccessTitle}
          </h1>
          <p>
            {step() === 'two_factor'
              ? `${t().twoFactorSubtitle} (${maskedEmail()})`
              : t().studioAccessSubtitle}
          </p>
        </header>

        <Show when={error()}>
          <div class="studio-access-error">
            <Alert error title={t().error}>
              <p>{error()}</p>
            </Alert>
          </div>
        </Show>

        <Show when={successMessage()}>
          <div class="studio-access-error">
            <Alert title={t().success}>
              <p>{successMessage()}</p>
            </Alert>
          </div>
        </Show>

        <Show
          when={step() === 'two_factor'}
          fallback={
            <form class="studio-access-form" onSubmit={handleCredentialsSubmit}>
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

              <div class="form-group">
                <label class="form-checkbox-group">
                  <input
                    type="checkbox"
                    class="form-checkbox-input"
                    checked={rememberMe()}
                    onChange={(e) => setRememberMe(e.currentTarget.checked)}
                    disabled={submitting()}
                  />
                  <span>{t().rememberMe}</span>
                </label>
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
          }
        >
          <form class="studio-access-form" onSubmit={handleVerifyOtp}>
            <div class="form-group">
              <label class="form-label" for="studio-otp-input">
                {t().otpLabel}
              </label>
              <OtpInput
                id="studio-otp-input"
                value={otp()}
                onInput={setOtp}
                onEnter={handleVerifyOtp}
                disabled={submitting()}
                autoFocus
                placeholder={t().otpPlaceholder}
                required
              />
            </div>

            <div class="form-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={submitting() || otp().length !== 6}
                aria-busy={submitting()}
              >
                {submitting() ? t().verifyingCodeButton : t().verifyCodeButton}
              </Button>
            </div>

            <div class="studio-2fa-footer">
              <Button
                type="button"
                variant="ghost"
                disabled={resending() || cooldown() > 0}
                onClick={handleResend}
              >
                {cooldown() > 0 ? t().resendCooldown(cooldown()) : t().resendCodeButton}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToLogin}
              >
                {t().backToLogin}
              </Button>
            </div>
          </form>
        </Show>
      </div>
    </div>
  )
}
