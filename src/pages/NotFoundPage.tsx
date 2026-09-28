import { A } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { Arrow } from '../design-system'

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <div class="not-found-page">
      <div class="not-found-card">
        <span class="eyebrow">404</span>
        <h1 class="serif">{t().articleNotFoundTitle}</h1>
        <p>{t().articleNotFoundBody}</p>
        <div class="not-found-action">
          <A href="/" class="button primary">
            {t().heroCta}
            <Arrow />
          </A>
        </div>
      </div>
    </div>
  )
}
