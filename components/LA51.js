import { siteConfig } from '@/lib/config'
import { useEffect } from 'react'
import { ARTICLE_IMAGE_LINK, refreshCouponImages, ROUNDUP_PATH } from './couponImages'

// These Notion block IDs are shared by the synced coupon image and text.
const COUPON_PLACEMENTS = [
  ['#endspace-home-ad a[href]', 'coupon_home_banner', 'coupon_view_home_banner'],
  [`${ARTICLE_IMAGE_LINK}, #notion-article a[data-added-coupon]`, 'coupon_article_image', 'coupon_view_article_image'],
  ['#notion-article .notion-block-2c18863f1a33471da67431d24b9697b6 a[href]', 'coupon_article_text', 'coupon_view_article_text']
]

function couponEventProperties(link) {
  const { navigator, location } = window
  const { userAgent, userAgentData, maxTouchPoints } = navigator
  const isTablet = /iPad|Tablet/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  const isMobile = userAgentData?.mobile || /Android|iPhone|iPod|Mobile/i.test(userAgent)
  const position = link?.dataset.couponPosition
  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'
  return {
    page_path: location.pathname.slice(0, 64),
    device_type: device,
    ...(position && { coupon_position: position, coupon_position_device: position + '_' + device }),
    ...(position && location.pathname === ROUNDUP_PATH && { roundup_position_device: position + '_' + device })
  }
}

function observeCouponViews() {
  if (!window.IntersectionObserver) return () => {}

  const events = new Map()
  const visible = new Set()
  const timers = new Map()
  const sent = new Map()
  const dayFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' })

  function cancel(link) {
    clearTimeout(timers.get(link))
    timers.delete(link)
  }

  function record(event, link) {
    if (typeof window.LA?.track !== 'function') return false
    const day = dayFormatter.format(new Date())
    const position = link?.dataset.couponPosition
    const scope = window.location.pathname === ROUNDUP_PATH && position ? ':roundup:' + position : position === 'inline' ? ':inline' : ''
    const key = 'shengbei:' + event + scope
    if (sent.get(key) === day) return true
    try {
      if (window.localStorage.getItem(key) === day) return true
    } catch {
      // Keep in-page deduplication when browser storage is disabled.
    }
    window.LA.track(event, couponEventProperties(link))
    sent.set(key, day)
    try {
      window.localStorage.setItem(key, day)
    } catch {
      // The event has already been sent.
    }
    return true
  }

  function schedule(link) {
    if (document.hidden || timers.has(link)) return

    timers.set(link, setTimeout(() => {
      timers.delete(link)
      if (document.hidden || !link.isConnected || !visible.has(link)) return
      if (!record(events.get(link), link)) schedule(link)
    }, 1000))
  }

  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting, intersectionRatio } of entries) {
      if (!events.has(target)) continue
      if (isIntersecting && intersectionRatio >= 0.5) {
        visible.add(target)
        schedule(target)
      } else {
        visible.delete(target)
        cancel(target)
      }
    }
  }, { threshold: 0.5 })

  function refresh() {
    refreshCouponImages()
    for (const [selector, , event] of COUPON_PLACEMENTS) {
      for (const link of document.querySelectorAll(selector)) {
        if (events.has(link)) continue
        events.set(link, event)
        observer.observe(link)
      }
    }
    for (const link of events.keys()) {
      if (link.isConnected) continue
      observer.unobserve(link)
      events.delete(link)
      visible.delete(link)
      cancel(link)
    }
  }

  function handleVisibility() {
    for (const link of visible) {
      if (document.hidden) cancel(link)
      else schedule(link)
    }
  }

  const mutations = new MutationObserver(refresh)
  const handleClick = event => trackCouponClick(event, record)
  mutations.observe(document.body, { childList: true, subtree: true })
  document.addEventListener('visibilitychange', handleVisibility)
  document.addEventListener('click', handleClick, true)
  document.addEventListener('auxclick', handleClick, true)
  refresh()
  return () => {
    mutations.disconnect()
    observer.disconnect()
    document.removeEventListener('visibilitychange', handleVisibility)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('auxclick', handleClick, true)
    for (const link of timers.keys()) cancel(link)
  }
}

function trackCouponClick(event, recordView) {
  if (event.type === 'auxclick' && event.button !== 1) return

  const link = event.target?.closest?.('a[href]')
  const placement = link && COUPON_PLACEMENTS.find(([selector]) => link.matches(selector))
  const { LA } = window
  if (!placement || typeof LA?.track !== 'function') return

  const properties = couponEventProperties(link)
  recordView?.(placement[2], link)
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
    const stopObserving = isLiveSite && observeCouponViews()
    if (isLiveSite && !window.IntersectionObserver) {
      document.addEventListener('click', trackCouponClick, true)
      document.addEventListener('auxclick', trackCouponClick, true)
    }

    return () => {
      sdk?.removeEventListener('load', initialize)
      if (isLiveSite) {
        stopObserving()
        document.removeEventListener('click', trackCouponClick, true)
        document.removeEventListener('auxclick', trackCouponClick, true)
      }
    }
  }, [ANALYTICS_51LA_ID, ANALYTICS_51LA_CK])

  return <></>
}
