import { describe, it, expect, beforeEach } from 'vitest'
import { pt } from './pt.ts'
import { en } from './en.ts'
import { getLocale, setLocale, toggleLocale, useTranslation } from './index.ts'

describe('i18n dictionaries', () => {
  it('pt and en have identical keys', () => {
    const ptKeys = Object.keys(pt).sort()
    const enKeys = Object.keys(en).sort()
    expect(ptKeys).toEqual(enKeys)
  })

  it('all dictionary strings are non-empty', () => {
    for (const value of Object.values(pt)) {
      if (typeof value === 'string') {
        expect(value.length).toBeGreaterThan(0)
      }
    }
    for (const value of Object.values(en)) {
      if (typeof value === 'string') {
        expect(value.length).toBeGreaterThan(0)
      }
    }
  })

  it('formats parameterized strings properly in pt', () => {
    expect(pt.searchResultsCount(1)).toBe('1 artigo encontrado')
    expect(pt.searchResultsCount(5)).toBe('5 artigos encontrados')
    expect(pt.deleteConfirmMessage('Meu Post')).toContain('Meu Post')
    expect(pt.paginationPage(2, 5)).toBe('Página 2 de 5')
  })

  it('formats parameterized strings properly in en', () => {
    expect(en.searchResultsCount(1)).toBe('1 article found')
    expect(en.searchResultsCount(5)).toBe('5 articles found')
    expect(en.deleteConfirmMessage('My Post')).toContain('My Post')
    expect(en.paginationPage(2, 5)).toBe('Page 2 of 5')
  })
})

describe('i18n reactive state', () => {
  beforeEach(() => {
    setLocale('pt')
  })

  it('initializes and gets current locale', () => {
    expect(getLocale()).toBe('pt')
  })

  it('switches locale reactively', () => {
    setLocale('en')
    expect(getLocale()).toBe('en')
    const t = useTranslation()
    expect(t().brandName).toBe('Helder')
    expect(t().navArticles).toBe('Articles')
  })

  it('toggles locale back and forth', () => {
    expect(getLocale()).toBe('pt')
    toggleLocale()
    expect(getLocale()).toBe('en')
    toggleLocale()
    expect(getLocale()).toBe('pt')
  })
})
