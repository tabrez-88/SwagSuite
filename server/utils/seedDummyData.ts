import { db } from "../db";
import { companies, suppliers, products, orders, orderItems, artworkCards } from "@shared/schema";
import { artworkKanbanRepository } from "../repositories/artworkKanban.repository";

export async function seedDummyData(): Promise<void> {
    console.log("Starting seedDummyData method...");
    // Sample companies
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
        status: 'active' as const
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
        status: 'active' as const
      },
      {
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
        status: 'active' as const
      },
      {
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
        status: 'active' as const
      },
      {
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
        status: 'active' as const
      },
      {
        name: 'NextGen Robotics',
        industry: 'Robotics',
        website: 'https://nextgenrobotics.com',
        phone: '(555) 678-9012',
        email: 'info@nextgenrobotics.com',
        address: '987 Innovation Drive',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Ocean Blue Consulting',
        industry: 'Consulting',
        website: 'https://oceanblue.com',
        phone: '(555) 789-0123',
        email: 'contact@oceanblue.com',
        address: '147 Coastal Road',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Mountain Peak Adventures',
        industry: 'Tourism',
        website: 'https://mountainpeak.com',
        phone: '(555) 890-1234',
        email: 'adventures@mountainpeak.com',
        address: '258 Alpine Way',
        city: 'Denver',
        state: 'CO',
        zipCode: '80201',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Urban Eats Restaurant Group',
        industry: 'Food & Beverage',
        website: 'https://urbaneats.com',
        phone: '(555) 901-2345',
        email: 'corporate@urbaneats.com',
        address: '369 Culinary Street',
        city: 'Las Vegas',
        state: 'NV',
        zipCode: '89101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Bright Future Education',
        industry: 'Education',
        website: 'https://brightfuture.edu',
        phone: '(555) 012-3456',
        email: 'admin@brightfuture.edu',
        address: '741 Learning Lane',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Solar Systems Inc',
        industry: 'Energy',
        website: 'https://solarsystems.com',
        phone: '(555) 123-7890',
        email: 'info@solarsystems.com',
        address: '852 Energy Boulevard',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Diamond Jewelry Co',
        industry: 'Retail',
        website: 'https://diamondjewelry.com',
        phone: '(555) 234-8901',
        email: 'sales@diamondjewelry.com',
        address: '963 Luxury Avenue',
        city: 'Beverly Hills',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Fitness First Gyms',
        industry: 'Fitness',
        website: 'https://fitnessfirst.com',
        phone: '(555) 345-9012',
        email: 'membership@fitnessfirst.com',
        address: '159 Workout Way',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30301',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Pet Paradise Veterinary',
        industry: 'Veterinary',
        website: 'https://petparadise.com',
        phone: '(555) 456-0123',
        email: 'care@petparadise.com',
        address: '357 Animal Lane',
        city: 'Sacramento',
        state: 'CA',
        zipCode: '94203',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Cloud Nine Software',
        industry: 'Software',
        website: 'https://cloudnine.com',
        phone: '(555) 567-1234',
        email: 'dev@cloudnine.com',
        address: '468 Code Street',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Fresh Garden Organics',
        industry: 'Agriculture',
        website: 'https://freshgarden.com',
        phone: '(555) 678-2345',
        email: 'orders@freshgarden.com',
        address: '579 Farm Road',
        city: 'Des Moines',
        state: 'IA',
        zipCode: '50301',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Steel Works Manufacturing',
        industry: 'Manufacturing',
        website: 'https://steelworks.com',
        phone: '(555) 789-3456',
        email: 'production@steelworks.com',
        address: '680 Industrial Park',
        city: 'Pittsburgh',
        state: 'PA',
        zipCode: '15201',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Coastal Real Estate',
        industry: 'Real Estate',
        website: 'https://coastalrealty.com',
        phone: '(555) 890-4567',
        email: 'listings@coastalrealty.com',
        address: '791 Beachfront Drive',
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Law Offices of Smith & Associates',
        industry: 'Legal',
        website: 'https://smithlaw.com',
        phone: '(555) 901-5678',
        email: 'partners@smithlaw.com',
        address: '802 Justice Boulevard',
        city: 'Washington',
        state: 'DC',
        zipCode: '20001',
        country: 'USA',
        status: 'active' as const
      },
      {
        name: 'Premier Auto Dealership',
        industry: 'Automotive',
        website: 'https://premierauto.com',
        phone: '(555) 012-6789',
        email: 'sales@premierauto.com',
        address: '913 Motor Mile',
        city: 'Detroit',
        state: 'MI',
        zipCode: '48201',
        country: 'USA',
        status: 'active' as const
      }
    ];

    // Sample suppliers
    const sampleSuppliers = [
      { name: 'PromoWear International', contactPerson: 'James Wilson', email: 'james@promowear.com', phone: '(800) 555-1234', address: '100 Industrial Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90028', country: 'USA', website: 'https://promowear.com', paymentTerms: 'Net 30', leadTime: 7, rating: 4.5 },
      { name: 'Custom Print Solutions', contactPerson: 'Lisa Thompson', email: 'lisa@customprint.com', phone: '(800) 555-2345', address: '200 Manufacturing Way', city: 'Dallas', state: 'TX', zipCode: '75201', country: 'USA', website: 'https://customprint.com', paymentTerms: 'Net 15', leadTime: 5, rating: 4.8 },
      { name: 'Elite Embroidery Co', contactPerson: 'Maria Garcia', email: 'maria@eliteembroidery.com', phone: '(800) 555-3456', address: '300 Stitch Street', city: 'Phoenix', state: 'AZ', zipCode: '85001', country: 'USA', website: 'https://eliteembroidery.com', paymentTerms: 'Net 30', leadTime: 10, rating: 4.3 },
      { name: 'Precision Engraving Services', contactPerson: 'Robert Kim', email: 'robert@precisionengraving.com', phone: '(800) 555-4567', address: '400 Laser Lane', city: 'Atlanta', state: 'GA', zipCode: '30301', country: 'USA', website: 'https://precisionengraving.com', paymentTerms: 'Net 15', leadTime: 3, rating: 4.9 },
      { name: 'Bulk Promotional Items', contactPerson: 'Jennifer Davis', email: 'jennifer@bulkpromo.com', phone: '(800) 555-5678', address: '500 Wholesale Way', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA', website: 'https://bulkpromo.com', paymentTerms: 'Net 45', leadTime: 14, rating: 4.2 },
      { name: 'TechGadget Distributors', contactPerson: 'David Chen', email: 'david@techgadget.com', phone: '(800) 555-6789', address: '600 Technology Boulevard', city: 'San Jose', state: 'CA', zipCode: '95101', country: 'USA', website: 'https://techgadget.com', paymentTerms: 'Net 30', leadTime: 21, rating: 4.6 },
      { name: 'Eco-Friendly Products LLC', contactPerson: 'Sarah Green', email: 'sarah@ecofriendly.com', phone: '(800) 555-7890', address: '700 Sustainable Street', city: 'Portland', state: 'OR', zipCode: '97201', country: 'USA', website: 'https://ecofriendly.com', paymentTerms: 'Net 30', leadTime: 12, rating: 4.7 },
      { name: 'Corporate Gifts Unlimited', contactPerson: 'Michael Brown', email: 'michael@corpgifts.com', phone: '(800) 555-8901', address: '800 Executive Drive', city: 'New York', state: 'NY', zipCode: '10005', country: 'USA', website: 'https://corpgifts.com', paymentTerms: 'Net 15', leadTime: 7, rating: 4.4 },
      { name: 'Sports Merchandise Pro', contactPerson: 'Amanda Johnson', email: 'amanda@sportsmerchandise.com', phone: '(800) 555-9012', address: '900 Athletic Avenue', city: 'Denver', state: 'CO', zipCode: '80201', country: 'USA', website: 'https://sportsmerchandise.com', paymentTerms: 'Net 30', leadTime: 8, rating: 4.5 },
      { name: 'Premium Packaging Solutions', contactPerson: 'Kevin Lee', email: 'kevin@premiumpackaging.com', phone: '(800) 555-0123', address: '1000 Package Place', city: 'Memphis', state: 'TN', zipCode: '38101', country: 'USA', website: 'https://premiumpackaging.com', paymentTerms: 'Net 45', leadTime: 15, rating: 4.1 }
    ];

    // Insert companies
    const insertedCompanies = await db.insert(companies).values(sampleCompanies).onConflictDoNothing().returning();

    // Insert suppliers
    const insertedSuppliers = await db.insert(suppliers).values(sampleSuppliers).onConflictDoNothing().returning();

    // Sample products with variety
    const sampleProducts = [
      { name: 'Classic Cotton T-Shirt', sku: 'TEE-001', supplierId: insertedSuppliers[0]?.id || 'default-supplier', description: 'High-quality 100% cotton t-shirt', unitPrice: 8.50, costPrice: 4.25, inStock: 500, leadTime: 7 },
      { name: 'Custom Coffee Mug', sku: 'MUG-001', supplierId: insertedSuppliers[1]?.id || 'default-supplier', description: '11oz ceramic coffee mug with custom printing', unitPrice: 6.75, costPrice: 3.25, inStock: 250, leadTime: 5 },
      { name: 'Branded Tote Bag', sku: 'BAG-001', supplierId: insertedSuppliers[0]?.id || 'default-supplier', description: 'Eco-friendly canvas tote bag', unitPrice: 12.00, costPrice: 6.50, inStock: 150, leadTime: 10 },
      { name: 'Wireless Phone Charger', sku: 'TECH-001', supplierId: insertedSuppliers[5]?.id || 'default-supplier', description: 'Qi-compatible wireless charging pad', unitPrice: 25.00, costPrice: 12.50, inStock: 75, leadTime: 21 },
      { name: 'Embroidered Polo Shirt', sku: 'POLO-001', supplierId: insertedSuppliers[2]?.id || 'default-supplier', description: 'Professional polo shirt with embroidered logo', unitPrice: 18.50, costPrice: 9.25, inStock: 200, leadTime: 10 },
      { name: 'Stainless Steel Water Bottle', sku: 'BTL-001', supplierId: insertedSuppliers[3]?.id || 'default-supplier', description: '32oz insulated water bottle with laser engraving', unitPrice: 22.00, costPrice: 11.00, inStock: 100, leadTime: 3 },
      { name: 'Eco-Friendly Notebook', sku: 'NOTE-001', supplierId: insertedSuppliers[6]?.id || 'default-supplier', description: 'Recycled paper notebook', unitPrice: 8.00, costPrice: 4.00, inStock: 300, leadTime: 12 },
      { name: 'Executive Pen Set', sku: 'PEN-001', supplierId: insertedSuppliers[7]?.id || 'default-supplier', description: 'Premium metal pen set in gift box', unitPrice: 35.00, costPrice: 17.50, inStock: 50, leadTime: 7 },
      { name: 'Sports Drawstring Bag', sku: 'SPORT-001', supplierId: insertedSuppliers[8]?.id || 'default-supplier', description: 'Durable polyester drawstring bag', unitPrice: 4.50, costPrice: 2.25, inStock: 400, leadTime: 8 },
      { name: 'Premium Gift Box', sku: 'BOX-001', supplierId: insertedSuppliers[9]?.id || 'default-supplier', description: 'Luxury packaging box with custom printing', unitPrice: 15.00, costPrice: 7.50, inStock: 80, leadTime: 15 },
      { name: 'Fleece Jacket', sku: 'JACKET-001', supplierId: insertedSuppliers[0]?.id || 'default-supplier', description: 'Soft fleece jacket with embroidered logo', unitPrice: 42.00, costPrice: 21.00, inStock: 60, leadTime: 14 },
      { name: 'USB Flash Drive', sku: 'USB-001', supplierId: insertedSuppliers[5]?.id || 'default-supplier', description: '16GB USB drive with custom logo printing', unitPrice: 12.50, costPrice: 6.25, inStock: 200, leadTime: 21 },
      { name: 'Desk Calendar', sku: 'CAL-001', supplierId: insertedSuppliers[1]?.id || 'default-supplier', description: '12-month desk calendar', unitPrice: 9.00, costPrice: 4.50, inStock: 150, leadTime: 5 },
      { name: 'Travel Mug', sku: 'TRAVEL-001', supplierId: insertedSuppliers[3]?.id || 'default-supplier', description: '16oz insulated travel mug', unitPrice: 16.50, costPrice: 8.25, inStock: 120, leadTime: 3 },
      { name: 'Laptop Sleeve', sku: 'SLEEVE-001', supplierId: insertedSuppliers[4]?.id || 'default-supplier', description: 'Padded laptop sleeve for 15" laptops', unitPrice: 28.00, costPrice: 14.00, inStock: 85, leadTime: 14 },
      { name: 'Stress Ball', sku: 'STRESS-001', supplierId: insertedSuppliers[4]?.id || 'default-supplier', description: 'Foam stress ball in custom shapes', unitPrice: 2.50, costPrice: 1.25, inStock: 1000, leadTime: 14 },
      { name: 'Bluetooth Speaker', sku: 'SPEAKER-001', supplierId: insertedSuppliers[5]?.id || 'default-supplier', description: 'Portable Bluetooth speaker', unitPrice: 45.00, costPrice: 22.50, inStock: 40, leadTime: 21 },
      { name: 'Recycled Mousepad', sku: 'PAD-001', supplierId: insertedSuppliers[6]?.id || 'default-supplier', description: 'Eco-friendly mousepad', unitPrice: 3.50, costPrice: 1.75, inStock: 500, leadTime: 12 },
      { name: 'Executive Business Card Holder', sku: 'CARD-001', supplierId: insertedSuppliers[7]?.id || 'default-supplier', description: 'Premium metal business card holder', unitPrice: 18.00, costPrice: 9.00, inStock: 75, leadTime: 7 },
      { name: 'Team Jersey', sku: 'JERSEY-001', supplierId: insertedSuppliers[8]?.id || 'default-supplier', description: 'Moisture-wicking sports jersey', unitPrice: 32.00, costPrice: 16.00, inStock: 90, leadTime: 8 }
    ];

    // Insert products
    const insertedProducts = await db.insert(products).values(sampleProducts).onConflictDoNothing().returning();

    // Create sample orders
    const orderStatuses = ['quote', 'pending_approval', 'approved', 'in_production', 'shipped', 'delivered'] as const;
    const sampleOrders = [];

    for (let i = 0; i < 18; i++) {
      const company = insertedCompanies[i % insertedCompanies.length];
      const status = orderStatuses[i % orderStatuses.length];
      const orderValue = 500 + (i * 150) + Math.random() * 1000;
      const orderType = i % 3 === 0 ? 'rush_order' : 'sales_order' as const;

      sampleOrders.push({
        orderNumber: `ORD-2025-${String(1001 + i).padStart(4, '0')}`,
        companyId: company?.id || 'default-company',
        status,
        orderType,
        subtotal: orderValue.toFixed(2),
        tax: (orderValue * 0.08).toFixed(2),
        shipping: (orderValue * 0.05).toFixed(2),
        total: (orderValue * 1.13).toFixed(2),
        margin: (45.0 + (Math.random() * 10)).toFixed(2),
        inHandsDate: new Date(Date.now() + (i * 7 + 14) * 24 * 60 * 60 * 1000),
        eventDate: new Date(Date.now() + (i * 7 + 21) * 24 * 60 * 60 * 1000),
        notes: `Order for ${company?.name || 'Company'} - ${orderType === 'rush_order' ? 'Rush delivery required' : 'Standard processing'}`,
        customerNotes: `Thank you for your business! Expected delivery: ${i + 7}-${i + 14} business days.`,
        trackingNumber: status === 'shipped' || status === 'delivered' ? `1Z999AA1${String(i).padStart(10, '0')}` : null
      });
    }

    // Insert orders
    const insertedOrders = await db.insert(orders).values(sampleOrders).onConflictDoNothing().returning();

    // Create order items
    const sampleOrderItems: any[] = [];
    insertedOrders.forEach((order) => {
      const numItems = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numItems; i++) {
        const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        const quantity = 25 + Math.floor(Math.random() * 475);
        const unitPrice = 10 + Math.random() * 40;

        sampleOrderItems.push({
          orderId: order.id,
          productId: product?.id || 'default-product',
          supplierId: product?.supplierId || insertedSuppliers[0]?.id,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: (quantity * unitPrice).toFixed(2),
          color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Navy'][Math.floor(Math.random() * 6)],
          size: ['S', 'M', 'L', 'XL', 'XXL'][Math.floor(Math.random() * 5)],
          imprintLocation: ['Front', 'Back', 'Left Chest', 'Right Chest'][Math.floor(Math.random() * 4)],
          imprintMethod: ['Screen Print', 'Embroidery', 'Heat Transfer', 'Laser Engraving'][Math.floor(Math.random() * 4)]
        });
      }
    });

    if (sampleOrderItems.length > 0) {
      await db.insert(orderItems).values(sampleOrderItems).onConflictDoNothing();
    }

    // Get artwork columns
    let artworkColumnsData = await artworkKanbanRepository.getArtworkColumns();
    if (artworkColumnsData.length === 0) {
      await artworkKanbanRepository.initializeArtworkColumns([
        { name: 'PMS Colors', position: 1, color: '#EF4444', isDefault: true },
        { name: 'Artist Schedule', position: 2, color: '#F97316', isDefault: true },
        { name: 'Artwork to Do', position: 3, color: '#EAB308', isDefault: true },
        { name: 'In Progress', position: 4, color: '#3B82F6', isDefault: true },
        { name: 'Questions and clarifications', position: 5, color: '#8B5CF6', isDefault: true },
        { name: 'For Review', position: 6, color: '#EC4899', isDefault: true },
        { name: 'Sent to Client', position: 7, color: '#10B981', isDefault: true },
        { name: 'Completed', position: 8, color: '#22C55E', isDefault: true }
      ]);
      artworkColumnsData = await artworkKanbanRepository.getArtworkColumns();
    }

    // Create sample artwork cards
    const sampleArtworkCards: any[] = [];
    const cardTitles = [
      'TechCorp Logo Design', 'GreenEarth Tote Bag Artwork', 'Healthcare Conference Materials',
      'Financial Services Brochure', 'Creative Studios Brand Package', 'Robotics Trade Show Banners',
      'Ocean Blue Business Cards', 'Mountain Adventures T-Shirt Design', 'Urban Eats Menu Design',
      'Education Program Materials', 'Solar Systems Infographic', 'Diamond Jewelry Catalog',
      'Fitness First Merchandise', 'Pet Paradise Signage', 'Cloud Nine App Icons',
      'Fresh Garden Labels', 'Steel Works Safety Posters', 'Coastal Realty Flyers'
    ];
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;

    cardTitles.forEach((title, index) => {
      const column = artworkColumnsData[index % artworkColumnsData.length];
      const company = insertedCompanies[index % insertedCompanies.length];
      const order = insertedOrders[index % insertedOrders.length];

      sampleArtworkCards.push({
        title,
        description: `Custom artwork design for ${company?.name || 'client'} - ${title.toLowerCase()}`,
        columnId: column?.id || 'default-column',
        companyId: company?.id || null,
        orderId: order?.id || null,
        position: Math.floor(index / artworkColumnsData.length) + 1,
        priority: priorities[index % priorities.length],
        dueDate: new Date(Date.now() + (index + 3) * 24 * 60 * 60 * 1000),
        labels: JSON.stringify([index % 3 === 0 ? 'urgent' : null, index % 4 === 0 ? 'high-value' : null, index % 5 === 0 ? 'revision' : null].filter(Boolean)),
        attachments: JSON.stringify([]),
        checklist: JSON.stringify([
          { id: '1', text: 'Initial concept approval', completed: index % 2 === 0 },
          { id: '2', text: 'Design mockup', completed: index % 3 === 0 },
          { id: '3', text: 'Client feedback', completed: index % 4 === 0 },
          { id: '4', text: 'Final artwork', completed: index % 5 === 0 }
        ]),
        comments: JSON.stringify([{ id: '1', author: 'Design Team', text: 'Initial concepts look great, proceeding with mockup', timestamp: new Date().toISOString() }])
      });
    });

    if (sampleArtworkCards.length > 0) {
      await db.insert(artworkCards).values(sampleArtworkCards).onConflictDoNothing();
    }

    console.log('All dummy data seeded successfully!');
    console.log(`  - ${sampleCompanies.length} companies`);
    console.log(`  - ${sampleSuppliers.length} suppliers`);
    console.log(`  - ${sampleProducts.length} products`);
    console.log(`  - ${sampleOrders.length} orders`);
    console.log(`  - ${sampleOrderItems.length} order items`);
    console.log(`  - ${sampleArtworkCards.length} artwork cards`);
}
