import { apiRequest } from "@/lib/queryClient";
import type { VendorFormData, VendorContactFormData } from "@/schemas/crm.schemas";
import type { PreferredBenefits } from "./types";

// ── Vendor requests ──────────────────────────────────────────────

export async function createVendor(data: VendorFormData) {
  const response = await apiRequest("POST", "/api/suppliers", data);
  return response.json();
}

export async function updateVendor({
  id,
  data,
}: {
  id: string;
  data: Partial<VendorFormData>;
}) {
  // Format data for API, converting benefit fields to preferredBenefits object
  const apiData: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    website: data.website,
    address: data.address,
    contactPerson: data.contactPerson,
    paymentTerms: data.paymentTerms,
    notes: data.notes,
    isPreferred: data.isPreferred,
    doNotOrder: data.doNotOrder,
  };

  // If vendor is preferred, include benefits
  if (data.isPreferred) {
    apiData.preferredBenefits = {
      eqpPricing: data.eqpPricing || 0,
      rebatePercentage: data.rebatePercentage || 0,
      freeSetups: data.freeSetups || false,
      freeSpecSamples: data.freeSpecSamples || false,
      reducedSpecSamples: data.reducedSpecSamples || false,
      freeSelfPromo: data.freeSelfPromo || false,
      reducedSelfPromo: false,
      ytdEqpSavings: 0,
      ytdRebates: 0,
      selfPromosSent: 0,
      specSamplesSent: 0,
    };
  }

  const response = await apiRequest("PATCH", `/api/suppliers/${id}`, apiData);
  return response.json();
}

export async function deleteVendor(vendorId: string) {
  return await apiRequest("DELETE", `/api/suppliers/${vendorId}`);
}

export async function togglePreferred({
  vendorId,
  isPreferred,
}: {
  vendorId: string;
  isPreferred: boolean;
}) {
  const response = await apiRequest("PATCH", `/api/suppliers/${vendorId}`, {
    isPreferred,
  });
  return response.json();
}

export async function updateBenefits({
  vendorId,
  preferredBenefits,
}: {
  vendorId: string;
  preferredBenefits: PreferredBenefits;
}) {
  const response = await apiRequest("PATCH", `/api/suppliers/${vendorId}`, {
    preferredBenefits,
  });
  return response.json();
}

// ── Vendor Contact requests ──────────────────────────────────────

export async function createVendorContact(
  data: VendorContactFormData & { supplierId: string },
) {
  const response = await apiRequest("POST", "/api/contacts", data);
  return response.json();
}

export async function updateVendorContact({
  id,
  data,
}: {
  id: string;
  data: Partial<VendorContactFormData>;
}) {
  const response = await apiRequest("PATCH", `/api/contacts/${id}`, data);
  return response.json();
}

export async function deleteVendorContact(contactId: string) {
  return await apiRequest("DELETE", `/api/contacts/${contactId}`);
}

// ── Fetch helpers (used by queries) ──────────────────────────────

export async function fetchVendorProducts(vendorId: string) {
  const res = await fetch(`/api/products?supplierId=${vendorId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchVendorContacts(vendorId: string) {
  const res = await fetch(`/api/contacts?supplierId=${vendorId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}
