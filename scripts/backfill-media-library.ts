/**
 * Backfill script: Populates the media_library table from existing file tables.
 * Run with: npx tsx server/scripts/backfill-media-library.ts
 * Idempotent: checks sourceTable+sourceId to avoid duplicates.
 */

import "dotenv/config";
import { db } from "../db";
import { mediaLibrary, orderFiles, artworkFiles } from "@shared/schema";
import { projectActivities } from "@shared/project-schema";
import { eq, and, sql } from "drizzle-orm";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function determineFolder(ext: string): string {
  if (IMAGE_EXTS.includes(ext)) return "images";
  if (ext === "pdf") return "documents";
  if (["ai", "eps", "svg", "psd"].includes(ext)) return "design-files";
  if (["xlsx", "xls", "csv"].includes(ext)) return "spreadsheets";
  if (["docx", "doc"].includes(ext)) return "documents";
  return "general";
}

async function alreadyExists(sourceTable: string, sourceId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: mediaLibrary.id })
    .from(mediaLibrary)
    .where(and(eq(mediaLibrary.sourceTable, sourceTable), eq(mediaLibrary.sourceId, sourceId)))
    .limit(1);
  return !!row;
}

async function backfillOrderFiles() {
  const files = await db.select().from(orderFiles);
  let count = 0;
  for (const file of files) {
    if (!file.filePath?.includes("cloudinary")) continue;
    if (await alreadyExists("order_files", file.id)) continue;

    const ext = getExtension(file.originalName);
    await db.insert(mediaLibrary).values({
      cloudinaryUrl: file.filePath,
      cloudinaryPublicId: file.fileName,
      cloudinaryResourceType: ext === "pdf" ? "raw" : "auto",
      fileName: file.fileName,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      fileExtension: ext,
      thumbnailUrl: IMAGE_EXTS.includes(ext) ? file.filePath : null,
      folder: determineFolder(ext),
      category: file.fileType,
      orderId: file.orderId,
      orderItemId: file.orderItemId,
      sourceTable: "order_files",
      sourceId: file.id,
      uploadedBy: file.uploadedBy,
      tags: (file.tags as string[]) || [],
    });
    count++;
  }
  console.log(`Backfilled ${count} files from orderFiles`);
}

async function backfillArtworkFiles() {
  const files = await db.select().from(artworkFiles);
  let count = 0;
  for (const file of files) {
    if (!file.filePath?.includes("cloudinary")) continue;
    if (await alreadyExists("artwork_files", file.id)) continue;

    const ext = getExtension(file.originalName);
    await db.insert(mediaLibrary).values({
      cloudinaryUrl: file.filePath,
      cloudinaryPublicId: file.fileName,
      cloudinaryResourceType: ext === "pdf" ? "raw" : "auto",
      fileName: file.fileName,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      fileExtension: ext,
      thumbnailUrl: IMAGE_EXTS.includes(ext) ? file.filePath : null,
      folder: determineFolder(ext),
      category: "artwork",
      companyId: file.companyId,
      orderId: file.orderId,
      sourceTable: "artwork_files",
      sourceId: file.id,
      uploadedBy: file.uploadedBy,
      tags: ["artwork"],
    });
    count++;
  }
  console.log(`Backfilled ${count} files from artworkFiles`);
}

async function backfillProjectActivities() {
  const activities = await db
    .select()
    .from(projectActivities)
    .where(eq(projectActivities.activityType, "file_upload"));
  let count = 0;
  for (const activity of activities) {
    const metadata = activity.metadata as any;
    if (!metadata?.cloudinaryUrl) continue;
    if (await alreadyExists("project_activities", activity.id)) continue;

    const fileName = metadata.fileName || "unknown";
    const ext = getExtension(fileName);
    await db.insert(mediaLibrary).values({
      cloudinaryUrl: metadata.cloudinaryUrl,
      cloudinaryPublicId: metadata.cloudinaryPublicId || null,
      cloudinaryResourceType: ext === "pdf" ? "raw" : "auto",
      fileName: metadata.cloudinaryPublicId || fileName,
      originalName: fileName,
      fileSize: metadata.fileSize || null,
      mimeType: metadata.mimeType || null,
      fileExtension: ext,
      thumbnailUrl: IMAGE_EXTS.includes(ext) ? metadata.cloudinaryUrl : null,
      folder: determineFolder(ext),
      orderId: activity.orderId,
      sourceTable: "project_activities",
      sourceId: activity.id,
      uploadedBy: activity.userId,
      tags: [],
    });
    count++;
  }
  console.log(`Backfilled ${count} files from projectActivities`);
}

async function main() {
  console.log("Starting media library backfill...");
  await backfillOrderFiles();
  await backfillArtworkFiles();
  await backfillProjectActivities();
  console.log("Backfill complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
