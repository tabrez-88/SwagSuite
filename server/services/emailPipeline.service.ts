/**
 * Email pipeline — single entry point for preparing email HTML.
 *
 * Pipeline order:
 * 1. Resolve merge tags (data-merge-tag spans + bare {{KEY}})
 * 2. Auto-append critical CTAs if missing (Stripe link, approval link)
 * 3. Sanitize HTML (strip scripts/handlers)
 * 4. Inline CSS for Gmail/Outlook compat
 * 5. Derive plain-text fallback
 */
import type { Request } from "express";
import {
  resolveMergeTags,
  hasMergeTag,
  buildMergeValues,
  type MergeContext,
} from "./emailMerge.service";

// ── Sanitizer (lightweight, no external dep for now) ───────────
function sanitizeHtml(html: string): string {
  // Strip <script> tags and content
  let clean = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // Strip on* event handlers from tags
  clean = clean.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Strip javascript: URLs
  clean = clean.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
  clean = clean.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");
  return clean;
}

// ── Plain-text derivation ──────────────────────────────────────
function stripHtml(html: string): string {
  return html
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

// ── CTA block builder ──────────────────────────────────────────
function ctaBlock(href: string, label: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
  <tr>
    <td align="center">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;font-family:Arial,sans-serif;mso-padding-alt:14px 32px;">${label}</a>
    </td>
  </tr>
</table>`;
}

// ── Fallback auto-append for critical links ────────────────────
async function autoAppendCriticalLinks(
  html: string,
  ctx: MergeContext,
  values: Record<string, string>,
): Promise<string> {
  let appended = html;

  switch (ctx.type) {
    case "invoice": {
      // If stripePaymentLink pill wasn't in the template but we have the URL
      if (!hasMergeTag(html, "stripePaymentLink") && values.stripePaymentLink) {
        // Extract href from the CTA button HTML
        const hrefMatch = values.stripePaymentLink.match(/href="([^"]+)"/);
        if (hrefMatch) {
          appended += ctaBlock(hrefMatch[1], "Pay Invoice");
        }
      }
      break;
    }

    case "quote": {
      if (!hasMergeTag(html, "approvalLink") && values.approvalLink) {
        const hrefMatch = values.approvalLink.match(/href="([^"]+)"/);
        if (hrefMatch) {
          appended += ctaBlock(hrefMatch[1], "Review & Approve Quote");
        }
      }
      break;
    }

    case "sales_order": {
      if (!hasMergeTag(html, "approvalLink") && values.approvalLink) {
        const hrefMatch = values.approvalLink.match(/href="([^"]+)"/);
        if (hrefMatch) {
          appended += ctaBlock(hrefMatch[1], "Review & Approve Sales Order");
        }
      }
      break;
    }

    case "presentation": {
      if (!hasMergeTag(html, "presentationLink") && values.presentationLink) {
        const hrefMatch = values.presentationLink.match(/href="([^"]+)"/);
        if (hrefMatch) {
          appended += ctaBlock(hrefMatch[1], "View Presentation");
        }
      }
      break;
    }

    // PO, proof, shipping, generic — no auto-append needed
    default:
      break;
  }

  return appended;
}

// ── CSS inlining (lightweight — inline key styles) ─────────────
function inlineCss(html: string): string {
  // Inline <p> margins for Outlook compat
  let result = html.replace(/<p(\s[^>]*)?>/gi, (_match, attrs) => {
    const a = attrs || "";
    if (/style\s*=/.test(a)) return `<p${a}>`;
    return `<p${a} style="margin: 0 0 12px 0;">`;
  });

  // Handle empty paragraphs (Lexical uses <p><br></p> for blank lines)
  result = result.replace(
    /<p style="margin: 0 0 12px 0;"><br\s*\/?><\/p>/gi,
    '<p style="margin: 0 0 12px 0; min-height: 1em;">&nbsp;</p>',
  );

  return result;
}

// ── Main pipeline ──────────────────────────────────────────────
export async function prepareEmailBody(
  rawHtml: string,
  ctx: MergeContext,
  req: Request,
): Promise<{ html: string; text: string }> {
  // 1. Resolve merge tags
  let html = await resolveMergeTags(rawHtml, ctx, req);

  // 2. Auto-append critical links if pills were absent
  const values = await buildMergeValues(ctx, req);
  html = await autoAppendCriticalLinks(html, ctx, values);

  // 3. Sanitize
  html = sanitizeHtml(html);

  // 4. Inline CSS
  html = inlineCss(html);

  // 5. Plain-text fallback
  const text = stripHtml(html);

  return { html, text };
}

/** Preview endpoint helper — resolves tags without sanitize/inline for live preview */
export async function previewEmailBody(
  rawHtml: string,
  ctx: MergeContext,
  req: Request,
): Promise<string> {
  return resolveMergeTags(rawHtml, ctx, req);
}

export { type MergeContext };
