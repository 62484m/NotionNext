/** @jest-environment node */

import { renderToString } from 'react-dom/server'
import { HeadManagerContext } from 'next/dist/shared/lib/head-manager-context.shared-runtime'
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime'
import { useRouter } from 'next/router'
import App from '@/pages/_app'

jest.unmock('next/dynamic')
jest.unmock('next/head')

jest.mock('next/router', () => ({ useRouter: jest.fn() }))

jest.mock('@/themes/theme', () => {
  const dynamic = jest.requireActual('next/dynamic')
  const Layout = dynamic(
    () => Promise.resolve(({ children }) => <main>{children}</main>),
    { ssr: true }
  )

  return { getBaseLayoutByTheme: () => Layout }
})

jest.mock('@/lib/global', () => ({
  GlobalContextProvider: ({ children }) => children,
  getGlobalSnapshot: () => undefined,
  useGlobal: () => ({ locale: {} })
}))

jest.mock('@/hooks/useAdjustStyle', () => () => {})
jest.mock('@/components/ExternalPlugins', () => () => null)
jest.mock('@/components/PWAInstaller', () => () => null)

const siteInfo = {
  title: 'Test Blog',
  description: 'Example description',
  link: 'https://test.com'
}

const Article = ({ post }) => <article>{post.title}</article>
const Home = () => <h1>Test Blog</h1>

function renderPage(Component, pathname, post) {
  const asPath = post ? '/' + post.slug : pathname
  useRouter.mockReturnValue({ route: pathname, pathname, asPath, query: {}, locale: 'zh-CN' })
  const head = {
    entries: [],
    mountedInstances: new Set(),
    updateHead(entries) {
      head.entries = entries
    }
  }

  const body = renderToString(
    <HeadManagerContext.Provider value={head}>
      <App Component={Component} pageProps={{ post, siteInfo }} />
    </HeadManagerContext.Provider>
  )

  return {
    body,
    canonicals: head.entries
      .filter(entry => entry.type === 'link' && entry.props.rel === 'canonical')
      .map(entry => entry.props.href)
  }
}

it('renders canonical links in the initial HTML while the theme layout is loading', async () => {
  const tutorial = { type: 'Post', title: 'Lubricant guide', slug: 'article/runhua' }
  const coupon = { type: 'Post', title: 'Coupon guide', slug: 'article/youhui' }
  const articleRoute = '/[prefix]/[slug]'

  for (const post of [tutorial, coupon]) {
    const cold = renderPage(Article, articleRoute, post)
    expect(cold.canonicals).toEqual(['https://test.com/' + post.slug])
    expect(cold.body).not.toContain(post.title)
  }
  expect(renderPage(Home, '/').canonicals).toEqual(['https://test.com'])

  await Loadable.preloadAll()

  const warm = renderPage(Article, articleRoute, tutorial)
  expect(warm.body).toContain('<main><article>Lubricant guide</article></main>')
  expect(warm.canonicals).toEqual(['https://test.com/article/runhua'])
})
