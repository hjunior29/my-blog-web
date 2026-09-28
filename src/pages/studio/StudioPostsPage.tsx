import { A } from '@solidjs/router'
import { useI18n } from '../../i18n'
import { Icon } from '../../design-system'

export function StudioPostsPage() {
  const { t } = useI18n()

  return (
    <div class="studio-posts-page">
      <div class="section-header-row">
        <div>
          <h1 class="serif">{t().studioPostsTitle}</h1>
        </div>
        <A href="/studio/posts/new" class="button primary">
          <Icon name="plus" size={16} />
          {t().newPostButton}
        </A>
      </div>
    </div>
  )
}
