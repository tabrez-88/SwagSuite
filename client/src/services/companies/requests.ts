import { apiRequest } from "@/lib/queryClient";
import type { CompanyFormData } from "@/schemas/crm.schemas";

function transformSocialMediaLinks(data: Partial<CompanyFormData>) {
  const { linkedinUrl, twitterUrl, facebookUrl, instagramUrl, otherSocialUrl, ...rest } = data;
  const hasSocialFields =
    linkedinUrl !== undefined ||
    twitterUrl !== undefined ||
    facebookUrl !== undefined ||
    instagramUrl !== undefined ||
    otherSocialUrl !== undefined;

  return {
    ...rest,
    ...(hasSocialFields
      ? {
          socialMediaLinks: {
            linkedin: linkedinUrl || "",
            twitter: twitterUrl || "",
            facebook: facebookUrl || "",
            instagram: instagramUrl || "",
            other: otherSocialUrl || "",
          },
        }
      : {}),
  };
}

export async function createCompany(data: CompanyFormData) {
  // For create, always include social media links (even if empty)
  const { linkedinUrl, twitterUrl, facebookUrl, instagramUrl, otherSocialUrl, ...rest } = data;
  const formattedData = {
    ...rest,
    socialMediaLinks: {
      linkedin: linkedinUrl || "",
      twitter: twitterUrl || "",
      facebook: facebookUrl || "",
      instagram: instagramUrl || "",
      other: otherSocialUrl || "",
    },
  };
  const response = await apiRequest("POST", "/api/companies", formattedData);
  return response.json();
}

export async function updateCompany({
  id,
  data,
}: {
  id: string;
  data: Partial<CompanyFormData> & {
    customFields?: Record<string, string>;
  };
}) {
  const { customFields, ...formFields } = data;
  const formattedData = {
    ...transformSocialMediaLinks(formFields),
    ...(customFields !== undefined ? { customFields } : {}),
  };
  const response = await apiRequest("PATCH", `/api/companies/${id}`, formattedData);
  return response.json();
}

export async function deleteCompany(id: string) {
  await apiRequest("DELETE", `/api/companies/${id}`);
  return true;
}

export async function fetchCompanyContacts(companyId: string) {
  const res = await fetch(`/api/contacts?companyId=${companyId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

export interface CompanySpending {
  total: string | number;
  byMonth?: Array<{ month: string; amount: number }>;
  [key: string]: unknown;
}

export async function fetchCompanySpending(
  companyId: string,
  from?: string,
  to?: string,
): Promise<CompanySpending> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const url = `/api/companies/${companyId}/spending${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch spending");
  return res.json();
}

export async function reassignCompanyRep(companyId: string, userId: string | null) {
  const res = await apiRequest("PATCH", `/api/companies/${companyId}`, { assignedUserId: userId });
  return res.json();
}
