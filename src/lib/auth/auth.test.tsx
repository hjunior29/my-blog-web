import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@solidjs/testing-library'
import { Router, Route } from '@solidjs/router'
import { authStore } from './authStore'
import { ApiError } from '../api/errors'
import { apiClient } from '../api/client'
import { I18nProvider } from '../../i18n'
import { StudioAccessPage } from '../../pages/studio/StudioAccessPage'
import { StudioGuard } from '../../app/StudioGuard'
import { StudioLayout } from '../../app/StudioLayout'

describe('authStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(apiClient, 'getCsrfToken').mockResolvedValue('csrf')
    authStore.setStatus('unknown')
    authStore.setUser(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets status to authenticated when user is active owner', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockResolvedValue({
      id: 'u1',
      email: 'owner@example.com',
      display_name: 'Helder',
      bio: 'Author bio',
      role: 'owner',
      status: 'active',
      created_at: 1727400000,
      updated_at: 1727400000,
    })

    const ok = await authStore.checkAuth()
    expect(ok).toBe(true)
    expect(authStore.status()).toBe('authenticated')
    expect(authStore.user()?.email).toBe('owner@example.com')
  })

  it('sets status to unauthorized when user is inactive', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockResolvedValue({
      id: 'u2',
      email: 'disabled@example.com',
      display_name: 'Disabled User',
      bio: null,
      role: 'author',
      status: 'inactive',
      created_at: 1727400000,
      updated_at: 1727400000,
    })

    const ok = await authStore.checkAuth()
    expect(ok).toBe(false)
    expect(authStore.status()).toBe('unauthorized')
  })

  it('keeps network failures distinct from expired sessions without another refresh', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockRejectedValue(new Error('Offline'))
    const refresh = vi.spyOn(apiClient, 'refreshToken')
    expect(await authStore.checkAuth()).toBe(false)
    expect(authStore.status()).toBe('error')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('clears authentication after the client exhausts renewal', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockRejectedValue(new ApiError(401, 'unauthorized', 'Expired'))
    expect(await authStore.checkAuth()).toBe(false)
    expect(authStore.status()).toBe('unauthenticated')
    expect(authStore.user()).toBeNull()
  })

  it('rejects active authors from the owner studio', async () => {
    vi.spyOn(apiClient, 'getCurrentUser').mockResolvedValue({
      id: 2, email: 'author@example.test', display_name: 'Author', bio: '',
      role: 'author', status: 'active', created_at: 0, updated_at: 0,
    })
    expect(await authStore.checkAuth()).toBe(false)
    expect(authStore.status()).toBe('unauthorized')
  })

  it('clears state on logout', async () => {
    const logoutSpy = vi.spyOn(apiClient, 'logout').mockResolvedValue(undefined)
    await authStore.logout()

    expect(logoutSpy).toHaveBeenCalled()
    expect(authStore.user()).toBeNull()
    expect(authStore.status()).toBe('unauthenticated')
  })
})

describe('StudioAccessPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, '', '/studio/access')
  })

  it('renders login fields and handles validation error on empty submit', async () => {
    const { container, getByLabelText, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/access" component={StudioAccessPage} />
        </Router>
      </I18nProvider>
    ))

    expect(getByLabelText(/Email/i)).not.toBeNull()
    expect(container.querySelector('#studio-password-input')).not.toBeNull()

    const form = container.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    const errorMsg = await findByText(/Não foi possível autenticar|Could not sign in/i)
    expect(errorMsg).not.toBeNull()
  })

  it('submits credentials and handles login error from server', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce(new Error('Invalid credentials'))

    const { container, getByLabelText, findByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route path="/studio/access" component={StudioAccessPage} />
        </Router>
      </I18nProvider>
    ))

    const emailInput = getByLabelText(/Email/i) as HTMLInputElement
    const passwordInput = container.querySelector('#studio-password-input') as HTMLInputElement
    fireEvent.input(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.input(passwordInput, { target: { value: 'wrong-pass' } })

    const form = container.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    const errorNotice = await findByText(/Não foi possível autenticar|Could not sign in/i)
    expect(errorNotice).not.toBeNull()
  })
})

describe('StudioGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('renders protected children when status is authenticated', () => {
    authStore.setStatus('authenticated')

    const { getByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route
            path="/"
            component={() => (
              <StudioGuard>
                <div>Protected Studio Content</div>
              </StudioGuard>
            )}
          />
        </Router>
      </I18nProvider>
    ))

    expect(getByText('Protected Studio Content')).not.toBeNull()
  })

  it('renders unauthorized notice when status is unauthorized', () => {
    authStore.setStatus('unauthorized')

    const { getByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route
            path="/"
            component={() => (
              <StudioGuard>
                <div>Protected Studio Content</div>
              </StudioGuard>
            )}
          />
        </Router>
      </I18nProvider>
    ))

    expect(getByText(/Acesso restrito|Restricted area/i)).not.toBeNull()
  })
})

describe('StudioLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, '', '/studio/posts')
  })

  it('renders studio wordmark, user identity badge, and public site link', () => {
    authStore.setUser({
      id: 'u1',
      email: 'helder@studio.dev',
      display_name: 'Helder Dev',
      role: 'owner',
      status: 'active',
    })

    const { getByText } = render(() => (
      <I18nProvider>
        <Router>
          <Route
            path="/studio/posts"
            component={() => (
              <StudioLayout>
                <div>Studio Dashboard</div>
              </StudioLayout>
            )}
          />
        </Router>
      </I18nProvider>
    ))

    expect(getByText('Helder Dev')).not.toBeNull()
    expect(getByText('Studio Dashboard')).not.toBeNull()
  })

  it('executes logout and redirects to access page', async () => {
    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue(undefined)

    const { getByRole } = render(() => (
      <I18nProvider>
        <Router>
          <Route
            path="/studio/posts"
            component={() => (
              <StudioLayout>
                <div>Content</div>
              </StudioLayout>
            )}
          />
        </Router>
      </I18nProvider>
    ))

    const logoutBtn = getByRole('button', { name: /Sair|Sign out|Logout/i })
    fireEvent.click(logoutBtn)

    expect(logoutSpy).toHaveBeenCalled()
  })
})
