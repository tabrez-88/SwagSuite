/**
 * Mock PDF data for dev preview
 * Comprehensive test data representing a full project with all edge cases
 */

// Mock vendor for Purchase Order PDF
export const mockVendor = {
  id: "vendor-1",
  name: "S&S Activewear",
  email: "orders@ssactivewear.com",
  phone: "(800) 555-0123",
  contactPerson: "John Smith",
  address: JSON.stringify({
    street: "1500 Andrews Ave",
    city: "Bolingbrook",
    state: "IL",
    zip: "60490",
    country: "USA",
  }),
};

export const mockPdfData = {
  companyName: "Lax Reproductions",
  sellerName: "Liquid Screen Design",

  primaryContact: {
    firstName: "Shannon",
    lastName: "Smith",
    email: "shannon@laxreproductions.com",
    phone: "(555) 123-4567",
  },

  assignedUser: {
    firstName: "Kevin",
    lastName: "Woznak",
    email: "kwoznak@liquidscreendesign.com",
    profileImageUrl: undefined,
  },

  order: {
    id: "test-order-1",
    orderNumber: "ORD-2024-001",
    currentStage: "quote",
    quoteStatus: "open",
    customerPO: "PO-12345",
    inHandsDate: "2024-05-15",
    eventDate: "2024-05-20",
    shipDate: "2024-05-10",
    paymentTerms: "net_30",
    notes: "Please ensure artwork is approved before production. Rush order — need delivery by May 15th.",
    shippingCost: "125.00",
    shipping: "125.00",
    tax: "89.50",
    total: "1789.50",

    billingAddress: JSON.stringify({
      street: "123 Main Street",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country: "USA",
    }),

    shippingAddress: JSON.stringify({
      street: "456 Event Center Blvd",
      suite: "Suite 200",
      city: "Santa Monica",
      state: "CA",
      zip: "90405",
      country: "USA",
    }),
  },

  invoice: {
    id: "test-invoice-1",
    invoiceNumber: "INV-2024-001",
    issueDate: "2024-04-20",
    dueDate: "2024-05-20",
    status: "pending",
    taxAmount: "89.50",
    totalAmount: "1789.50",
    stripeInvoiceUrl: "https://invoice.stripe.com/i/test123",
  },

  orderItems: [
    {
      id: "item-1",
      productId: "prod-1",
      productName: "Custom Cotton T-Shirt",
      sku: "SS-COTTON-001",
      color: "Navy Blue",
      size: "Adult Unisex",
      quantity: 144,
      cost: "4.25",
      unitPrice: "8.50",
      totalPrice: "1224.00",
      supplierName: "S&S Activewear",
      notes: "Pre-shrunk, tagless labels",
      imprintMethod: "screen_print",
      imprintLocation: "front_chest",
      imprintColors: 3,
      imageUrl: undefined,
    },
    {
      id: "item-2",
      productId: "prod-2",
      productName: "Premium Tote Bag",
      sku: "BAG-TOTE-200",
      color: "Natural Canvas",
      size: "16x16x6",
      quantity: 50,
      cost: "3.50",
      unitPrice: "7.00",
      totalPrice: "350.00",
      supplierName: "BagCo",
      notes: "100% organic cotton canvas",
      imprintMethod: "screen_print",
      imprintLocation: "front_center",
      imprintColors: 2,
      imageUrl: undefined,
    },
  ],

  allItemLines: {
    "item-1": [
      { id: "line-1", quantity: 72, cost: "4.50", unitPrice: "9.00" },
      { id: "line-2", quantity: 72, cost: "4.00", unitPrice: "8.00" },
    ],
    "item-2": [],
  },

  allArtworkItems: {
    "item-1": [
      {
        id: "art-1",
        artworkName: "Company Logo - Front",
        imprintMethod: "screen_print",
        imprintLocation: "front_chest",
        imprintColors: 3,
        fileUrl: undefined,
      },
      {
        id: "art-2",
        artworkName: "Event Name - Back",
        imprintMethod: "screen_print",
        imprintLocation: "back_center",
        imprintColors: 2,
        fileUrl: undefined,
      },
    ],
    "item-2": [
      {
        id: "art-3",
        artworkName: "Simple Logo - Front",
        imprintMethod: "screen_print",
        imprintLocation: "front_center",
        imprintColors: 2,
        fileUrl: undefined,
      },
    ],
  },

  allItemCharges: {
    "item-1": [
      {
        id: "charge-1",
        chargeName: "Screen Setup Fee",
        chargeCategory: "fixed",
        quantity: 1,
        amount: "45.00",
        retailPrice: "45.00",
        displayToClient: true,
        includeInUnitPrice: false,
      },
      {
        id: "charge-2",
        chargeName: "Folding & Bagging",
        chargeCategory: "run",
        quantity: 144,
        amount: "0.25",
        retailPrice: "0.50",
        displayToClient: true,
        includeInUnitPrice: false,
      },
    ],
    "item-2": [
      {
        id: "charge-3",
        chargeName: "Rush Fee",
        chargeCategory: "fixed",
        quantity: 1,
        amount: "75.00",
        retailPrice: "75.00",
        displayToClient: true,
        includeInUnitPrice: false,
      },
    ],
  },

  allArtworkCharges: {
    "art-1": [
      {
        id: "art-charge-1",
        chargeName: "3-Color Screen Print",
        chargeCategory: "run",
        quantity: 144,
        retailPrice: "1.50",
        displayMode: "add_to_price",
      },
    ],
    "art-2": [
      {
        id: "art-charge-2",
        chargeName: "2-Color Screen Print",
        chargeCategory: "run",
        quantity: 144,
        retailPrice: "1.00",
        displayMode: "add_to_price",
      },
    ],
    "art-3": [
      {
        id: "art-charge-3",
        chargeName: "2-Color Screen Print",
        chargeCategory: "run",
        quantity: 50,
        retailPrice: "1.25",
        displayMode: "add_to_price",
      },
    ],
  },

  serviceCharges: [
    {
      id: "service-1",
      chargeName: "Graphic Design Services",
      chargeType: "fixed",
      quantity: 2,
      unitPrice: "85.00",
      displayToClient: true,
    },
    {
      id: "service-2",
      chargeName: "Rush Processing",
      chargeType: "fixed",
      quantity: 1,
      unitPrice: "150.00",
      displayToClient: true,
    },
  ],
};
