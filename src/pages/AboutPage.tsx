import { A } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { Author, Arrow } from '../design-system'

export function AboutPage() {
  const { t } = useI18n()

  return (
    <div class="about-page">
      <header class="about-header">
        <span class="eyebrow">{t().brandName}</span>
        <h1 class="about-title">{t().aboutPageTitle}</h1>
        <p class="about-intro serif">{t().aboutPageIntro}</p>
      </header>

      <section class="about-content">
        <div class="about-bio-card">
          <Author name={t().brandName} description={t().aboutBriefBody} />
          <p class="about-bio-text">{t().aboutPageBio}</p>
        </div>

        <div class="about-colophon">
          <h3>{t().aboutPageColophonTitle}</h3>
          <p>{t().aboutPageColophon}</p>
        </div>

        <div class="about-navigation">
          <A href="/posts" class="button primary">
            {t().navArticles}
            <Arrow />
          </A>
        </div>
      </section>
    </div>
  )
}
