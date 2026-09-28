import { onMount, Show, type ParentComponent } from 'solid-js'
import { Navigate } from '@solidjs/router'
import { authStore } from '../lib/auth'
import { useI18n } from '../i18n'
import { Skeleton, Alert } from '../design-system'

export const StudioGuard: ParentComponent = (props) => {
  const { t } = useI18n()

  onMount(() => {
    if (authStore.status() === 'unknown') {
      authStore.checkAuth()
    }
  })

  return (
    <Show
      when={authStore.status() !== 'unknown'}
      fallback={
        <div class="studio-guard-loading">
          <Skeleton label={t().loadingMessage} />
          <Skeleton label={t().loadingMessage} />
        </div>
      }
    >
      <Show
        when={authStore.status() !== 'unauthenticated'}
        fallback={<Navigate href="/studio/access" />}
      >
        <Show
          when={authStore.status() === 'authenticated'}
          fallback={
            <div class="studio-container">
              <Alert error title={t().unauthorizedTitle}>
                <p>{t().unauthorizedDescription}</p>
              </Alert>
            </div>
          }
        >
          {props.children}
        </Show>
      </Show>
    </Show>
  )
}
