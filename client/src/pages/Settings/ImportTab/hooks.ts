import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export type ImportEntity = "companies" | "contacts";

export interface ImportRowResult {
  row: number;
  status: "success" | "failed" | "skipped";
  id?: string;
  error?: string;
  data?: Record<string, string>;
}

export interface ImportSummary {
  entity: ImportEntity;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: ImportRowResult[];
}

export interface PreviewResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

// Canonical fields (mirrors server). Kept here so UI doesn't need to fetch.
export const COMPANY_FIELDS = [
  { key: "name", label: "Company Name", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "notes", label: "Notes" },
  { key: "accountNumber", label: "Account Number" },
  { key: "defaultTerms", label: "Default Terms" },
  { key: "goodsyncFolderUrl", label: "Goodsync Folder URL" },
] as const;

export const CONTACT_FIELDS = [
  { key: "companyName", label: "Company Name (matched to existing)" },
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "title", label: "Title" },
  { key: "department", label: "Department" },
  { key: "leadSource", label: "Lead Source" },
  { key: "isPrimary", label: "Is Primary (yes/no)" },
  { key: "mailingAddress", label: "Mailing Address" },
] as const;

async function postFormData(url: string, formData: FormData) {
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

function suggestMapping(
  headers: string[],
  fields: readonly { key: string; label: string }[],
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[_\s-]/g, "");
    // Exact match on canonical key
    const direct = fields.find(
      (f) => f.key.toLowerCase() === normalized,
    );
    if (direct) {
      mapping[header] = direct.key;
      continue;
    }
    // Heuristic matches
    if (/^(company|customer|clientname|account)$/.test(normalized))
      mapping[header] = "name";
    else if (/^(companyname|customername|clientaccount|client)$/.test(normalized))
      mapping[header] = fields === CONTACT_FIELDS ? "companyName" : "name";
    else if (/^(first|firstname|fname|given)$/.test(normalized))
      mapping[header] = "firstName";
    else if (/^(last|lastname|lname|surname|family)$/.test(normalized))
      mapping[header] = "lastName";
    else if (/^(e?mail|emailaddress)$/.test(normalized)) mapping[header] = "email";
    else if (/^(phone|tel|telephone|mobile|cell)$/.test(normalized))
      mapping[header] = "phone";
    else if (/^(web|website|url|site)$/.test(normalized)) mapping[header] = "website";
    else if (/^(title|jobtitle|position|role)$/.test(normalized))
      mapping[header] = "title";
    else if (/^(dept|department)$/.test(normalized))
      mapping[header] = "department";
    else if (/^(industry|sector|vertical)$/.test(normalized))
      mapping[header] = "industry";
    else if (/^(notes|comments|description)$/.test(normalized))
      mapping[header] = "notes";
    else if (/^(goodsync|archive|folder|folderurl|goodsyncfolder)$/.test(normalized))
      mapping[header] = "goodsyncFolderUrl";
    else if (/^(leadsource|source)$/.test(normalized))
      mapping[header] = "leadSource";
    else if (/^(address|mailingaddress|mailing)$/.test(normalized))
      mapping[header] = "mailingAddress";
    else if (/^(terms|defaultterms|paymentterms)$/.test(normalized))
      mapping[header] = "defaultTerms";
    else if (/^(account|accountnumber|acctno|accountno)$/.test(normalized))
      mapping[header] = "accountNumber";
  }
  return mapping;
}

export function useImportTab() {
  const { toast } = useToast();
  const [entity, setEntity] = useState<ImportEntity>("companies");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const fields = entity === "companies" ? COMPANY_FIELDS : CONTACT_FIELDS;

  const previewMutation = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData();
      fd.append("file", f);
      // Preview without a mapping first, so we learn the raw headers
      return (await postFormData("/api/import/preview", fd)) as PreviewResult;
    },
    onSuccess: (data) => {
      setPreview(data);
      // Auto-suggest a mapping based on header names
      setMapping(suggestMapping(data.headers, fields));
    },
    onError: (err: any) => {
      toast({
        title: "Preview failed",
        description: err?.message || "Could not parse CSV",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mapping", JSON.stringify(mapping));
      const url =
        entity === "companies" ? "/api/import/companies" : "/api/import/contacts";
      return (await postFormData(url, fd)) as ImportSummary;
    },
    onSuccess: (data) => {
      setSummary(data);
      toast({
        title: "Import complete",
        description: `${data.succeeded} succeeded, ${data.failed} failed, ${data.skipped} skipped`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Import failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setSummary(null);
    setMapping({});
    previewMutation.mutate(f);
  };

  const handleEntityChange = (next: ImportEntity) => {
    setEntity(next);
    setPreview(null);
    setSummary(null);
    setMapping({});
    setFile(null);
  };

  const updateMapping = (header: string, fieldKey: string) => {
    setMapping((prev) => ({ ...prev, [header]: fieldKey }));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setSummary(null);
    setMapping({});
  };

  return {
    entity,
    file,
    preview,
    mapping,
    summary,
    fields,
    previewMutation,
    importMutation,
    handleFileSelect,
    handleEntityChange,
    updateMapping,
    reset,
  };
}
