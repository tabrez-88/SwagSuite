// Seed script to populate the database with dummy data
import { db } from '../server/db.js';
import { 
  companies, 
  contacts, 
  suppliers, 
  products, 
  orders, 
  orderItems, 
  artworkCards, 
  artworkColumns,
  activities,
  users 
} from '../shared/schema.js';

const sampleCompanies = [
  {
    id: 'comp_001',
    name: 'TechCorp Solutions',
    industry: 'Technology',
    website: 'https://techcorp.com',
    phone: '(555) 123-4567',
    email: 'contact@techcorp.com',
    address: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA',
    status: 'active'
  },
  {
    id: 'comp_002',
    name: 'GreenEarth Marketing',
    industry: 'Marketing',
    website: 'https://greenearth.com',
    phone: '(555) 234-5678',
    email: 'hello@greenearth.com',
    address: '456 Eco Avenue',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    country: 'USA',
    status: 'active'
  },
  {
    id: 'comp_003',
    name: 'Metro Healthcare',
    industry: 'Healthcare',
    website: 'https://metrohealthcare.com',
    phone: '(555) 345-6789',
    email: 'admin@metrohealthcare.com',
    address: '789 Medical Drive',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    status: 'active'
  },
  {
    id: 'comp_004',
    name: 'Summit Financial',
    industry: 'Finance',
    website: 'https://summitfinancial.com',
    phone: '(555) 456-7890',
    email: 'info@summitfinancial.com',
    address: '321 Wall Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10005',
    country: 'USA',
    status: 'active'
  },
  {
    id: 'comp_005',
    name: 'Creative Studios LLC',
    industry: 'Creative Services',
    website: 'https://creativestudios.com',
    phone: '(555) 567-8901',
    email: 'studio@creativestudios.com',
    address: '654 Artist Lane',
    city: 'Austin',
    state: 'TX',
    zipCode: '73301',
    country: 'USA',
    status: 'active'
  }
];

const sampleContacts = [
  {
    id: 'contact_001',
    companyId: 'comp_001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'Marketing Director',
    email: 'sarah.johnson@techcorp.com',
    phone: '(555) 123-4567',
    isPrimary: true
  },
  {
    id: 'contact_002',
    companyId: 'comp_002',
    firstName: 'Mike',
    lastName: 'Chen',
    title: 'Brand Manager',
    email: 'mike.chen@greenearth.com',
    phone: '(555) 234-5678',
    isPrimary: true
  },
  {
    id: 'contact_003',
    companyId: 'comp_003',
    firstName: 'Dr. Emily',
    lastName: 'Rodriguez',
    title: 'Administrator',
    email: 'emily.rodriguez@metrohealthcare.com',
    phone: '(555) 345-6789',
    isPrimary: true
  }
];

const sampleSuppliers = [
  {
    id: 'supp_001',
    name: 'PromoWear International',
    contactPerson: 'James Wilson',
    email: 'james@promowear.com',
    phone: '(800) 555-1234',
    address: '100 Industrial Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90028',
    country: 'USA',
    website: 'https://promowear.com',
    paymentTerms: 'Net 30',
    leadTime: 7,
    rating: 4.5
  },
  {
    id: 'supp_002',
    name: 'Custom Print Solutions',
    contactPerson: 'Lisa Thompson',
    email: 'lisa@customprint.com',
    phone: '(800) 555-2345',
    address: '200 Manufacturing Way',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    country: 'USA',
    website: 'https://customprint.com',
    paymentTerms: 'Net 15',
    leadTime: 5,
    rating: 4.8
  }
];

const sampleProducts = [
  {
    id: 'prod_001',
    name: 'Classic Cotton T-Shirt',
    sku: 'TEE-001',
    supplierId: 'supp_001',
    categoryId: null,
    description: 'High-quality 100% cotton t-shirt, perfect for promotional events',
    unitPrice: 8.50,
    costPrice: 4.25,
    inStock: 500,
    leadTime: 7
  },
  {
    id: 'prod_002',
    name: 'Custom Coffee Mug',
    sku: 'MUG-001',
    supplierId: 'supp_002',
    categoryId: null,
    description: '11oz ceramic coffee mug with custom printing',
    unitPrice: 6.75,
    costPrice: 3.25,
    inStock: 250,
    leadTime: 5
  },
  {
    id: 'prod_003',
    name: 'Branded Tote Bag',
    sku: 'BAG-001',
    supplierId: 'supp_001',
    categoryId: null,
    description: 'Eco-friendly canvas tote bag with custom logo',
    unitPrice: 12.00,
    costPrice: 6.50,
    inStock: 150,
    leadTime: 10
  }
];

console.log('Starting database seeding...');

// Seed the database
try {
  // Insert companies
  await db.insert(companies).values(sampleCompanies).onConflictDoNothing();
  console.log('✓ Companies seeded');

  // Insert contacts
  await db.insert(contacts).values(sampleContacts).onConflictDoNothing();
  console.log('✓ Contacts seeded');

  // Insert suppliers
  await db.insert(suppliers).values(sampleSuppliers).onConflictDoNothing();
  console.log('✓ Suppliers seeded');

  // Insert products
  await db.insert(products).values(sampleProducts).onConflictDoNothing();
  console.log('✓ Products seeded');

  console.log('Database seeding completed successfully!');
} catch (error) {
  console.error('Error seeding database:', error);
}