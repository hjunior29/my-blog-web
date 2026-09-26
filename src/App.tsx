import { Icon } from './design-system/Icon'
import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { Arrow } from './design-system/primitives'
import { Dialog, Toast } from './design-system/overlays'
import { NotebookArt } from './design-system/editorial'
import { dictionaries, type Locale } from './showcase/copy'
import { Foundations } from './showcase/Foundations'
import { Components } from './showcase/Components'
import { Editorial, Feedback, Principles } from './showcase/Patterns'
import { Books } from './showcase/Books'
import { transitionBookToArticle } from './design-system/bookTransition'
import { ArticlePage } from './design-system/ArticlePage'
import './App.css'

function App() {
  const [locale, setLocale] = createSignal<Locale>('pt')
  const [dark, setDark] = createSignal(false)
  const [active, setActive] = createSignal('overview')
  const [toast, setToast] = createSignal('')
  const [modal, setModal] = createSignal<'article' | 'project'>('article')
  const [reading, setReading] = createSignal(location.hash === '#article')
  const [articleIndex, setArticleIndex] = createSignal(0)
  const [articleImage, setArticleImage] = createSignal<string>()
  let opening: AbortController | undefined
  let returnTrigger: HTMLElement | undefined
  const t = () => dictionaries[locale()]
  const currentArticle = () => articleIndex() === 0 ? { title: t().articleTitle, description: t().articleBody, category: t().subjects[1]! } : t().articleSamples[articleIndex() - 1]!
  const navigation = () => [ ['overview', t().overview], ['foundations', t().foundations], ['components', t().components], ['editorial', t().editorial], ['feedback', t().feedback], ['principles', t().principles], ['books', t().bookTitle] ]
  let dialog!: HTMLDialogElement
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
    dialog.showModal()
  }
  function revealArticle() {
    setReading(true)
    location.hash = 'article'
    window.scrollTo(0, 0)
  }
  async function openArticle(trigger?: HTMLElement, index = 0) {
    if (opening) return
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
    setReading(false)
    location.hash = 'editorial'
    requestAnimationFrame(() => {
      document.getElementById('editorial')?.scrollIntoView({ behavior: 'instant' })
      const trigger = returnTrigger?.isConnected ? returnTrigger : document.querySelectorAll<HTMLElement>('.post-book-action')[articleIndex()]
      trigger?.focus({ preventScroll: true })
    })
  }
  createEffect(() => {
    document.documentElement.lang = locale() === 'pt' ? 'pt-BR' : 'en'
    document.documentElement.dataset.theme = dark() ? 'dark' : 'light'
    document.title = reading() ? `${currentArticle().title} / Helder` : `Helder / ${t().system}`
  })
  onMount(() => {
    const handleHash = () => { if (location.hash !== '#article') opening?.abort(); setReading(location.hash === '#article') }
    window.addEventListener('hashchange', handleHash)
    onCleanup(() => window.removeEventListener('hashchange', handleHash))
  })
  createEffect(() => {
    if (reading()) return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
    }, { rootMargin: '-10% 0px -65% 0px' })
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section))
    onCleanup(() => observer.disconnect())
  })
  onCleanup(() => { clearTimeout(toastTimer); opening?.abort() })
  return <>
    <Show when={!reading()} fallback={<ArticlePage title={currentArticle().title} description={currentArticle().description} category={currentArticle().category} author={t().author} date={t().date} readingTime={t().readTime} coverImage={articleImage()} backLabel={t().tertiary} onBack={backToArticles}><p>{t().articleIntro}</p><h2>{t().note}</h2><p>{t().articleContinuation}</p><p>{t().noteBody}</p></ArticlePage>}>
    <a class="skip-link" href="#main">{t().skip}</a>
    <header class="site-header"><a class="wordmark" href="#overview" aria-label="Helder">helder<span>.</span></a><span class="header-divider" /><span class="header-label">{t().system}</span><div class="header-actions"><span class="version"><i />{t().version}</span><button class="locale-button" onClick={() => setLocale(locale() === 'pt' ? 'en' : 'pt')} aria-label={locale() === 'pt' ? 'Switch to English' : 'Mudar para português'}><span class={locale() === 'pt' ? 'selected' : ''}>PT</span><span class="locale-slash">/</span><span class={locale() === 'en' ? 'selected' : ''}>EN</span></button><button class="theme-button" aria-label={dark() ? t().light : t().dark} aria-pressed={dark()} onClick={() => setDark(!dark())}><Icon name={dark() ? "sun" : "moon"} /></button></div></header>
    <div class="workspace"><aside class="sidebar"><div><span class="eyebrow">{t().index}</span><nav aria-label={t().index}><For each={navigation()}>{(item, index) => <a href={`#${item[0]}`} classList={{ active: active() === item[0] }} aria-current={active() === item[0] ? 'location' : undefined}><span class="nav-number">0{index()}</span>{item[1]}<Show when={active() === item[0]}><span class="nav-dot" /></Show></a>}</For></nav></div><div class="sidebar-note"><Icon name="asterisk" size={32} class="sidebar-mark" /><p>{t().crafted}</p><code>EST. 2026</code></div></aside>
    <main id="main"><section id="overview" class="hero"><div class="hero-copy"><span class="eyebrow accent-text">{t().edition}</span><h1>{t().title}</h1><p>{t().intro}</p><div class="hero-actions"><a class="button primary" href="#components">{t().explore}<Arrow /></a><a class="text-link" href="#editorial">{t().preview}<Arrow diagonal /></a></div><div class="hero-meta"><Icon name="asterisk" size={24} class="tiny-mark" /><span>{t().token}</span><Icon name="chevronRight" size={16} /><span>SolidJS + CSS</span></div></div><NotebookArt /></section>
    <div class="manifesto"><Icon name="asterisk" size={32} class="manifesto-star" /><strong>{t().note}</strong><p>{t().noteBody}</p></div>
    <Foundations t={t()} notify={notify} /><Components t={t()} notify={notify} openArticle={() => void openArticle()} openProject={() => openModal('project')} /><Editorial t={t()} openArticle={openArticle} openProject={() => openModal('project')} /><Feedback t={t()} notify={notify} /><Principles t={t()} /><Books t={t()} />
    </main></div>
    <footer class="site-footer"><a class="wordmark" href="#overview">helder<span>.</span></a><p>{t().footer}</p><a class="text-link" href="#overview">{t().top}<Icon name="arrowUp" /></a></footer>
    </Show>
    <Toast message={toast()} closeLabel={t().close} onClose={() => setToast('')} />
    <Dialog ref={element => { dialog = element }} title={modal() === 'article' ? t().articleTitle : t().projectTitle} badge={t().example} closeLabel={t().close} onClose={() => modalTrigger?.focus()}>
      <p>{modal() === 'article' ? t().articleBody : t().projectBody}</p><NotebookArt compact /><p>{t().noteBody}</p>
    </Dialog>
  </>
}
export default App
