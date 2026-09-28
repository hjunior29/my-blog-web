import { Icon } from './design-system/Icon'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { Dialog, Toast } from './design-system/overlays'
import { NotebookArt } from './design-system/editorial'
import { dictionaries, type Locale } from './showcase/copy'
import { transitionBookToArticle } from './design-system/bookTransition'
import { ArticlePage } from './design-system/ArticlePage'
import { Catalog } from './catalog/Catalog'
import { catalogCopy, catalogHref, catalogRoute } from './catalog/content'
import './App.css'
import './design-system/motion.css'

function App() {
  const [locale, setLocale] = createSignal<Locale>('pt')
  const [dark, setDark] = createSignal(false)
  const [catalogPage, setCatalogPage] = createSignal(catalogRoute(location.hash))
  let returnHash = catalogHref('post-grid')
  let returnScroll = 0
  let returnBookIndex = 0
  const [toast, setToast] = createSignal('')
  const [modal, setModal] = createSignal<'article' | 'project'>('article')
  const [reading, setReading] = createSignal(location.hash === '#article')
  const [articleIndex, setArticleIndex] = createSignal(0)
  const [articleImage, setArticleImage] = createSignal<string>()
  let opening: AbortController | undefined
  let returnTrigger: HTMLElement | undefined
  const t = () => dictionaries[locale()]
  const currentArticle = () => articleIndex() === 0 ? { title: t().articleTitle, description: t().articleBody, category: t().subjects[1]! } : t().articleSamples[articleIndex() - 1]!
  const [modalOpen, setModalOpen] = createSignal(false)
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  let modalTrigger: HTMLElement | null = null
  function notify(message: string) {
    clearTimeout(toastTimer)
    setToast(message)
    toastTimer = setTimeout(() => setToast(''), 4500)
  }
  function openModal(kind: 'article' | 'project') {
    modalTrigger = document.activeElement as HTMLElement
    setModal(kind)
    setModalOpen(true)
  }
  function revealArticle() {
    setReading(true)
    location.hash = 'article'
    window.scrollTo(0, 0)
  }
  async function openArticle(trigger?: HTMLElement, index = 0) {
    if (opening) return
    returnHash = location.hash || catalogHref('overview')
    returnScroll = window.scrollY
    returnBookIndex = Array.from(document.querySelectorAll('.post-book-action')).indexOf(trigger!)
    setArticleIndex(index)
    returnTrigger = trigger
    const source = trigger?.closest('.post-book-stage')?.querySelector<HTMLElement>('.ds-book')
    setArticleImage(source?.querySelector<HTMLImageElement>('.ds-book-image')?.getAttribute('src') ?? undefined)
    if (!source) { revealArticle(); return }
    opening = new AbortController()
    try { await transitionBookToArticle(source, revealArticle, opening.signal, currentArticle().title) }
    finally {
      opening = undefined
      if (reading()) document.querySelector<HTMLElement>('.article-main h1')?.focus({ preventScroll: true })
    }
  }
  function backToArticles() {
    location.hash = returnHash
  }
  createEffect(() => {
    document.documentElement.lang = locale() === 'pt' ? 'pt-BR' : 'en'
    document.documentElement.dataset.theme = dark() ? 'dark' : 'light'
    document.title = reading() ? `${currentArticle().title} / Helder` : `${catalogPage() === 'overview' ? catalogCopy(locale()).overview : catalogCopy(locale()).entries[catalogPage() as Exclude<ReturnType<typeof catalogRoute>, 'overview'>][0]} / Helder`
  })
  onMount(() => {
    const handleHash = () => {
      const wasReading = reading()
      const isArticle = location.hash === '#article'
      if (!isArticle) opening?.abort()
      setReading(isArticle)
      if (isArticle) return
      setCatalogPage(catalogRoute(location.hash))
      requestAnimationFrame(() => {
        window.scrollTo({ top: wasReading ? returnScroll : 0, behavior: 'instant' })
        const trigger = returnTrigger?.isConnected ? returnTrigger : document.querySelectorAll<HTMLElement>('.post-book-action')[returnBookIndex]
        if (wasReading && trigger) trigger.focus({ preventScroll: true })
        else document.querySelector<HTMLElement>('.catalog-page-heading h1')?.focus({ preventScroll: true })
      })
    }
    window.addEventListener('hashchange', handleHash)
    onCleanup(() => window.removeEventListener('hashchange', handleHash))
  })
  onCleanup(() => { clearTimeout(toastTimer); opening?.abort() })
  return <>
    <Show when={!reading()} fallback={<ArticlePage title={currentArticle().title} description={currentArticle().description} category={currentArticle().category} author={t().author} date={t().date} readingTime={t().readTime} coverImage={articleImage()} backLabel={t().tertiary} onBack={backToArticles}><p>{t().articleIntro}</p><h2>{t().note}</h2><p>{t().articleContinuation}</p><p>{t().noteBody}</p></ArticlePage>}>
    <a class="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById("main")?.focus(); }}>{t().skip}</a>
    <header class="site-header"><a class="wordmark" href={catalogHref('overview')} aria-label="Helder">helder<span>.</span></a><span class="header-divider" /><span class="header-label">{t().system}</span><div class="header-actions"><span class="version"><i />{t().version}</span><button class="locale-button" onClick={() => setLocale(locale() === 'pt' ? 'en' : 'pt')} aria-label={locale() === 'pt' ? 'Switch to English' : 'Mudar para português'}><span class={locale() === 'pt' ? 'selected' : ''}>PT</span><span class="locale-slash">/</span><span class={locale() === 'en' ? 'selected' : ''}>EN</span></button><button class="theme-button" aria-label={dark() ? t().light : t().dark} aria-pressed={dark()} onClick={() => setDark(!dark())}><Icon name={dark() ? "sun" : "moon"} /></button></div></header>
    <Catalog page={catalogPage()} t={t()} locale={locale()} notify={notify} openArticle={openArticle} openModal={() => openModal('project')} />
    </Show>
    <Toast message={toast()} closeLabel={t().close} onClose={() => setToast('')} />
    <Dialog open={modalOpen()} title={modal() === 'article' ? t().articleTitle : t().projectTitle} badge={t().example} closeLabel={t().close} onClose={() => { setModalOpen(false); modalTrigger?.focus() }}>
      <p>{modal() === 'article' ? t().articleBody : t().projectBody}</p><NotebookArt compact motionLabel={catalogCopy(locale()).pauseMotion} /><p>{t().noteBody}</p>
    </Dialog>
  </>
}
export default App
