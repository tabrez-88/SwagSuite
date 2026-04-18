/**
 * Public token-based approval endpoints. These do NOT require session auth —
 * the token in the URL IS the credential, so we don't pass credentials or
 * route through apiRequest's shared error handler.
 */

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---- Client (Quote / Sales Order) approval ----

export async function approveClientDocument(
  token: string,
  data: { notes?: string },
): Promise<any> {
  return postJson(`/api/client-approvals/${token}/approve`, data);
}

export async function declineClientDocument(
  token: string,
  data: { reason: string },
): Promise<any> {
  return postJson(`/api/client-approvals/${token}/decline`, data);
}

// ---- PO confirmation (vendor) ----

export async function confirmPurchaseOrder(
  token: string,
  notes?: string,
): Promise<any> {
  return postJson(`/api/po-confirmations/${token}/confirm`, { notes });
}

export async function declinePurchaseOrder(
  token: string,
  reason: string,
): Promise<any> {
  return postJson(`/api/po-confirmations/${token}/decline`, { reason });
}

// ---- Artwork approval ----

export async function approveArtwork(
  token: string,
  data: { comments?: string },
): Promise<any> {
  return postJson(`/api/approvals/${token}/approve`, data);
}

export async function rejectArtwork(
  token: string,
  data: { comments: string },
): Promise<any> {
  return postJson(`/api/approvals/${token}/reject`, data);
}

// ---- Vendor approval requests (admin review) ----

export async function fetchVendorApprovalRequests<T = any>(): Promise<T> {
  const res = await fetch("/api/vendor-approvals", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch approval requests");
  return res.json();
}

export async function reviewVendorApprovalRequest(
  id: string,
  data: { status: string; reviewNotes?: string },
): Promise<any> {
  const res = await fetch(`/api/vendor-approvals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update request");
  }
  return res.json();
}

// ---- Vendor approval creation ----

export async function createVendorApproval(data: {
  supplierId: string;
  orderId: string | number;
  reason: string;
}): Promise<any> {
  const res = await fetch("/api/vendor-approvals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to submit approval request");
  }
  return res.json();
}

// ---- Public presentation ----

export async function fetchPublicPresentation<T = any>(token: string): Promise<T> {
  return getJson<T>(`/api/presentation/${token}`);
}

export async function postPresentationComment(
  token: string,
  data: { orderItemId: number; content: string; clientName: string },
): Promise<any> {
  return postJson(`/api/presentation/${token}/comments`, data);
}
