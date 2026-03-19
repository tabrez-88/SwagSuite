export const orderKeys = {
  all: ["/api/orders"] as const,
  detail: (id: string | number) => [`/api/orders/${id}`] as const,
  items: (id: string | number) => [`/api/orders/${id}/items`] as const,
  documents: (id: string | number) => [`/api/orders/${id}/documents`] as const,
  approvals: (id: string | number) => [`/api/orders/${id}/quote-approvals`] as const,
  invoice: (id: string | number) => [`/api/orders/${id}/invoice`] as const,
  artworks: (id: string | number) => [`/api/orders/${id}/all-artworks`] as const,
  itemLines: (id: string | number) => [`/api/orders/${id}/all-item-lines`] as const,
  itemCharges: (id: string | number) => [`/api/orders/${id}/all-item-charges`] as const,
  files: (id: string | number) => [`/api/orders/${id}/files`] as const,
  shipments: (id: string | number) => [`/api/orders/${id}/shipments`] as const,
  vendorInvoices: (id: string | number) => [`/api/orders/${id}/vendor-invoices`] as const,
  communications: (id: string | number, type?: string) =>
    type
      ? [`/api/orders/${id}/communications`, { type }] as const
      : [`/api/orders/${id}/communications`] as const,
  serviceCharges: (id: string | number) => [`/api/orders/${id}/service-charges`] as const,
  productComments: (id: string | number) => [`/api/orders/${id}/product-comments`] as const,
  portalTokens: (id: string | number) => [`/api/orders/${id}/portal-tokens`] as const,
  activities: (id: string | number) => [`/api/projects/${id}/activities`] as const,
};
