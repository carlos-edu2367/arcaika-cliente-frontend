import DOMPurify from 'dompurify'

/**
 * Sanitize HTML string to prevent XSS.
 * Only allows safe formatting tags.
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
  })
}

/**
 * Sanitize a URL to prevent javascript: protocol attacks
 */
export function sanitizeURL(url: string): string {
  if (/^javascript:/i.test(url.trim())) return '#'
  return url
}
