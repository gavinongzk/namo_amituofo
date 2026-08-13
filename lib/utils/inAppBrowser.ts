const RESTRICTED_IN_APP_BROWSER_RE =
  /FBAN|FBAV|FB_IAB|FBIOS|FB4A|FBNV|Instagram|WhatsApp|Line\/|TikTok|BytedanceWebview|MicroMessenger/i

export function isRestrictedInAppBrowser(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  return RESTRICTED_IN_APP_BROWSER_RE.test(userAgent)
}
