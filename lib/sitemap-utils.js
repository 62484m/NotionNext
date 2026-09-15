const isAbsoluteHttpUrl = value =>
  typeof value === 'string' && /^(https?:)?\/\//i.test(value.trim())

export const normalizeSitemapBaseUrl = link => {
  if (typeof link !== 'string') return ''
  return link.trim().replace(/\/+$/, '')
}

export const normalizeSitemapLocale = locale => {
  if (!locale) return ''
  const value = String(locale).trim()
  if (!value) return ''
  return value.startsWith('/') ? value : `/${value}`
}

export const toSitemapDateString = (
  dateInput,
  fallbackDate = new Date().toISOString().split('T')[0]
) => {
  if (!dateInput) return fallbackDate
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return fallbackDate
  }
  return date.toISOString().split('T')[0]
}

export const buildSitemapLoc = ({
  baseUrl,
  locale = '',
  slug
} = {}) => {
  const normalizedBaseUrl = normalizeSitemapBaseUrl(baseUrl)
  if (!normalizedBaseUrl) return null

  const normalizedLocale = normalizeSitemapLocale(locale)

  if (slug === undefined || slug === null || slug === '') {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  const rawSlug = String(slug).trim()
  if (!rawSlug || rawSlug === '#') {
    return null
  }

  if (isAbsoluteHttpUrl(rawSlug)) {
    try {
      const targetUrl = new URL(rawSlug, normalizedBaseUrl)
      const siteUrl = new URL(normalizedBaseUrl)

      // sitemap 仅收录本站链接，避免外链混入
      if (targetUrl.hostname !== siteUrl.hostname) {
        return null
      }

      return targetUrl.toString().replace(/\/+$/, '')
    } catch (error) {
      return null
    }
  }

  const normalizedSlug = rawSlug.replace(/^\/+/, '')
  if (!normalizedSlug) {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  return `${normalizedBaseUrl}${normalizedLocale}/${normalizedSlug}`
}

export const normalizeSiteUrl = normalizeSitemapBaseUrl

export const createSiteUrl = (baseUrl, slug) =>
  buildSitemapLoc({ baseUrl, slug })

// Page properties are normalized to these values by getPageProperties.
export const isIndexablePost = post =>
  post?.status === 'Published' &&
  ['Post', 'Page'].includes(post?.type) &&
  !post?.password &&
  Boolean(post?.slug) &&
  !/^(?:https?:|\/\/|#)/i.test(post.slug)

export const getSitemapFields = (baseUrl, allPages = [], locale = '') => {
  const fields = ['', 'archive', 'category', 'tag'].map(slug => ({
    loc: buildSitemapLoc({ baseUrl, locale, slug })
  }))
  for (const post of allPages.filter(isIndexablePost)) {
    const lastmod = toSitemapDateString(
      post.lastEditedTime || post.lastEditedDate || post.publishDate || post.publishDay,
      ''
    )
    fields.push({
      loc: buildSitemapLoc({ baseUrl, locale, slug: post.slug }),
      ...(lastmod ? { lastmod } : {})
    })
  }
  return [...new Map(fields.filter(field => field.loc).map(field => [field.loc, field])).values()]
}
