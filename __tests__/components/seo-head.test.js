import { render } from '@testing-library/react'
import SEO from '@/components/SEO'
import { useRouter } from 'next/router'

jest.mock('next/head', () => function Head({ children }) { return <>{children}</> })
jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@/lib/config', () => ({ siteConfig: (key, fallback, config) => config?.[key] ?? fallback }))
jest.mock('@/lib/global', () => ({ useGlobal: () => ({ locale: { NAV: { SEARCH: '搜索' } } }) }))

const props = { siteInfo: { title: '圣杯网', description: '产品资料', link: 'https://shengbeiwang.org' }, NOTION_CONFIG: { SEO_BING_SITE_VERIFICATION: 'verification-token' } }

test('server-renderable head contains Bing verification and canonical', () => {
  useRouter.mockReturnValue({ route: '/article/[slug]', query: {} })
  const { container } = render(<SEO {...props} post={{ type: 'Post', status: 'Published', title: '产品', slug: 'article/ok' }} />)
  expect(container.querySelector('[name="msvalidate.01"]').content).toBe('verification-token')
  expect(container.querySelector('[rel="canonical"]').href).toBe('https://shengbeiwang.org/article/ok')
  expect(container.querySelector('[name="robots"]').content).not.toContain('noindex')
})

test.each(['Invisible', 'Draft'])('non-public status %s stays accessible but is noindex', status => {
  useRouter.mockReturnValue({ route: '/article/[slug]', query: {} })
  const { container } = render(<SEO {...props} post={{ type: 'Post', status, slug: 'example' }} />)
  expect(container.querySelector('[name="robots"]').content).toBe('noindex, follow')
})

test('search pages are noindex', () => {
  useRouter.mockReturnValue({ route: '/search', query: { s: 'hello' } })
  const { container } = render(<SEO {...props} />)
  expect(container.querySelector('[name="robots"]').content).toBe('noindex, follow')
})
