import BLOG from '@/blog.config'
import fs from 'fs'
import { siteConfig } from '../config'
import { getSitemapFields } from '../sitemap-utils'

const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[char])

// Used only by static export. Server deployments serve /pages/sitemap.xml.js.
export function generateSitemapXml({ allPages, NOTION_CONFIG }) {
  const link = siteConfig('LINK', BLOG.LINK, NOTION_CONFIG)
  const fields = getSitemapFields(link, allPages)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fields.map(({ loc, lastmod }) => `<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`
  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('sitemap.xml', xml)
    fs.writeFileSync('./public/sitemap.xml', xml)
  } catch (error) {
    console.warn('无法写入文件', error)
  }
}
