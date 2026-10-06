import { For } from 'solid-js'
import { A } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { Author, Arrow, Badge, Icon } from '../design-system'

export function AboutPage() {
  const { t } = useI18n()

  return (
    <div class="about-page">
      <header class="about-header">
        <span class="eyebrow">{t().aboutPageEyebrow}</span>
        <h1 class="about-title">{t().aboutPageTitle}</h1>
        <p class="about-intro serif">{t().aboutPageIntro}</p>
      </header>

      <section class="about-content">
        <div class="about-bio-card">
          <Author name={t().brandName} description={t().aboutBriefBody} />
          <p class="about-bio-text">{t().aboutPageBio}</p>
          <p class="about-bio-text">{t().aboutPageBioExtended}</p>
        </div>

        <section class="about-section" aria-labelledby="about-pillars-heading">
          <div class="about-section-header">
            <span class="section-number">01</span>
            <h2 id="about-pillars-heading" class="about-section-title">{t().aboutPillarsTitle}</h2>
          </div>
          <div class="about-pillars-grid">
            <For each={t().aboutPillars}>
              {(pillar) => (
                <div class="about-pillar-card">
                  <div class="about-pillar-top">
                    <h3>{pillar.title}</h3>
                    <Badge accent>{pillar.badge}</Badge>
                  </div>
                  <p>{pillar.description}</p>
                </div>
              )}
            </For>
          </div>
        </section>

        <section class="about-section" aria-labelledby="about-exp-heading">
          <div class="about-section-header">
            <span class="section-number">02</span>
            <h2 id="about-exp-heading" class="about-section-title">{t().aboutExperienceTitle}</h2>
          </div>
          <div class="about-timeline">
            <For each={t().aboutExperienceItems}>
              {(item) => (
                <div class="about-timeline-item">
                  <div class="about-timeline-meta">
                    <span class="about-timeline-role">{item.role}</span>
                    <span class="about-timeline-period">{item.period}</span>
                  </div>
                  <p class="about-timeline-detail">{item.detail}</p>
                </div>
              )}
            </For>
          </div>
        </section>

        <section class="about-section" aria-labelledby="about-edu-heading">
          <div class="about-section-header">
            <span class="section-number">03</span>
            <h2 id="about-edu-heading" class="about-section-title">{t().aboutEducationTitle}</h2>
          </div>
          <div class="about-timeline">
            <For each={t().aboutEducationItems}>
              {(item) => (
                <div class="about-timeline-item">
                  <div class="about-timeline-meta">
                    <span class="about-timeline-role">{item.degree}</span>
                    <span class="about-timeline-period">{item.period}</span>
                  </div>
                  <span class="about-timeline-institution">{item.institution}</span>
                  <p class="about-timeline-detail">{item.detail}</p>
                </div>
              )}
            </For>
          </div>
        </section>

        <div class="about-colophon">
          <h3>{t().aboutPageColophonTitle}</h3>
          <p>{t().aboutPageColophon}</p>
        </div>

        <section class="about-contact-section" aria-labelledby="about-contact-heading">
          <h3 id="about-contact-heading">{t().aboutContactTitle}</h3>
          <p>{t().aboutContactSubtitle}</p>
          <div class="about-contact-links">
            <a href="https://github.com/hjunior29" target="_blank" rel="noopener noreferrer" class="button secondary small">
              <Icon name="code" size={16} />
              {t().contactGithub}
              <Icon name="externalLink" size={14} />
            </a>
            <a href="https://www.linkedin.com/in/helder-junior-silva-lima" target="_blank" rel="noopener noreferrer" class="button secondary small">
              <Icon name="externalLink" size={16} />
              {t().contactLinkedin}
            </a>
            <a href="mailto:helderjuniorsilvalima@gmail.com" class="button secondary small">
              <Icon name="arrowUpRight" size={16} />
              {t().contactEmail}
            </a>
          </div>
        </section>

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
