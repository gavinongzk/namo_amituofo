#!/usr/bin/env node
/**
 * Guest registration page must return HTTP 200 without Next's error shell.
 * Production currently 500s because currentUser() throws when Clerk middleware
 * is skipped — that hydrates as "Application error: a client-side exception has occurred".
 */
const url =
  process.argv[2] ||
  'https://reg.plb-sea.org/events/details/6a62eae3e3d82189fc011cf5/register'

const userAgent =
  process.argv[3] ||
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]'

const res = await fetch(url, {
  redirect: 'manual',
  headers: { 'user-agent': userAgent },
})
const html = await res.text()
const isErrorShell =
  html.includes('id="__next_error__"') ||
  html.includes('Application error') ||
  html.includes('client-side exception') ||
  /9:E\{"digest"/.test(html)

const ok = res.status === 200 && !isErrorShell
console.log(
  JSON.stringify(
    {
      url,
      status: res.status,
      isErrorShell,
      ok,
    },
    null,
    2
  )
)
process.exit(ok ? 0 : 1)
