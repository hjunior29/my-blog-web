import { lazy } from 'solid-js'
import { Router, Route, Navigate, type RouteSectionProps } from '@solidjs/router'
import { I18nProvider } from '../i18n/index.ts'
import { PublicLayout } from './PublicLayout.tsx'
import { StudioGuard } from './StudioGuard.tsx'
import { StudioLayout } from './StudioLayout.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { PostsPage } from '../pages/PostsPage.tsx'
import { ArticlePage } from '../pages/ArticlePage.tsx'
import { AboutPage } from '../pages/AboutPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { StudioAccessPage } from '../pages/studio/StudioAccessPage.tsx'
import { StudioPostsPage } from '../pages/studio/StudioPostsPage.tsx'
import { StudioEditorPage } from '../pages/studio/StudioEditorPage.tsx'
import { StudioAccountPage } from '../pages/studio/StudioAccountPage.tsx'

const Catalog = import.meta.env.DEV
  ? lazy(() => import('../catalog/Catalog.tsx').then((m) => ({ default: m.Catalog })))
  : null

export function AppRoutes() {
  return (
    <I18nProvider>
      <Router>
        <Route path="/studio/access" component={StudioAccessPage} />
        <Route
          path="/studio"
          component={(props: RouteSectionProps) => (
            <StudioGuard>
              <StudioLayout>{props.children}</StudioLayout>
            </StudioGuard>
          )}
        >
          <Route path="/" component={() => <Navigate href="/studio/posts" />} />
          <Route path="/posts" component={StudioPostsPage} />
          <Route path="/posts/new" component={StudioEditorPage} />
          <Route path="/posts/:id/edit" component={StudioEditorPage} />
          <Route path="/account" component={StudioAccountPage} />
        </Route>

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
