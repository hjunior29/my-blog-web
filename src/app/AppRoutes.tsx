import { lazy } from 'solid-js'
import { Router, Route } from '@solidjs/router'
import { I18nProvider } from '../i18n/index.ts'
import { PublicLayout } from './PublicLayout.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { PostsPage } from '../pages/PostsPage.tsx'
import { ArticlePage } from '../pages/ArticlePage.tsx'
import { AboutPage } from '../pages/AboutPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'

const Catalog = import.meta.env.DEV
  ? lazy(() => import('../catalog/Catalog.tsx').then((m) => ({ default: m.Catalog })))
  : null

export function AppRoutes() {
  return (
    <I18nProvider>
      <Router>
        <Route path="/" component={PublicLayout}>
          <Route path="/" component={HomePage} />
          <Route path="/posts" component={PostsPage} />
          <Route path="/posts/:slug" component={ArticlePage} />
          <Route path="/about" component={AboutPage} />

          {import.meta.env.DEV && Catalog && (
            <Route path="/catalog" component={() => (
              <div class="dev-catalog-wrapper">
                <Catalog
                  page="overview"
                  t={{} as any}
                  locale="pt"
                  notify={() => {}}
                  openArticle={() => {}}
                  openModal={() => {}}
                />
              </div>
            )} />
          )}

          <Route path="*404" component={NotFoundPage} />
        </Route>
      </Router>
    </I18nProvider>
  )
}
