export const ROUNDUP_PATH = '/article/3c9e9d8a-dbf7-80cd-90d8-fac909b15341'
export const ARTICLE_IMAGE_LINK = '#notion-article .notion-block-e1ed698b70b641abbe280af9c72d4110 a[href]'
export const COUPON_GIF = '/images/sbw-roundup-coupon.gif'
const ROUNDUP_HEADING = '.notion-block-3c9e9d8adbf780b6bdccd89af461c500'
const MIN_ARTICLE_LENGTH = 1500

function findInlineAnchor(article, firstLink) {
  if (window.location.pathname === ROUNDUP_PATH) return article.querySelector(ROUNDUP_HEADING)
  if (!window.location.pathname.startsWith('/article/') || window.location.pathname === '/article/youhui') return null

  const page = article.querySelector('.notion-page')
  const blocks = Array.from(page?.children || [])
  const couponIndex = blocks.findIndex(block => block.contains(firstLink))
  const preceding = blocks.slice(0, Math.max(0, couponIndex))
  const lengths = preceding.map(block => block.textContent.trim().length)
  const bodyLength = lengths.reduce((sum, length) => sum + length, 0)
  if (bodyLength < MIN_ARTICLE_LENGTH || preceding.length < 4) return null

  let offset = 0
  let fallback
  for (const [index, block] of preceding.entries()) {
    const progress = offset / bodyLength
    if (progress >= .35 && progress <= .65) {
      if (block.matches('.notion-h')) return block
      if (!fallback && block.matches('.notion-text')) fallback = block
    }
    offset += lengths[index]
  }
  return fallback
}

export function refreshCouponImages() {
  const article = document.getElementById('notion-article')
  if (!article) return
  const links = [...document.querySelectorAll(ARTICLE_IMAGE_LINK)].filter(link => link.querySelector('img'))
  if (!links.length) return

  for (const [index, link] of links.entries()) {
    const image = link.querySelector('img')
    if (image.getAttribute('src') !== COUPON_GIF) {
      image.removeAttribute('srcset')
      image.src = COUPON_GIF
    }
    link.dataset.couponPosition = window.location.pathname === '/article/youhui'
      ? 'existing'
      : index === links.length - 1 ? 'bottom' : 'inline'
  }

  if (links.length > 1 || article.querySelector('[data-added-coupon]')) return
  const anchor = findInlineAnchor(article, links[0])
  if (!anchor) return

  const original = links[0]
  const inline = document.createElement('a')
  inline.className = 'notion-link block'
  inline.href = original.href
  inline.dataset.couponPosition = 'inline'
  inline.dataset.addedCoupon = ''
  if (original.target) inline.target = original.target
  if (original.rel) inline.rel = original.rel

  const image = document.createElement('img')
  image.width = 2000
  image.height = 667
  image.alt = '本站优惠券'
  image.loading = 'lazy'
  image.decoding = 'async'
  image.style.cssText = 'display:block;width:100%;height:auto;'
  image.src = COUPON_GIF
  inline.append(image)

  const block = document.createElement('div')
  block.style.marginBlock = '1.25rem'
  block.append(inline)
  anchor.before(block)
}
