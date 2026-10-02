import { createSignal, onMount, type ParentComponent } from 'solid-js'
import { A } from '@solidjs/router'
import { useI18n } from '../i18n/index.ts'
import { Icon } from '../design-system/Icon'

export const PublicLayout: ParentComponent = (props) => {
  const { locale, toggleLocale, t } = useI18n()

  const getInitialTheme = (): boolean => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('blog_theme')
    if (saved !== null) return saved === 'dark'
    return typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  }

  const [dark, setDark] = createSignal(getInitialTheme())

  onMount(() => {
    document.documentElement.dataset.theme = dark() ? 'dark' : 'light'
  })

  const handleToggleTheme = () => {
    const next = !dark()
    setDark(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('blog_theme', next ? 'dark' : 'light')
      document.documentElement.dataset.theme = next ? 'dark' : 'light'
    }
  }

  return (
    <div class="public-shell">
      <a class="skip-link" href="#main">
        {t().skipToContent}
      </a>

      <header class="public-header">
        <div class="public-header-inner">
          <A href="/" class="public-wordmark" aria-label={t().brandName}>
            helder<span class="accent-text">.</span>
          </A>

          <nav class="public-nav" aria-label={t().navMain}>
            <A href="/posts" class="public-nav-link" activeClass="active" end>
              {t().navArticles}
            </A>
            <A href="/about" class="public-nav-link" activeClass="active">
              {t().navAbout}
            </A>
          </nav>

          <div class="public-header-actions">
            <button
              type="button"
              class="locale-button"
              onClick={toggleLocale}
              aria-label={t().switchLocale}
            >
              <span class={locale() === 'pt' ? 'selected' : ''}>PT</span>
              <span class="locale-slash">/</span>
              <span class={locale() === 'en' ? 'selected' : ''}>EN</span>
            </button>

            <button
              type="button"
              class="theme-button"
              aria-label={dark() ? t().lightTheme : t().darkTheme}
              aria-pressed={dark()}
              onClick={handleToggleTheme}
            >
              <Icon name={dark() ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </div>
      </header>

      <main id="main" class="public-main" tabindex="-1">
        {props.children}
      </main>

      <footer class="public-footer">
        <div class="public-footer-inner">
          <p class="public-footer-text">
            © {new Date().getFullYear()} {t().brandName} · {t().crafted}
          </p>
          <A href="#main" class="text-link">
            {t().top}
            <Icon name="arrowUp" size={14} />
          </A>
        </div>
      </footer>
    </div>
  )
}
