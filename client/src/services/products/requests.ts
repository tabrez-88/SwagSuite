import { apiRequest } from "@/lib/queryClient";

export async function createProduct(data: Record<string, any>) {
  const res = await apiRequest("POST", "/api/products", data);
  return res.json();
}

export async function updateProduct(id: string | number, data: Record<string, any>) {
  const res = await apiRequest("PATCH", `/api/products/${id}`, data);
  return res.json();
}

export async function deleteProduct(id: string | number) {
  await apiRequest("DELETE", `/api/products/${id}`);
}

export async function searchSSActivewear(query: string) {
  const response = await fetch(`/api/ss-activewear/search?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No products found in S&S Activewear catalog");
    }
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to search products");
  }
  return response.json();
}

export async function searchSage(query: string) {
  const response = await fetch(`/api/sage/products?search=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No products found in SAGE catalog");
    }
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(errorData.message || "Failed to search SAGE products");
  }
  const products = await response.json();
  return products.map((p: any) => ({
    id: p.productId || p.spc || p.SPC || p.id || "",
    name: p.productName || p.name || "Unnamed Product",
    description: p.description || "",
    sku: p.productNumber || p.sku || p.productId || "",
    price: p.pricingStructure?.minPrice ? parseFloat(p.pricingStructure.minPrice) : undefined,
    imageUrl: p.imageGallery?.[0] || p.thumbPic || "",
    brand: p.supplierName || p.brand || "",
    category: p.category || "",
    supplierName: p.supplierName || "",
    supplierId: p.supplierId || "",
    asiNumber: p.asiNumber || "",
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : p.dimensions ? [p.dimensions] : [],
  }));
}

export async function searchSanMar(query: string) {
  const response = await fetch(`/api/sanmar/search?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No products found in SanMar catalog");
    }
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(errorData.message || "Failed to search SanMar products");
  }
  return response.json();
}
