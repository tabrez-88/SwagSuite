/**
 * DocumentEditor public types + small address-formatting helper.
 *
 * `formatAddress` is also imported by other features (PODetailPanel,
 * CompanyAddressesManager, etc) so it stays here as the canonical helper.
 */
export interface DocumentEditorProps {
  document: any;
  /** @deprecated kept for backwards compatibility — no longer used. */
  order?: any;
  /** @deprecated */
  orderItems?: any[];
  /** @deprecated */
  companyName?: string;
  /** @deprecated */
  primaryContact?: any;
  onClose: () => void;
  /** @deprecated */
  getEditedItem?: (id: string, item: any) => any;
  /** @deprecated */
  allArtworkItems?: Record<string, any[]>;
}

// Helper function to format address from JSON
export function formatAddress(addressData: string | object | null | undefined): string {
  if (!addressData) return "";

  try {
    let address: any;

    if (typeof addressData === "string") {
      const trimmed = addressData.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        address = JSON.parse(trimmed);
      } else {
        return addressData;
      }
    } else if (typeof addressData === "object") {
      address = addressData;
    } else {
      return String(addressData);
    }

    const parts: string[] = [];
    if (address.contactName) parts.push(address.contactName);
    if (address.street) parts.push(address.street);
    const cityLine = [address.city, address.state].filter(Boolean).join(", ");
    const cityStateZip = cityLine + (address.zipCode ? ` ${address.zipCode}` : "");
    if (cityStateZip.trim()) parts.push(cityStateZip);
    if (address.country) parts.push(address.country);
    if (address.phone) parts.push(`Phone: ${address.phone}`);
    if (address.email) parts.push(`Email: ${address.email}`);

    return parts.join("\n");
  } catch {
    return typeof addressData === "string" ? addressData : JSON.stringify(addressData);
  }
}
