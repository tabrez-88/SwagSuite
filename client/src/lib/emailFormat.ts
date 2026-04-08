/**
 * Email formatting helpers for converting between plain text and HTML.
 *
 * Used by EmailComposer (RichTextEditor / Quill) and Send*Dialog hooks
 * so that line breaks and paragraphs survive the journey from compose →
 * preview → server → received email.
 */

const HTML_TAG_REGEX = /<\/?(p|br|div|span|h[1-6]|ul|ol|li|strong|em|b|i|u|a|table|tr|td|th|img|hr|blockquote|pre|code)\b[^>]*>/i;

/** True if the string contains real HTML markup (not just `<word>` text). */
export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_REGEX.test(value);
}

/** Escape `& < > " '` for safe HTML embedding. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Convert plain text → HTML paragraphs.
 * - Double newlines become paragraph breaks
 * - Single newlines become `<br>`
 * - HTML entities are escaped
 *
 * If the input already looks like HTML, it's returned unchanged.
 */
export function textToHtml(value: string): string {
  if (!value) return "";
  if (looksLikeHtml(value)) return value;

  return value
    .split(/\n{2,}/)
    .map((paragraph) => {
      const escaped = escapeHtml(paragraph).replace(/\n/g, "<br>");
      return `<p>${escaped}</p>`;
    })
    .join("");
}

/**
 * Convert HTML → plain text, preserving paragraph and list structure.
 * Used for the text/plain fallback or for showing previews of stored email
 * bodies in lists.
 */
export function htmlToText(value: string): string {
  if (!value) return "";
  if (!looksLikeHtml(value)) return value;

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Append a block of HTML to an existing email body.
 * If the body is plain text, it gets converted to HTML first so the result
 * is always a single coherent HTML string.
 */
export function appendHtmlBlock(body: string, htmlBlock: string): string {
  const base = textToHtml(body);
  return `${base}${htmlBlock}`;
}
