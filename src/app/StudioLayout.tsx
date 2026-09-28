import { type ParentComponent } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { authStore } from '../lib/auth'
import { useI18n } from '../i18n'
import { Button } from '../design-system'

export const StudioLayout: ParentComponent = (props) => {
  const { t } = useI18n()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authStore.logout()
    navigate('/studio/access', { replace: true })
  }

  return (
    <div class="studio-layout">
      <header class="studio-header">
        <div class="studio-header-left">
          <A href="/studio/posts" class="studio-wordmark">
            helder<span class="accent-text">.studio</span>
          </A>

          <nav class="studio-nav" aria-label={t().navMain}>
            <A href="/studio/posts" class="studio-nav-link" activeClass="active">
              {t().studioPostsTitle}
            </A>
            <A href="/studio/account" class="studio-nav-link" activeClass="active">
              {t().studioAccountTitle}
            </A>
          </nav>
        </div>

        <div class="studio-header-right">
          <span class="studio-user-badge">
            {authStore.user()?.display_name || authStore.user()?.email}
          </span>

          <A href="/" class="studio-view-site" target="_blank" rel="noopener noreferrer">
            {t().brandName}
          </A>

          <Button variant="ghost" size="small" onClick={handleLogout}>
            {t().logoutButton}
          </Button>
        </div>
      </header>

      <main class="studio-container">
        {props.children}
      </main>
    </div>
  )
}
