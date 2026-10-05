import { createSignal, createContext, useContext, type ParentComponent } from 'solid-js'
import type { Copy, Locale } from './types.ts'
import { pt } from './pt.ts'
import { en } from './en.ts'

export type { Copy, Locale, ArticleSample, NotebookEntry } from './types.ts'

export const dictionaries: Record<Locale, Copy> = { pt, en }

const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'pt'
  const saved = localStorage.getItem('blog_locale')
  if (saved === 'pt' || saved === 'en') return saved
  return navigator.language.startsWith('en') ? 'en' : 'pt'
}

const [currentLocale, setCurrentLocale] = createSignal<Locale>(getInitialLocale())

export const getLocale = (): Locale => currentLocale()

export const setLocale = (locale: Locale): void => {
  setCurrentLocale(locale)
  if (typeof window !== 'undefined') {
    localStorage.setItem('blog_locale', locale)
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en'
  }
}

export const toggleLocale = (): void => {
  setLocale(currentLocale() === 'pt' ? 'en' : 'pt')
}

export const useTranslation = (): (() => Copy) => {
  return () => dictionaries[currentLocale()]
}

export interface I18nContextValue {
  readonly locale: () => Locale
  readonly setLocale: (locale: Locale) => void
  readonly toggleLocale: () => void
  readonly t: () => Copy
}

const I18nContext = createContext<I18nContextValue>()

export const I18nProvider: ParentComponent = (props) => {
  const value: I18nContextValue = {
    locale: currentLocale,
    setLocale,
    toggleLocale,
    t: () => dictionaries[currentLocale()],
  }

  return I18nContext.Provider({ value, get children() { return props.children } })
}

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext)
  if (ctx) return ctx
  return {
    locale: currentLocale,
    setLocale,
    toggleLocale,
    t: () => dictionaries[currentLocale()],
  }
}
