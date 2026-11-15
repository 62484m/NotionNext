import fs from 'fs'
import { generateSitemapXml } from '@/lib/utils/sitemap.xml'
import { siteConfig } from '@/lib/config'

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultVal, extendConfig = {}) => {
    if (key === 'LINK' && extendConfig?.LINK) {
      return extendConfig.LINK
    }
    return defaultVal
  })
}))

describe('generateSitemapXml', () => {
  beforeEach(() => {
    siteConfig.mockClear()
  })

  it('emits only unique URLs for public local content and built-in pages', () => {
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})

    generateSitemapXml({
      NOTION_CONFIG: {
        LINK: 'https://example.com/'
      },
      allPages: [
        {
          slug: '/hello-world',
          type: 'Post',
          status: 'Published',
          publishDay: '2026-02-20'
        },
        { slug: 'hello-world/', type: 'Post', status: 'Published' },
        { slug: '/archive/', type: 'Page', status: 'Published' },
        { slug: 'hidden', type: 'Post', status: 'Invisible' },
        { slug: 'locked', type: 'Post', status: 'Published', password: 'test' },
        { slug: 'en', type: 'Menu', status: 'Published' },
        {
          slug: 'https://external.com/landing',
          type: 'Post',
          status: 'Published',
          publishDay: '2026-02-20'
        },
        {
          slug: '/internal/page',
          type: 'Page',
          status: 'Published',
          publishDay: 'invalid-date'
        }
      ]
    })

    expect(writeSpy).toHaveBeenCalledTimes(2)

    const xml = writeSpy.mock.calls[0][1]
    expect(xml).toContain('<loc>https://example.com/hello-world</loc>')
    expect(xml.match(/<loc>https:\/\/example.com\/hello-world<\/loc>/g)).toHaveLength(1)
    expect(xml.match(/<loc>https:\/\/example.com\/archive<\/loc>/g)).toHaveLength(1)
    expect(xml).toContain('<loc>https://example.com/internal/page</loc>')
    expect(xml).not.toMatch(/example\.com\/(?:hidden|locked|en)</)
    expect(xml).not.toContain('<loc>https://external.com/landing</loc>')
    expect(xml).not.toContain('https://example.com/https://external.com/landing')
    expect(xml).not.toContain('Invalid Date')

    writeSpy.mockRestore()
  })
})
