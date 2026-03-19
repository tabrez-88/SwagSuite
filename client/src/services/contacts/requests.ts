import { apiRequest } from "@/lib/queryClient";
import type { ContactFormData } from "@/schemas/crm.schemas";
import type { ContactManagerFormData } from "@/schemas/crm.schemas";

/**
 * Create a contact from the CRM contacts page (supports company/vendor association).
 */
export async function createContact(data: ContactFormData) {
  const payload: Record<string, unknown> = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email || undefined,
    phone: data.phone || undefined,
    title: data.title || undefined,
    leadSource: data.leadSource || undefined,
    isPrimary: data.isPrimary,
  };
  if (data.associationType === "company" && data.companyId) {
    payload.companyId = data.companyId;
  }
  if (data.associationType === "vendor" && data.supplierId) {
    payload.supplierId = data.supplierId;
  }
  return await apiRequest("POST", "/api/contacts", payload);
}

/**
 * Create a contact scoped to a company (from ContactsManager).
 */
export async function createCompanyContact({
  companyId,
  data,
}: {
  companyId: string;
  data: ContactManagerFormData;
}) {
  const payload: Record<string, unknown> = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    title: data.title,
    isPrimary: data.isPrimary,
    companyId,
  };

  // Build billing address JSON if any field is filled
  if (data.billingStreet || data.billingCity || data.billingState || data.billingZipCode || data.billingCountry) {
    payload.billingAddress = JSON.stringify({
      street: data.billingStreet || "",
      city: data.billingCity || "",
      state: data.billingState || "",
      zipCode: data.billingZipCode || "",
      country: data.billingCountry || "",
      phone: "",
    });
  }

  // Build shipping address JSON if any field is filled
  if (data.shippingStreet || data.shippingCity || data.shippingState || data.shippingZipCode || data.shippingCountry) {
    payload.shippingAddress = JSON.stringify({
      street: data.shippingStreet || "",
      city: data.shippingCity || "",
      state: data.shippingState || "",
      zipCode: data.shippingZipCode || "",
      country: data.shippingCountry || "",
      phone: "",
    });
  }

  const response = await apiRequest("POST", "/api/contacts", payload);
  return response.json();
}

/**
 * Update a contact (from ContactsManager).
 */
export async function updateContact({
  id,
  data,
}: {
  id: string;
  data: Partial<ContactManagerFormData>;
}) {
  const payload: Record<string, unknown> = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    title: data.title,
    isPrimary: data.isPrimary,
  };

  // Build billing address JSON if any field is filled
  if (data.billingStreet || data.billingCity || data.billingState || data.billingZipCode || data.billingCountry) {
    payload.billingAddress = JSON.stringify({
      street: data.billingStreet || "",
      city: data.billingCity || "",
      state: data.billingState || "",
      zipCode: data.billingZipCode || "",
      country: data.billingCountry || "",
      phone: "",
    });
  }

  // Build shipping address JSON if any field is filled
  if (data.shippingStreet || data.shippingCity || data.shippingState || data.shippingZipCode || data.shippingCountry) {
    payload.shippingAddress = JSON.stringify({
      street: data.shippingStreet || "",
      city: data.shippingCity || "",
      state: data.shippingState || "",
      zipCode: data.shippingZipCode || "",
      country: data.shippingCountry || "",
      phone: "",
    });
  }

  const response = await apiRequest("PATCH", `/api/contacts/${id}`, payload);
  return response.json();
}

/**
 * Delete a contact by ID.
 */
export async function deleteContact(id: string) {
  await apiRequest("DELETE", `/api/contacts/${id}`);
  return true;
}

/**
 * Fetch contacts for a specific company.
 */
export async function fetchContactsByCompany(companyId: string) {
  const res = await fetch(`/api/contacts?companyId=${companyId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}
