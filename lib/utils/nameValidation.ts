const FALLBACK_NAME_RE =
  /^[A-Za-z0-9\u00C0-\u024F\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\s\-.'()\[\]{}]+$/
const FALLBACK_SANITIZE_RE =
  /[^A-Za-z0-9\u00C0-\u024F\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\s\-.'()\[\]{}]/g

function namePattern(): RegExp {
  try {
    return new RegExp("^[\\p{L}\\p{N}\\s\\-.'()\\[\\]{}]+$", 'u')
  } catch {
    return FALLBACK_NAME_RE
  }
}

function sanitizePattern(): RegExp {
  try {
    return new RegExp("[^\\p{L}\\p{N}\\s\\-.'()\\[\\]{}]", 'gu')
  } catch {
    return FALLBACK_SANITIZE_RE
  }
}

const NAME_RE = namePattern()
const SANITIZE_RE = sanitizePattern()

export function isValidPersonName(name: string): boolean {
  return NAME_RE.test(name)
}

export function sanitizePersonName(name: string): string {
  return name.replace(SANITIZE_RE, '')
}
