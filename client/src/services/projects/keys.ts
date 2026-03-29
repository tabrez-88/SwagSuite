export const projectKeys = {
  all: ["/api/projects"] as const,
  detail: (id: string | number) => [`/api/projects/${id}`] as const,
  items: (id: string | number) => [`/api/projects/${id}/items`] as const,
  itemsWithDetails: (id: string | number) => [`/api/projects/${id}/items-with-details`] as const,
  documents: (id: string | number) => [`/api/projects/${id}/documents`] as const,
  approvals: (id: string | number) => [`/api/projects/${id}/quote-approvals`] as const,
  invoice: (id: string | number) => [`/api/projects/${id}/invoice`] as const,
  artworks: (id: string | number) => [`/api/projects/${id}/all-artworks`] as const,
  itemLines: (id: string | number) => [`/api/projects/${id}/all-item-lines`] as const,
  itemCharges: (id: string | number) => [`/api/projects/${id}/all-item-charges`] as const,
  files: (id: string | number) => [`/api/projects/${id}/files`] as const,
  shipments: (id: string | number) => [`/api/projects/${id}/shipments`] as const,
  vendorInvoices: (id: string | number) => [`/api/projects/${id}/vendor-invoices`] as const,
  communications: (id: string | number, type?: string) =>
    type
      ? [`/api/projects/${id}/communications`, { type }] as const
      : [`/api/projects/${id}/communications`] as const,
  serviceCharges: (id: string | number) => [`/api/projects/${id}/service-charges`] as const,
  productComments: (id: string | number) => [`/api/projects/${id}/product-comments`] as const,
  portalTokens: (id: string | number) => [`/api/projects/${id}/portal-tokens`] as const,
  activities: (id: string | number) => [`/api/projects/${id}/activities`] as const,
};
