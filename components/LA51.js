import { siteConfig } from '@/lib/config'
import { useEffect } from 'react'

// These Notion block IDs are shared by the synced coupon image and text.
const COUPON_PLACEMENTS = [
  ['#endspace-home-ad a[href]', 'coupon_home_banner'],
  ['#notion-article .notion-block-e1ed698b70b641abbe280af9c72d4110 a[href]', 'coupon_article_image'],
  ['#notion-article .notion-block-2c18863f1a33471da67431d24b9697b6 a[href]', 'coupon_article_text']
]

function trackCouponClick(event) {
  if (event.type === 'auxclick' && event.button !== 1) return

  const link = event.target?.closest?.('a[href]')
  const placement = link && COUPON_PLACEMENTS.find(([selector]) => link.matches(selector))
  const { LA, location } = window
  if (!placement || typeof LA?.track !== 'function') return

  const properties = { page_path: location.pathname.slice(0, 64) }
  LA.track('coupon_click', properties)
  LA.track(placement[1], properties)
}

/**
 * 51LA统计
 */
export default function LA51() {
  const ANALYTICS_51LA_ID = siteConfig('ANALYTICS_51LA_ID')
  const ANALYTICS_51LA_CK = siteConfig('ANALYTICS_51LA_CK')

  useEffect(() => {
    const initialize = () => window.LA?.init({
      id: `${ANALYTICS_51LA_ID}`,
      ck: `${ANALYTICS_51LA_CK}`,
      hashMode: true,
      autoTrack: true
    })

    const sdk = document.getElementById('LA_COLLECT')
    if (window.LA) {
      initialize()
    } else {
      sdk?.addEventListener('load', initialize, { once: true })
    }

    const isLiveSite = ['shengbeiwang.org', 'www.shengbeiwang.org'].includes(window.location.hostname)
    if (isLiveSite) {
      document.addEventListener('click', trackCouponClick, true)
      document.addEventListener('auxclick', trackCouponClick, true)
    }

    return () => {
      sdk?.removeEventListener('load', initialize)
      if (isLiveSite) {
        document.removeEventListener('click', trackCouponClick, true)
        document.removeEventListener('auxclick', trackCouponClick, true)
      }
    }
  }, [ANALYTICS_51LA_ID, ANALYTICS_51LA_CK])

  return <></>
}
