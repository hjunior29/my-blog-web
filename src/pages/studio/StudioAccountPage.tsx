import { useI18n } from '../../i18n'

export function StudioAccountPage() {
  const { t } = useI18n()

  return (
    <div class="studio-account-page">
      <h1 class="serif">{t().studioAccountTitle}</h1>
    </div>
  )
}
