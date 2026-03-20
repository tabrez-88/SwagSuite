import { format } from "date-fns";

export interface DocumentEditorProps {
  document: any;
  order: any;
  orderItems: any[];
  companyName: string;
  primaryContact: any;
  onClose: () => void;
  getEditedItem: (id: string, item: any) => any;
  allArtworkItems?: Record<string, any[]>;
}

export interface EditableFields {
  // Header
  documentTitle: string;
  documentNumber: string;
  documentDate: string;
  documentDateRaw: string; // yyyy-MM-dd for date input
  inHandsDate: string;
  inHandsDateRaw: string; // yyyy-MM-dd for date input
  eventDate: string;
  eventDateRaw: string; // yyyy-MM-dd for date input
  supplierNotes: string;
  additionalInformation: string;

  // Company Info
  companyTitle: string;
  companySubtitle: string;

  // Bill To
  billToName: string;
  billToContact: string;
  billToEmail: string;
  billToPhone: string;

  // Ship To
  shipToAddress: string;

  // Vendor (for PO)
  vendorName: string;
  vendorAddress: string;
  vendorEmail: string;

  // Notes
  specialInstructions: string;
  footerNote: string;

  // Items (editable prices/quantities)
  items: {
    id: string;
    name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    total: number;
    imageUrl: string;
  }[];

  // Totals
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
}

// Helper function to format address from JSON
export function formatAddress(addressData: string | object | null | undefined): string {
  if (!addressData) return '';

  try {
    let address: any;

    if (typeof addressData === 'string') {
      const trimmed = addressData.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        address = JSON.parse(trimmed);
      } else {
        return addressData;
      }
    } else if (typeof addressData === 'object') {
      address = addressData;
    } else {
      return String(addressData);
    }

    const parts: string[] = [];
    if (address.contactName) parts.push(address.contactName);
    if (address.street) parts.push(address.street);
    const cityLine = [address.city, address.state].filter(Boolean).join(', ');
    const cityStateZip = cityLine + (address.zipCode ? ` ${address.zipCode}` : '');
    if (cityStateZip.trim()) parts.push(cityStateZip);
    if (address.country) parts.push(address.country);
    if (address.phone) parts.push(`Phone: ${address.phone}`);
    if (address.email) parts.push(`Email: ${address.email}`);

    return parts.join('\n');
  } catch {
    return typeof addressData === 'string' ? addressData : JSON.stringify(addressData);
  }
}

// Convert Date/string to yyyy-MM-dd for date inputs
export function toDateInputValue(d: string | Date | null | undefined): string {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return format(date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

// Convert yyyy-MM-dd to display format
export function formatDateDisplay(raw: string): string {
  if (!raw) return '';
  try {
    return format(new Date(raw + 'T00:00:00'), 'MMMM dd, yyyy');
  } catch {
    return raw;
  }
}
