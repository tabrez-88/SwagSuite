async function postFormData<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData, credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export async function previewImport<T = any>(file: File): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  return postFormData<T>("/api/import/preview", fd);
}

export async function importCsv<T = any>(
  entity: "companies" | "contacts",
  file: File,
  mapping: Record<string, string>,
): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("mapping", JSON.stringify(mapping));
  const url = entity === "companies" ? "/api/import/companies" : "/api/import/contacts";
  return postFormData<T>(url, fd);
}
