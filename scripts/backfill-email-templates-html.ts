/**
 * Backfill script: Populates body_html for existing email templates.
 * Converts plain-text body → HTML (same as textToHtml in client).
 * Run with: npx tsx scripts/backfill-email-templates-html.ts
 * Idempotent: only updates rows where body_html is empty/null.
 */

import "dotenv/config";
import { db } from "../server/db";
import { emailTemplates } from "@shared/schema";
import { eq, or, isNull, sql } from "drizzle-orm";

/** Convert plain text body to HTML (mirrors client/src/lib/emailFormat.ts::textToHtml) */
function textToHtml(text: string): string {
  if (!text) return "";
  // Escape HTML entities
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Convert double newlines to paragraphs, single newlines to <br>
  const paragraphs = html.split(/\n\n+/);
  if (paragraphs.length > 1) {
    html = paragraphs
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  } else {
    html = html.replace(/\n/g, "<br>");
  }

  // Preserve {{mergeTag}} patterns as data-merge-tag spans
  html = html.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => `<span data-merge-tag="${key}">{{${key}}}</span>`,
  );

  return html;
}

async function main() {
  console.log("Backfilling email_templates.body_html...");

  // Fetch all templates where body_html is empty or null
  const rows = await db
    .select({
      id: emailTemplates.id,
      body: emailTemplates.body,
      bodyHtml: emailTemplates.bodyHtml,
    })
    .from(emailTemplates)
    .where(
      or(
        isNull(emailTemplates.bodyHtml),
        eq(emailTemplates.bodyHtml, ""),
      ),
    );

  console.log(`Found ${rows.length} templates to backfill.`);

  let updated = 0;
  for (const row of rows) {
    const html = textToHtml(row.body);
    await db
      .update(emailTemplates)
      .set({
        bodyHtml: html,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, row.id));
    updated++;
    console.log(`  [${updated}/${rows.length}] Updated template ${row.id}`);
  }

  console.log(`Done. Updated ${updated} templates.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
