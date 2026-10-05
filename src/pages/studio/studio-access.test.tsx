import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@solidjs/testing-library'
import { Router, Route } from '@solidjs/router'
import { I18nProvider } from '../../i18n'
import { apiClient } from '../../lib/api'
import { authStore } from '../../lib/auth'
import { StudioAccessPage } from './StudioAccessPage'

describe('StudioAccessPage Two-Factor Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    authStore.setStatus('unauthenticated')
    authStore.setUser(null)
    window.history.pushState({}, '', '/studio/access')
  })

  it('transitions to 2FA challenge and allows verifying code', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValue({
      requires_2fa: true,
      challenge_token: 'test-challenge-uuid',
      email_masked: 'h***a@gmail.com',
      expires_in_seconds: 300,
      resend_cooldown_seconds: 30,
    })

    const verifySpy = vi.spyOn(apiClient, 'verifyTwoFactor').mockResolvedValue({
      user: {
        id: 1,
        email: 'helderjuniorsilvalima@gmail.com',
        display_name: 'Helder',
        role: 'owner',
        status: 'active',
      },
      csrf_token: 'mock-csrf-token',
    })

    const { getByLabelText, getByText, findByText, findByLabelText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/access" component={StudioAccessPage} />
        </Router>
      </I18nProvider>
    ))

    const emailInput = getByLabelText(/^email$/i) as HTMLInputElement
    const passwordInput = getByLabelText(/^password$/i) as HTMLInputElement
    const submitBtn = getByText('Sign in to Studio')

    fireEvent.input(emailInput, { target: { value: 'helderjuniorsilvalima@gmail.com' } })
    fireEvent.input(passwordInput, { target: { value: 'SuaNovaSenhaSegura123!' } })
    fireEvent.click(submitBtn)

    const twoFactorTitle = await findByText('Two-Factor Verification')
    expect(twoFactorTitle).toBeDefined()
    expect(getByText(/h\*\*\*a@gmail\.com/)).toBeDefined()

    const codeInput = (await findByLabelText(/verification code/i)) as HTMLInputElement
    fireEvent.input(codeInput, { target: { value: '566214' } })

    const verifyBtn = getByText('Verify code')
    fireEvent.click(verifyBtn)

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith('test-challenge-uuid', '566214')
    })
  })

  it('supports remember me for 1 week option and passes it through login and 2fa', async () => {
    const loginSpy = vi.spyOn(apiClient, 'login').mockResolvedValue({
      requires_2fa: true,
      challenge_token: 'remember-me-challenge-uuid',
      email_masked: 'h***a@gmail.com',
      expires_in_seconds: 300,
      resend_cooldown_seconds: 30,
    })

    const verifySpy = vi.spyOn(apiClient, 'verifyTwoFactor').mockResolvedValue({
      user: {
        id: 1,
        email: 'helderjuniorsilvalima@gmail.com',
        display_name: 'Helder',
        role: 'owner',
        status: 'active',
      },
      csrf_token: 'mock-csrf-token',
    })

    const { getByLabelText, getByText, findByText, findByLabelText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/access" component={StudioAccessPage} />
        </Router>
      </I18nProvider>
    ))

    const emailInput = getByLabelText(/^email$/i) as HTMLInputElement
    const passwordInput = getByLabelText(/^password$/i) as HTMLInputElement
    const rememberMeCheckbox = getByLabelText(/1 week/i) as HTMLInputElement
    const submitBtn = getByText('Sign in to Studio')

    expect(rememberMeCheckbox.checked).toBe(false)
    fireEvent.click(rememberMeCheckbox)
    expect(rememberMeCheckbox.checked).toBe(true)

    fireEvent.input(emailInput, { target: { value: 'helderjuniorsilvalima@gmail.com' } })
    fireEvent.input(passwordInput, { target: { value: 'SuaNovaSenhaSegura123!' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('helderjuniorsilvalima@gmail.com', 'SuaNovaSenhaSegura123!', true)
    })

    const twoFactorTitle = await findByText('Two-Factor Verification')
    expect(twoFactorTitle).toBeDefined()

    const codeInput = (await findByLabelText(/verification code/i)) as HTMLInputElement
    fireEvent.input(codeInput, { target: { value: '123456' } })

    const verifyBtn = getByText('Verify code')
    fireEvent.click(verifyBtn)

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith('remember-me-challenge-uuid', '123456', true)
    })
  })
})
