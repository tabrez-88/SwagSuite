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
  const res = await apiRequest("GET", `/api/ss-activewear/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function searchSage(query: string) {
  const res = await apiRequest("GET", `/api/sage/products?search=${encodeURIComponent(query)}`);
  const products = await res.json();
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
  const res = await apiRequest("GET", `/api/sanmar/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function fetchProductOrders(productId: string | number) {
  const res = await apiRequest("GET", `/api/products/${productId}/orders`);
  return res.json();
}

export async function fetchAllProducts(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/products");
  return res.json();
}

export async function fetchSsBrands(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/ss-activewear/brands");
  return res.json();
}

export async function syncProductFromSupplier(data: Record<string, any>): Promise<any> {
  const res = await apiRequest("POST", "/api/products/sync-from-supplier", data);
  return res.json();
}

export async function aiSearch(query: string): Promise<any> {
  const res = await apiRequest("POST", "/api/search/ai", { query });
  return res.json();
}

export async function fetchSagePricing(prodEId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/sage/product-pricing/${prodEId}`);
  return res.json();
}
