/** @jest-environment node */

import { renderToString } from 'react-dom/server'
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime'
import { useRouter } from 'next/router'
import { DynamicLayout, getBaseLayoutByTheme } from '@/themes/theme'

jest.unmock('next/dynamic')
jest.mock('next/config', () => () => ({
  publicRuntimeConfig: { THEMES: ['endspace', 'example'] }
}))
jest.mock('next/router', () => ({ useRouter: jest.fn() }))

jest.mock('@/themes/endspace', () => ({
  LayoutBase: ({ children }) => <main id='theme-endspace'>{children}</main>,
  LayoutSlug: ({ post }) => <article>{post.title}</article>
}))

jest.mock('@/themes/example', () => ({
  LayoutSlug: () => <article>Example theme article</article>
}))

it('includes both Endspace layouts in the first server render', async () => {
  useRouter.mockReturnValue({ asPath: '/article/runhua' })
  const post = { title: 'Lubricant guide' }

  // Next Pages Router preloads registered dynamic components before rendering.
  await Loadable.preloadAll()
  const Base = getBaseLayoutByTheme('endspace')
  const html = renderToString(
    <Base>
      <DynamicLayout theme='endspace' layoutName='LayoutSlug' post={post} />
    </Base>
  )

  expect(html).toContain('<main id="theme-endspace"><article>Lubricant guide</article></main>')
})

it('respects the requested alternate theme for an article layout', async () => {
  useRouter.mockReturnValue({ asPath: '/article/runhua?theme=example' })
  const page = <DynamicLayout theme='endspace' layoutName='LayoutSlug' />
  renderToString(page)
  await Loadable.preloadAll()

  expect(renderToString(page)).toContain('<article>Example theme article</article>')
})
