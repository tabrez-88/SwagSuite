// Seed script to populate the database with dummy data
import 'dotenv/config';
import { db } from '../server/db';
import { 
  companies, 
  contacts, 
  suppliers, 
  products, 
  orders, 
  orderItems, 
  users 
} from '../shared/schema';

const sampleCompanies = [
  {
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
  },
  {
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
  }
];

const sampleSuppliers = [
  {
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
  }
];

async function seed() {
  console.log('Starting database seeding...');

  try {
    // 1. Seed Users (Team Members)
    const teamMembers = [
      { email: 'dev@example.com', firstName: 'Developer', lastName: 'Local', role: 'admin' },
      { email: 'sarah@swag.com', firstName: 'Sarah', lastName: 'Johnson', role: 'user' },
      { email: 'mike@swag.com', firstName: 'Mike', lastName: 'Chen', role: 'user' },
      { email: 'alex@swag.com', firstName: 'Alex', lastName: 'Rodriguez', role: 'manager' },
      { email: 'emily@swag.com', firstName: 'Emily', lastName: 'Davis', role: 'user' },
      { email: 'david@swag.com', firstName: 'David', lastName: 'Wilson', role: 'user' },
      { email: 'lisa@swag.com', firstName: 'Lisa', lastName: 'Thompson', role: 'user' },
    ];

    let salesRep;
    const insertedUsers = [];
    
    for (const member of teamMembers) {
      const existingUser = await db.query.users.findFirst({
        columns: { id: true, email: true },
        where: (users, { eq }) => eq(users.email, member.email)
      });

      if (existingUser) {
        insertedUsers.push(existingUser);
        console.log('✓ User already exists:', existingUser.email);
        if (member.email === 'dev@example.com') {
          salesRep = existingUser;
        }
      } else {
        const [newUser] = await db.insert(users).values(member).returning();
        insertedUsers.push(newUser);
        console.log('✓ User seeded:', newUser.email);
        if (member.email === 'dev@example.com') {
          salesRep = newUser;
        }
      }
    }
    
    console.log(`✓ Total users in database: ${insertedUsers.length}`);

    // 2. Seed Companies
    const insertedCompanies = await db.insert(companies).values(sampleCompanies).returning();
    console.log('✓ Companies seeded:', insertedCompanies.length);

    // 3. Seed Contacts (linked to first company)
    const [contact] = await db.insert(contacts).values({
      companyId: insertedCompanies[0].id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      title: 'Marketing Director',
      email: 'sarah.johnson@techcorp.com',
      phone: '(555) 123-4567',
      isPrimary: true
    }).returning();
    console.log('✓ Contact seeded:', contact.email);

    // 4. Seed Suppliers
    const [supplier] = await db.insert(suppliers).values(sampleSuppliers).returning();
    console.log('✓ Supplier seeded:', supplier.name);

    // 5. Seed Products
    const sampleProducts = [
      {
        name: 'Classic Cotton T-Shirt',
        sku: 'TEE-001',
        supplierId: supplier.id,
        description: 'High-quality 100% cotton t-shirt, perfect for promotional campaigns',
        basePrice: '8.50',
        minimumQuantity: 100,
        leadTime: 7,
        brand: 'PromoWear',
        category: 'Apparel',
        colors: ['White', 'Black', 'Navy', 'Red', 'Royal Blue'],
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        imprintMethods: ['Screen Print', 'Embroidery', 'Heat Transfer'],
        productType: 'apparel'
      },
      {
        name: 'Premium Polo Shirt',
        sku: 'POLO-001',
        supplierId: supplier.id,
        description: 'Professional polo shirt with moisture-wicking fabric',
        basePrice: '15.99',
        minimumQuantity: 50,
        leadTime: 10,
        brand: 'PromoWear',
        category: 'Apparel',
        colors: ['White', 'Black', 'Navy', 'Kelly Green', 'Maroon'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
        imprintMethods: ['Embroidery', 'Heat Transfer'],
        productType: 'apparel'
      },
      {
        name: 'Insulated Water Bottle',
        sku: 'BTL-001',
        supplierId: supplier.id,
        description: '20oz stainless steel insulated bottle, keeps drinks cold for 24 hours',
        basePrice: '12.50',
        minimumQuantity: 48,
        leadTime: 5,
        brand: 'HydroGear',
        category: 'Drinkware',
        colors: ['Silver', 'Black', 'Blue', 'Red', 'White'],
        sizes: ['20oz'],
        imprintMethods: ['Laser Engraving', 'Pad Print'],
        productType: 'hard_goods'
      },
      {
        name: 'Canvas Tote Bag',
        sku: 'BAG-001',
        supplierId: supplier.id,
        description: 'Eco-friendly 100% cotton canvas tote with reinforced handles',
        basePrice: '5.75',
        minimumQuantity: 100,
        leadTime: 7,
        brand: 'EcoBags',
        category: 'Bags',
        colors: ['Natural', 'Black', 'Navy', 'Red'],
        sizes: ['One Size'],
        imprintMethods: ['Screen Print', 'Heat Transfer'],
        productType: 'promotional'
      },
      {
        name: 'Performance Hoodie',
        sku: 'HOOD-001',
        supplierId: supplier.id,
        description: 'Athletic performance hoodie with kangaroo pocket',
        basePrice: '22.99',
        minimumQuantity: 24,
        leadTime: 14,
        brand: 'PromoWear',
        category: 'Apparel',
        colors: ['Black', 'Navy', 'Charcoal', 'Red', 'Forest Green'],
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        imprintMethods: ['Screen Print', 'Embroidery'],
        productType: 'apparel'
      }
    ];

    const insertedProducts = await db.insert(products).values(sampleProducts).returning();
    console.log('✓ Products seeded:', insertedProducts.length);

    // 6. Seed Orders with multiple scenarios
    const orderScenarios = [
      {
        orderNumber: `ORD-${Date.now()}-001`,
        companyId: insertedCompanies[0].id,
        contactId: contact.id,
        assignedUserId: salesRep.id,
        status: 'quote' as const,
        total: '850.00',
        subtotal: '850.00',
        notes: 'Initial quote for corporate event - 100 t-shirts',
        inHandsDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        orderNumber: `ORD-${Date.now()}-002`,
        companyId: insertedCompanies[1].id,
        contactId: contact.id,
        assignedUserId: salesRep.id,
        status: 'approved' as const,
        total: '1599.00',
        subtotal: '1599.00',
        notes: 'Approved order - 100 polo shirts for company uniforms',
        inHandsDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
      },
      {
        orderNumber: `ORD-${Date.now()}-003`,
        companyId: insertedCompanies[0].id,
        contactId: contact.id,
        assignedUserId: salesRep.id,
        status: 'in_production' as const,
        total: '600.00',
        subtotal: '600.00',
        notes: 'In production - 48 water bottles',
        inHandsDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      }
    ];

    const insertedOrders = await db.insert(orders).values(orderScenarios).returning();
    console.log('✓ Orders seeded:', insertedOrders.length);

    // 7. Seed Order Items
    const orderItemsData = [
      {
        orderId: insertedOrders[0].id,
        productId: insertedProducts[0].id, // Classic T-Shirt
        quantity: 100,
        unitPrice: '8.50',
        totalPrice: '850.00',
        selectedColor: 'Navy',
        selectedSize: 'L',
        availableColors: ['White', 'Black', 'Navy', 'Red'],
        availableSizes: ['S', 'M', 'L', 'XL']
      },
      {
        orderId: insertedOrders[1].id,
        productId: insertedProducts[1].id, // Premium Polo
        quantity: 100,
        unitPrice: '15.99',
        totalPrice: '1599.00',
        selectedColor: 'Navy',
        selectedSize: 'L',
        availableColors: ['White', 'Black', 'Navy'],
        availableSizes: ['S', 'M', 'L', 'XL', '2XL']
      },
      {
        orderId: insertedOrders[2].id,
        productId: insertedProducts[2].id, // Water Bottle
        quantity: 48,
        unitPrice: '12.50',
        totalPrice: '600.00',
        selectedColor: 'Black',
        selectedSize: '20oz',
        availableColors: ['Silver', 'Black', 'Blue'],
        availableSizes: ['20oz']
      }
    ];

    await db.insert(orderItems).values(orderItemsData);
    console.log('✓ Order Items seeded:', orderItemsData.length);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
