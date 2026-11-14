import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getSitemapFields } from '@/lib/sitemap-utils'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'

export const getServerSideProps = async ctx => {
  const fields = []
  for (const siteId of BLOG.NOTION_PAGE_ID.split(',')) {
    const siteData = await fetchGlobalAllData({
      pageId: extractLangId(siteId),
      from: 'sitemap.xml'
    })
    const link = siteConfig('LINK', siteData?.siteInfo?.link, siteData?.NOTION_CONFIG)
    fields.push(...getSitemapFields(link, siteData?.allPages, extractLangPrefix(siteId)))
  }
  ctx.res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=59')
  return getServerSideSitemap(ctx, [...new Map(fields.map(field => [field.loc, field])).values()])
}

export default function Sitemap() { return null }
