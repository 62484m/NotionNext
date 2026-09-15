import { getSitemapFields } from '@/lib/sitemap-utils'
import { generateRobotsTxt } from '@/lib/utils/robots.txt'
import fs from 'fs'

test('sitemap includes new published content once, excludes drafts, hidden pages, menus and passwords', () => {
  const post = { type: 'Post', status: 'Published', slug: 'article/ok', publishDay: '2026-08-01', lastEditedTime: '2026-09-15T04:00:00Z' }
  const fields = getSitemapFields('https://shengbeiwang.org/', [
    post, post,
    { ...post, slug: 'draft', status: 'Draft' },
    { ...post, slug: 'hidden', status: 'Invisible' },
    { ...post, slug: 'menu', type: 'Menu' },
    { ...post, slug: 'protected', password: 'secret' },
    { ...post, slug: '/about', type: 'Page', lastEditedTime: null, publishDay: null }
  ])
  expect(fields).toHaveLength(6)
  expect(fields).toContainEqual({ loc: 'https://shengbeiwang.org/article/ok', lastmod: '2026-09-15' })
  expect(fields).toContainEqual({ loc: 'https://shengbeiwang.org/about' })
  expect(fields.some(field => /search|rss|draft|hidden|protected|menu/.test(field.loc))).toBe(false)
  expect(getSitemapFields('https://shengbeiwang.org/', [post], 'en').at(-1).loc).toBe('https://shengbeiwang.org/en/article/ok')
})

test('robots advertises one normalized HTTPS sitemap and allows assets', () => {
  const write = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
  jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {})
  generateRobotsTxt({ siteInfo: { link: 'http://shengbeiwang.org/' }, NOTION_CONFIG: { LINK: 'https://shengbeiwang.org/' } })
  const text = write.mock.calls[0][1]
  expect(text).toContain('Sitemap: https://shengbeiwang.org/sitemap.xml')
  expect(text).not.toContain('.org//')
  expect(text).not.toContain('Disallow: /_next')
})
