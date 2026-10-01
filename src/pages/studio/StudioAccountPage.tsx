import { createSignal, For, onMount, Show } from 'solid-js'
import { useI18n } from '../../i18n'
import { apiClient, formatDate, unixSecondsToMs, type SessionItemResponse } from '../../lib/api'
import { authStore } from '../../lib/auth'
import { Alert, Button, Icon, PasswordField, Skeleton, Toast } from '../../design-system'
import './studio-account.css'

export function StudioAccountPage() {
  const { t, locale } = useI18n()

  const [displayName, setDisplayName] = createSignal('')
  const [bio, setBio] = createSignal('')
  const [savingProfile, setSavingProfile] = createSignal(false)
  const [profileError, setProfileError] = createSignal<string | null>(null)

  const [currentPassword, setCurrentPassword] = createSignal('')
  const [newPassword, setNewPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [changingPassword, setChangingPassword] = createSignal(false)
  const [passwordError, setPasswordError] = createSignal<string | null>(null)

  const [sessions, setSessions] = createSignal<SessionItemResponse[]>([])
  const [loadingSessions, setLoadingSessions] = createSignal(true)
  const [revokingSessionId, setRevokingSessionId] = createSignal<string | null>(null)
  const [sessionsError, setSessionsError] = createSignal<string | null>(null)

  const [toastMessage, setToastMessage] = createSignal<string | null>(null)

  const loadUserData = async () => {
    try {
      const u = await apiClient.getCurrentUser()
      setDisplayName(u.display_name)
      setBio(u.bio ?? '')
      authStore.setUser({
        id: u.id,
        email: u.email,
        display_name: u.display_name,
        bio: u.bio,
        role: u.role,
        status: u.status,
      })
    } catch {
      const current = authStore.user()
      if (current) {
        setDisplayName(current.display_name)
        setBio(current.bio ?? '')
      }
    }
  }

  const loadSessions = async () => {
    setLoadingSessions(true)
    setSessionsError(null)
    try {
      const res = await apiClient.getSessions()
      setSessions([...res.items])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t().genericErrorMessage
      setSessionsError(msg)
    } finally {
      setLoadingSessions(false)
    }
  }

  onMount(() => {
    void loadUserData()
    void loadSessions()
  })

  const handleSaveProfile = async (e: Event) => {
    e.preventDefault()
    const name = displayName().trim()
    if (!name) {
      setProfileError(t().displayNameRequiredError)
      return
    }

    setSavingProfile(true)
    setProfileError(null)
    try {
      const updated = await apiClient.updateProfile({
        display_name: name,
        bio: bio().trim(),
      })
      authStore.setUser({
        id: updated.id,
        email: updated.email,
        display_name: updated.display_name,
        bio: updated.bio,
        role: updated.role,
        status: updated.status,
      })
      setToastMessage(t().profileSavedSuccess)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t().genericErrorMessage
      setProfileError(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: Event) => {
    e.preventDefault()
    if (!currentPassword()) {
      setPasswordError(t().currentPasswordRequiredError)
      return
    }
    if (Array.from(newPassword()).length < 15 || Array.from(newPassword()).length > 128 || new TextEncoder().encode(newPassword()).length > 512) {
      setPasswordError(t().newPasswordMinLengthError)
      return
    }
    if (newPassword() !== confirmPassword()) {
      setPasswordError(t().passwordsDoNotMatchError)
      return
    }

    setChangingPassword(true)
    setPasswordError(null)
    try {
      await apiClient.changePassword({
        current_password: currentPassword(),
        new_password: newPassword(),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setToastMessage(t().passwordUpdatedSuccess)
      await loadSessions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t().genericErrorMessage
      setPasswordError(msg)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId)
    setSessionsError(null)
    try {
      const current = sessions().find(session => session.id === sessionId)?.is_current
      await apiClient.revokeSession(sessionId)
      if (current) {
        authStore.setUser(null)
        authStore.setStatus('unauthenticated')
      }
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      setToastMessage(t().sessionRevokedSuccess)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t().genericErrorMessage
      setSessionsError(msg)
    } finally {
      setRevokingSessionId(null)
    }
  }

  return (
    <div class="studio-account-page">
      <div class="studio-account-header">
        <h1 class="serif">{t().studioAccountTitle}</h1>
      </div>

      <div class="account-sections-grid">
        <section class="account-card profile-card" aria-labelledby="profile-heading">
          <h2 id="profile-heading" class="account-card-title">{t().displayNameLabel}</h2>

          <Show when={profileError()}>
            <div class="account-alert-wrapper">
              <Alert error title={t().genericErrorMessage}>
                <p>{profileError()}</p>
              </Alert>
            </div>
          </Show>

          <form onSubmit={handleSaveProfile} class="account-form">
            <div class="form-group">
              <label for="display-name" class="form-label">{t().displayNameLabel}</label>
              <input
                id="display-name"
                type="text"
                class="form-input"
                value={displayName()}
                onInput={e => setDisplayName(e.currentTarget.value)}
                required
                maxlength={100}
              />
            </div>

            <div class="form-group">
              <label for="bio-input" class="form-label">{t().bioLabel}</label>
              <textarea
                id="bio-input"
                class="form-textarea"
                rows={3}
                value={bio()}
                onInput={e => setBio(e.currentTarget.value)}
                maxlength={300}
              />
            </div>

            <div class="account-form-actions">
              <Button
                type="submit"
                variant="primary"
                busy={savingProfile()}
                disabled={savingProfile()}
              >
                {t().saveProfileButton}
              </Button>
            </div>
          </form>
        </section>

        <section class="account-card password-card" aria-labelledby="password-heading">
          <h2 id="password-heading" class="account-card-title">{t().changePasswordTitle}</h2>

          <Show when={passwordError()}>
            <div class="account-alert-wrapper">
              <Alert error title={t().genericErrorMessage}>
                <p>{passwordError()}</p>
              </Alert>
            </div>
          </Show>

          <form onSubmit={handleChangePassword} class="account-form">
            <div class="form-group">
              <label for="current-password" class="form-label">{t().currentPasswordLabel}</label>
              <PasswordField
                id="current-password"
                value={currentPassword()}
                onInput={setCurrentPassword}
                autocomplete="current-password"
                required
              />
            </div>

            <div class="form-group">
              <label for="new-password" class="form-label">{t().newPasswordLabel}</label>
              <PasswordField
                id="new-password"
                value={newPassword()}
                onInput={setNewPassword}
                autocomplete="new-password"
                required
              />
            </div>

            <div class="form-group">
              <label for="confirm-password" class="form-label">{t().confirmPasswordLabel}</label>
              <PasswordField
                id="confirm-password"
                value={confirmPassword()}
                onInput={setConfirmPassword}
                autocomplete="new-password"
                required
              />
            </div>

            <div class="account-form-actions">
              <Button
                type="submit"
                variant="primary"
                busy={changingPassword()}
                disabled={changingPassword()}
              >
                {t().updatePasswordButton}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <section class="account-card sessions-card" aria-labelledby="sessions-heading">
        <div class="sessions-header-row">
          <div>
            <h2 id="sessions-heading" class="account-card-title">{t().activeSessionsTitle}</h2>
          </div>
          <Button variant="ghost" size="small" onClick={loadSessions} aria-label={t().retryAction}>
            <Icon name="retry" size={14} />
          </Button>
        </div>

        <Show when={sessionsError()}>
          <div class="account-alert-wrapper">
            <Alert error title={t().genericErrorMessage}>
              <p>{sessionsError()}</p>
            </Alert>
          </div>
        </Show>

        <Show when={loadingSessions() && sessions().length === 0}>
          <div class="sessions-skeleton-list" aria-busy="true">
            <Skeleton label={t().loadingMessage} />
            <Skeleton label={t().loadingMessage} />
          </div>
        </Show>

        <Show when={!loadingSessions() && sessions().length === 0 && !sessionsError()}>
          <p class="sessions-empty-text">{t().emptyStateMessage}</p>
        </Show>

        <Show when={sessions().length > 0}>
          <ul class="sessions-list" role="list">
            <For each={sessions()}>
              {session => (
                <li class={`session-item ${session.is_current ? 'current' : ''}`}>
                  <div class="session-info">
                    <div class="session-agent-row">
                      <span class="session-agent-text">
                        {session.user_agent || t().unknownDeviceFallback}
                      </span>
                      <Show when={session.is_current}>
                        <span class="badge accent">{t().currentSessionBadge}</span>
                      </Show>
                    </div>

                    <div class="session-meta-row">
                      <Show when={session.ip_address}>
                        <span class="session-ip">IP: {session.ip_address}</span>
                      </Show>
                      <span class="session-date">
                        {formatDate(unixSecondsToMs(session.created_at), locale())}
                      </span>
                    </div>
                  </div>

                  <Show when={!session.is_current}>
                    <div class="session-actions">
                      <Button
                        variant="ghost"
                        size="small"
                        busy={revokingSessionId() === session.id}
                        disabled={revokingSessionId() === session.id}
                        onClick={() => handleRevokeSession(session.id)}
                        class="revoke-session-btn"
                        aria-label={`${t().revokeSessionButton}: ${session.id}`}
                      >
                        {t().revokeSessionButton}
                      </Button>
                    </div>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </section>

      <Toast
        message={toastMessage() ?? ''}
        closeLabel={t().cancelAction}
        onClose={() => setToastMessage(null)}
      />
    </div>
  )
}
