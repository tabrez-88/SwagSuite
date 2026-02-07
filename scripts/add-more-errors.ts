import { storage } from "../server/storage";

const additionalErrors = [
  // 2024 Data for LYTD comparison
  {
    date: new Date('2024-01-15'),
    projectNumber: 'PRJ-2024-002',
    errorType: 'shipping',
    clientName: 'RetailMax Corp',
    vendorName: 'ShipQuick Logistics',
    responsibleParty: 'vendor',
    resolution: 'courier_shipping',
    costToLsd: '180.00',
    productionRep: 'Alex Rodriguez',
    orderRep: 'Sarah Johnson',
    clientRep: 'Maria Garcia',
    additionalNotes: 'Package delivered to wrong address due to vendor error.',
    isResolved: true,
    resolvedAt: new Date('2024-01-16'),
    createdBy: null
  },
  {
    date: new Date('2024-02-10'),
    projectNumber: 'PRJ-2024-008',
    errorType: 'printing',
    clientName: 'Brand Solutions Inc',
    vendorName: 'PrintCorp Express',
    responsibleParty: 'vendor',
    resolution: 'reprint',
    costToLsd: '290.00',
    productionRep: 'Mike Chen',
    orderRep: 'Emily Davis',
    clientRep: 'James Wilson',
    additionalNotes: 'Wrong ink colors used, reprinted entire order.',
    isResolved: true,
    resolvedAt: new Date('2024-02-12'),
    createdBy: null
  },
  {
    date: new Date('2024-03-05'),
    projectNumber: 'PRJ-2024-019',
    errorType: 'pricing',
    clientName: 'Startup Ventures',
    vendorName: 'QuickPrint Co',
    responsibleParty: 'lsd',
    resolution: 'refund',
    costToLsd: '125.00',
    productionRep: 'David Wilson',
    orderRep: 'Lisa Thompson',
    clientRep: 'Robert Chen',
    additionalNotes: 'Volume discount not applied correctly in quote.',
    isResolved: true,
    resolvedAt: new Date('2024-03-06'),
    createdBy: null
  },
  {
    date: new Date('2024-04-20'),
    projectNumber: 'PRJ-2024-031',
    errorType: 'oos',
    clientName: 'Conference Pro',
    vendorName: 'MegaSupply Ltd',
    responsibleParty: 'vendor',
    resolution: 'other',
    costToLsd: '95.00',
    productionRep: 'Sarah Johnson',
    orderRep: 'Alex Rodriguez',
    clientRep: 'Linda Davis',
    additionalNotes: 'Red polo shirts out of stock, substituted with burgundy.',
    isResolved: true,
    resolvedAt: new Date('2024-04-21'),
    createdBy: null
  },
  {
    date: new Date('2024-05-15'),
    projectNumber: 'PRJ-2024-045',
    errorType: 'artwork_proofing',
    clientName: 'Design Agency Plus',
    vendorName: 'ArtPrint Studio',
    responsibleParty: 'customer',
    resolution: 'credit_for_future_order',
    costToLsd: '0.00',
    productionRep: 'Emily Davis',
    orderRep: 'Mike Chen',
    clientRep: 'Steven Rodriguez',
    additionalNotes: 'Client approved wrong logo version, noticed after printing.',
    isResolved: true,
    resolvedAt: new Date('2024-05-16'),
    createdBy: null
  },
  {
    date: new Date('2024-06-08'),
    projectNumber: 'PRJ-2024-052',
    errorType: 'in_hands_date',
    clientName: 'EventMasters LLC',
    vendorName: 'RushPrint Services',
    responsibleParty: 'vendor',
    resolution: 'courier_shipping',
    costToLsd: '220.00',
    productionRep: 'David Wilson',
    orderRep: 'Lisa Thompson',
    clientRep: 'Michelle Johnson',
    additionalNotes: 'Production delayed 2 days, expedited shipping required.',
    isResolved: true,
    resolvedAt: new Date('2024-06-09'),
    createdBy: null
  },

  // Current year (2025) additional data
  {
    date: new Date('2025-01-03'),
    projectNumber: 'PRJ-2025-001',
    errorType: 'pricing',
    clientName: 'New Year Events',
    vendorName: 'FastPrint Solutions',
    responsibleParty: 'lsd',
    resolution: 'refund',
    costToLsd: '85.00',
    productionRep: 'Sarah Johnson',
    orderRep: 'Mike Chen',
    clientRep: 'David Park',
    additionalNotes: 'Rush fee not communicated upfront to client.',
    isResolved: true,
    resolvedAt: new Date('2025-01-04'),
    createdBy: null
  },
  {
    date: new Date('2025-01-28'),
    projectNumber: 'PRJ-2025-028',
    errorType: 'shipping',
    clientName: 'Corporate Solutions',
    vendorName: 'LogiShip Express',
    responsibleParty: 'vendor',
    resolution: 'reprint',
    costToLsd: '340.00',
    productionRep: 'Alex Rodriguez',
    orderRep: 'Emily Davis',
    clientRep: 'Sarah Kim',
    additionalNotes: 'Shipping boxes damaged in transit, water damage to products.',
    isResolved: false,
    createdBy: null
  },
  {
    date: new Date('2025-02-14'),
    projectNumber: 'PRJ-2025-034',
    errorType: 'printing',
    clientName: 'Valentine Promotions',
    vendorName: 'ColorMax Printing',
    responsibleParty: 'vendor',
    resolution: 'reprint',
    costToLsd: '155.00',
    productionRep: 'David Wilson',
    orderRep: 'Lisa Thompson',
    clientRep: 'John Martinez',
    additionalNotes: 'Pink hearts printed in red, color mismatch.',
    isResolved: true,
    resolvedAt: new Date('2025-02-15'),
    createdBy: null
  },
  {
    date: new Date('2025-03-10'),
    projectNumber: 'PRJ-2025-041',
    errorType: 'oos',
    clientName: 'Spring Festival Corp',
    vendorName: 'SeasonSupply Co',
    responsibleParty: 'vendor',
    resolution: 'other',
    costToLsd: '120.00',
    productionRep: 'Mike Chen',
    orderRep: 'Sarah Johnson',
    clientRep: 'Emma Wilson',
    additionalNotes: 'Green t-shirts unavailable, switched to forest green.',
    isResolved: true,
    resolvedAt: new Date('2025-03-11'),
    createdBy: null
  },
  {
    date: new Date('2025-04-22'),
    projectNumber: 'PRJ-2025-055',
    errorType: 'artwork_proofing',
    clientName: 'Earth Day Alliance',
    vendorName: 'EcoPrint Studio',
    responsibleParty: 'lsd',
    resolution: 'reprint',
    costToLsd: '200.00',
    productionRep: 'Emily Davis',
    orderRep: 'Alex Rodriguez',
    clientRep: 'Michael Green',
    additionalNotes: 'Typo in artwork not caught during proofing process.',
    isResolved: false,
    createdBy: null
  },
  {
    date: new Date('2025-05-18'),
    projectNumber: 'PRJ-2025-067',
    errorType: 'in_hands_date',
    clientName: 'Summer Campaign Co',
    vendorName: 'RapidPrint Inc',
    responsibleParty: 'vendor',
    resolution: 'courier_shipping',
    costToLsd: '175.00',
    productionRep: 'David Wilson',
    orderRep: 'Lisa Thompson',
    clientRep: 'Jessica Lee',
    additionalNotes: 'Memorial Day weekend delivery missed, expedited Monday delivery.',
    isResolved: true,
    resolvedAt: new Date('2025-05-19'),
    createdBy: null
  },
  {
    date: new Date('2025-06-25'),
    projectNumber: 'PRJ-2025-082',
    errorType: 'pricing',
    clientName: 'Mid-Year Sales Co',
    vendorName: 'BudgetPrint Express',
    responsibleParty: 'customer',
    resolution: 'other',
    costToLsd: '0.00',
    productionRep: 'Sarah Johnson',
    orderRep: 'Mike Chen',
    clientRep: 'Tony Brown',
    additionalNotes: 'Client requested price match after order placed.',
    isResolved: true,
    resolvedAt: new Date('2025-06-26'),
    createdBy: null
  },
  {
    date: new Date('2025-07-15'),
    projectNumber: 'PRJ-2025-094',
    errorType: 'shipping',
    clientName: 'Summer Sports League',
    vendorName: 'SportShip Logistics',
    responsibleParty: 'vendor',
    resolution: 'courier_shipping',
    costToLsd: '145.00',
    productionRep: 'Alex Rodriguez',
    orderRep: 'Emily Davis',
    clientRep: 'Chris Taylor',
    additionalNotes: 'Jerseys delivered to old facility address.',
    isResolved: true,
    resolvedAt: new Date('2025-07-16'),
    createdBy: null
  },

  // Recent August 2025 data for current period
  {
    date: new Date('2025-08-05'),
    projectNumber: 'PRJ-2025-105',
    errorType: 'printing',
    clientName: 'Back to School Inc',
    vendorName: 'SchoolPrint Co',
    responsibleParty: 'vendor',
    resolution: 'reprint',
    costToLsd: '265.00',
    productionRep: 'David Wilson',
    orderRep: 'Lisa Thompson',
    clientRep: 'Anna Foster',
    additionalNotes: 'School logo printed upside down on backpacks.',
    isResolved: false,
    createdBy: null
  },
  {
    date: new Date('2025-08-12'),
    projectNumber: 'PRJ-2025-112',
    errorType: 'oos',
    clientName: 'August Events LLC',
    vendorName: 'QuickStock Supply',
    responsibleParty: 'vendor',
    resolution: 'other',
    costToLsd: '90.00',
    productionRep: 'Mike Chen',
    orderRep: 'Sarah Johnson',
    clientRep: 'Kevin Wang',
    additionalNotes: 'Navy blue caps out of stock, substituted royal blue.',
    isResolved: true,
    resolvedAt: new Date('2025-08-13'),
    createdBy: null
  },
  {
    date: new Date('2025-08-20'),
    projectNumber: 'PRJ-2025-119',
    errorType: 'in_hands_date',
    clientName: 'Late Summer Festival',
    vendorName: 'ExpressPrint Solutions',
    responsibleParty: 'lsd',
    resolution: 'courier_shipping',
    costToLsd: '110.00',
    productionRep: 'Emily Davis',
    orderRep: 'Alex Rodriguez',
    clientRep: 'Maria Santos',
    additionalNotes: 'Order processing delayed due to internal scheduling error.',
    isResolved: false,
    createdBy: null
  }
];

async function addMoreErrors() {
  console.log('Adding more sample error data...');
  
  try {
    for (const errorData of additionalErrors) {
      await storage.createError(errorData);
      console.log(`Created error for project ${errorData.projectNumber}`);
    }
    
    console.log(`Successfully added ${additionalErrors.length} more errors`);
    console.log('Data now spans from 2024 to 2025 for meaningful comparisons');
  } catch (error) {
    console.error('Error adding data:', error);
  }
}

// Run if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addMoreErrors();
}

export { addMoreErrors };