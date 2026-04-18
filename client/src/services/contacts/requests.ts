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
    department: data.department || undefined,
    noMarketing: data.noMarketing || false,
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
    department: data.department || undefined,
    noMarketing: data.noMarketing || false,
    isPrimary: data.isPrimary,
    companyId,
  };

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
  data: Partial<ContactManagerFormData> & {
    isActive?: boolean;
    leadSource?: string;
    companyId?: string | null;
    supplierId?: string | null;
  };
}) {
  const payload: Record<string, unknown> = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    title: data.title,
    department: data.department,
    noMarketing: data.noMarketing,
    isPrimary: data.isPrimary,
  };
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.leadSource !== undefined) payload.leadSource = data.leadSource;
  if (data.companyId !== undefined) payload.companyId = data.companyId;
  if (data.supplierId !== undefined) payload.supplierId = data.supplierId;

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
  const res = await apiRequest("GET", `/api/contacts?companyId=${companyId}`);
  return res.json();
}

export async function fetchContactsBySupplier(supplierId: string) {
  const res = await apiRequest("GET", `/api/contacts?supplierId=${supplierId}`);
  return res.json();
}

/** Simple contact creation (no schema transformation — raw payload) */
export async function createSimpleContact(data: Record<string, any>) {
  const res = await apiRequest("POST", "/api/contacts", data);
  return res.json();
}
