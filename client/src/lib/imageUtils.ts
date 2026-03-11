/**
 * Proxy external image URLs through our server to avoid CORS issues with html2canvas.
 * Cloudinary and same-origin images are returned as-is.
 */
export function proxyImg(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("/") || url.includes("cloudinary.com")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Convert an image URL to a base64 data URL via canvas.
 * First tries direct CORS loading; if that fails, uses server proxy.
 */
export async function imageToBase64(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;

  // Try direct CORS first
  const directResult = await new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) { resolve(""); return; }
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(""); return; }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        if (dataUrl.length < 100) { resolve(""); return; }
        resolve(dataUrl);
      } catch { resolve(""); }
    };
    img.onerror = () => resolve("");
    img.src = url + (url.includes("?") ? "&" : "?") + "_cb=" + Date.now();
  });

  if (directResult) return directResult;

  // Fallback: fetch through server proxy to bypass CORS
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { credentials: "include" });
    if (!response.ok) return url;
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Wait for all images inside an element to fully load,
 * then convert cross-origin image src to base64 data URLs
 * so html2canvas can capture them without CORS issues.
 * Returns a cleanup function to restore original src attributes.
 */
export async function preloadAndConvertImages(element: HTMLElement): Promise<() => void> {
  const imgs = element.querySelectorAll("img");
  const originalSrcs: Map<HTMLImageElement, string> = new Map();

  // Step 1: Wait for all images to finish loading first
  await Promise.all(
    Array.from(imgs).map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 5000);
        img.onload = () => { clearTimeout(timeout); resolve(); };
        img.onerror = () => { clearTimeout(timeout); resolve(); };
      });
    })
  );

  // Step 2: Convert each image to base64
  await Promise.all(
    Array.from(imgs).map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith("data:")) return;

      originalSrcs.set(img, src);

      try {
        const base64 = await imageToBase64(src);
        if (base64 && base64.startsWith("data:")) {
          img.src = base64;
          await new Promise<void>((resolve) => {
            if (img.complete) { resolve(); return; }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }
      } catch {
        // Skip — image won't appear in PDF but won't break generation
      }
    })
  );

  return () => {
    originalSrcs.forEach((originalSrc, img) => {
      img.src = originalSrc;
    });
  };
}
