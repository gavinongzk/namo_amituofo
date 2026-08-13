import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isRestrictedInAppBrowser } from './inAppBrowser.ts'
import { isValidPersonName, sanitizePersonName } from './nameValidation.ts'

test('detects Facebook and WhatsApp in-app browsers', () => {
  assert.equal(
    isRestrictedInAppBrowser(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]'
    ),
    true
  )
  assert.equal(
    isRestrictedInAppBrowser(
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 WhatsApp/10.0.0.1'
    ),
    true
  )
  assert.equal(
    isRestrictedInAppBrowser(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    ),
    false
  )
})

test('accepts Chinese and Latin names', () => {
  assert.equal(isValidPersonName('张三'), true)
  assert.equal(isValidPersonName("Tan Ah-Kow"), true)
  assert.equal(sanitizePersonName('张三😊'), '张三')
})
