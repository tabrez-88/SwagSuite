import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema, 
  insertContactSchema, 
  insertSupplierSchema,
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertArtworkFileSchema,
  insertActivitySchema,
  insertArtworkColumnSchema,
  insertArtworkCardSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import Anthropic from '@anthropic-ai/sdk';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for data files
  },
  fileFilter: (req, file, cb) => {
    // Allow data import file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/postscript', // .ai, .eps files
      'image/svg+xml',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.ai') ||
        file.originalname.toLowerCase().endsWith('.eps') ||
        file.originalname.toLowerCase().endsWith('.csv') ||
        file.originalname.toLowerCase().endsWith('.xlsx') ||
        file.originalname.toLowerCase().endsWith('.xls') ||
        file.originalname.toLowerCase().endsWith('.docx') ||
        file.originalname.toLowerCase().endsWith('.doc')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, AI, EPS, Excel, CSV, and Word files are allowed.'));
    }
  }
});

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// AI Processing Function for Data Uploads
async function processDataUploadWithAI(uploadId: string, file: Express.Multer.File) {
  try {
    await storage.updateDataUpload(uploadId, { status: 'processing' });

    if (!anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    let fileContent = '';
    let analysisPrompt = '';

    // Handle different file types
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      fileContent = fs.readFileSync(file.path, 'utf-8');
      analysisPrompt = `Analyze this CSV data and extract business information to create proper client companies and orders. Focus on identifying:
1. Company names and contact information
2. Order details with products, quantities, and values
3. Customer relationships and transaction history

CSV Data:
${fileContent}

Return a JSON response with this structure:
{
  "analysis": "Brief summary of the data found",
  "companies": [{"name": "...", "email": "...", "phone": "...", "address": "..."}],
  "orders": [{"companyName": "...", "orderNumber": "...", "total": "...", "items": "...", "date": "..."}],
  "summary": {"totalCompanies": 0, "totalOrders": 0, "totalRevenue": 0}
}`;
    } else if (file.mimetype === 'application/pdf') {
      analysisPrompt = `This is a PDF document that may contain customer information, orders, or business data. Based on typical business PDFs, extract any relevant information to create proper client companies and orders.

Return a JSON response with this structure:
{
  "analysis": "Brief summary of what type of document this appears to be",
  "companies": [{"name": "...", "email": "...", "phone": "...", "address": "..."}],
  "orders": [{"companyName": "...", "orderNumber": "...", "total": "...", "items": "...", "date": "..."}],
  "summary": {"totalCompanies": 0, "totalOrders": 0, "totalRevenue": 0}
}`;
    } else {
      // For Excel, Word, and other files
      analysisPrompt = `This file contains business data that needs to be analyzed for customer and order information. Extract any relevant business information to create proper client companies and orders.

Return a JSON response with this structure:
{
  "analysis": "Brief summary of the data found",
  "companies": [{"name": "...", "email": "...", "phone": "...", "address": "..."}],
  "orders": [{"companyName": "...", "orderNumber": "...", "total": "...", "items": "...", "date": "..."}],
  "summary": {"totalCompanies": 0, "totalOrders": 0, "totalRevenue": 0}
}`;
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ]
    });

    const aiResponse = response.content[0]?.type === 'text' ? response.content[0].text : 'Unable to process AI response';
    let processedData;
    
    try {
      processedData = JSON.parse(aiResponse);
    } catch (parseError) {
      // If JSON parsing fails, create a basic structure
      processedData = {
        analysis: "AI analysis completed but format needs adjustment",
        companies: [],
        orders: [],
        summary: { totalCompanies: 0, totalOrders: 0, totalRevenue: 0 }
      };
    }

    // Create companies and orders from AI analysis
    const createdRecords = { clients: 0, orders: 0 };

    // Create companies
    for (const companyData of processedData.companies || []) {
      try {
        const company = await storage.createCompany({
          name: companyData.name || 'Unknown Company',
          email: companyData.email || null,
          phone: companyData.phone || null,
          address: companyData.address || null
        });
        createdRecords.clients++;
      } catch (error) {
        console.error('Error creating company:', error);
      }
    }

    // Create orders
    for (const orderData of processedData.orders || []) {
      try {
        // Find matching company
        const companies = await storage.searchCompanies(orderData.companyName || '');
        const company = companies[0];
        
        if (company) {
          const order = await storage.createOrder({
            companyId: company.id,
            orderNumber: orderData.orderNumber || `AI-${Date.now()}`,
            status: 'quote',
            total: parseFloat(orderData.total || '0').toString(),
            notes: `Imported from ${file.originalname} - ${orderData.items || 'No items specified'}`
          });
          createdRecords.orders++;
        }
      } catch (error) {
        console.error('Error creating order:', error);
      }
    }

    // Update upload status
    await storage.updateDataUpload(uploadId, {
      status: 'completed',
      processedData,
      createdRecords,
      processedAt: new Date()
    });

  } catch (error) {
    console.error('Error processing data upload:', error);
    await storage.updateDataUpload(uploadId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-orders', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.get('/api/dashboard/team-leaderboard', isAuthenticated, async (req, res) => {
    try {
      const leaderboard = await storage.getTeamLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching team leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch team leaderboard" });
    }
  });

  // Company/Customer routes
  app.get('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/companies/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const companies = await storage.searchCompanies(query);
      res.json(companies);
    } catch (error) {
      console.error("Error searching companies:", error);
      res.status(500).json({ message: "Failed to search companies" });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'company',
        entityId: company.id,
        action: 'created',
        description: `Created company: ${company.name}`,
      });
      
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'company',
        entityId: company.id,
        action: 'updated',
        description: `Updated company: ${company.name}`,
      });
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'company',
        entityId: req.params.id,
        action: 'deleted',
        description: `Deleted company`,
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Contact routes
  app.get('/api/contacts', isAuthenticated, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      const contacts = await storage.getContacts(companyId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Lead routes
  app.get('/api/leads', isAuthenticated, async (req, res) => {
    try {
      // Mock leads data - replace with actual database query
      const mockLeads = [
        {
          id: "lead_1",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          phone: "(555) 123-4567",
          company: "ABC Corporation",
          title: "Marketing Director",
          source: "Website",
          status: "new",
          estimatedValue: 2500,
          nextFollowUpDate: "2024-02-15",
          notes: "Interested in promotional products for upcoming campaign",
          createdAt: new Date().toISOString(),
        },
        {
          id: "lead_2",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.j@techcorp.com",
          phone: "(555) 987-6543",
          company: "TechCorp Inc",
          title: "Event Coordinator",
          source: "Referral",
          status: "contacted",
          estimatedValue: 5000,
          nextFollowUpDate: "2024-02-18",
          notes: "Planning a tech conference, needs branded merchandise",
          createdAt: new Date().toISOString(),
        }
      ];
      res.json(mockLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/leads', isAuthenticated, async (req, res) => {
    try {
      const leadData = req.body;
      
      // Validate required fields
      if (!leadData.firstName || !leadData.lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      // Mock lead creation - replace with actual database insertion
      const newLead = {
        id: `lead_${Date.now()}`,
        ...leadData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json(newLead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.delete('/api/leads/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock lead deletion - replace with actual database deletion
      res.json({ message: "Lead deleted successfully", id });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      // Mock clients data - replace with actual database query
      const mockClients = [
        {
          id: "client_1",
          firstName: "Michael",
          lastName: "Thompson",
          email: "michael.thompson@acmecorp.com",
          phone: "(555) 234-5678",
          company: "ACME Corporation",
          title: "Operations Manager",
          industry: "Manufacturing",
          address: "123 Business Ave",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          website: "https://acmecorp.com",
          preferredContact: "Email",
          clientType: "Corporate",
          status: "active",
          totalOrders: 15,
          totalSpent: 45000,
          lastOrderDate: "2024-01-15",
          creditLimit: 50000,
          paymentTerms: "Net 30",
          notes: "Long-term client, prefers bulk orders for quarterly campaigns",
          createdAt: new Date().toISOString(),
        },
        {
          id: "client_2",
          firstName: "Lisa",
          lastName: "Rodriguez",
          email: "lisa.rodriguez@nonprofit.org",
          phone: "(555) 345-6789",
          company: "Community Helpers",
          title: "Development Director",
          industry: "Non-Profit",
          address: "456 Charity Ln",
          city: "Portland",
          state: "OR",
          zipCode: "97201",
          website: "https://communityhelpers.org",
          preferredContact: "Phone",
          clientType: "Non-Profit",
          status: "active",
          totalOrders: 8,
          totalSpent: 12000,
          lastOrderDate: "2024-01-28",
          creditLimit: 15000,
          paymentTerms: "Net 15",
          notes: "Budget-conscious, focuses on eco-friendly products",
          createdAt: new Date().toISOString(),
        },
        {
          id: "client_3",
          firstName: "David",
          lastName: "Chen",
          email: "d.chen@techstartup.com",
          phone: "(555) 456-7890",
          company: "Tech Innovations LLC",
          title: "Marketing Lead",
          industry: "Technology",
          address: "789 Innovation Dr",
          city: "Austin",
          state: "TX",
          zipCode: "73301",
          website: "https://techinnovations.com",
          preferredContact: "Email",
          clientType: "Small Business",
          status: "prospect",
          creditLimit: 25000,
          paymentTerms: "Credit Card",
          notes: "Interested in branded tech accessories for conferences",
          createdAt: new Date().toISOString(),
        }
      ];
      res.json(mockClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clientData = req.body;
      
      // Validate required fields
      if (!clientData.firstName || !clientData.lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      // Mock client creation - replace with actual database insertion
      const newClient = {
        id: `client_${Date.now()}`,
        ...clientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock client deletion - replace with actual database deletion
      res.json({ message: "Client deleted successfully", id });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string;
      const companyId = req.query.companyId as string;
      
      let orders;
      if (status) {
        orders = await storage.getOrdersByStatus(status);
      } else if (companyId) {
        orders = await storage.getOrdersByCompany(companyId);
      } else {
        orders = await storage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        assignedUserId: (req.user as any)?.claims?.sub,
      });
      
      const order = await storage.createOrder(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'order',
        entityId: order.id,
        action: 'created',
        description: `Created order: ${order.orderNumber}`,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: (req.user as any)?.claims?.sub,
        entityType: 'order',
        entityId: order.id,
        action: 'updated',
        description: `Updated order: ${order.orderNumber}`,
      });
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Order items routes
  app.get('/api/orders/:orderId/items', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getOrderItems(req.params.orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post('/api/orders/:orderId/items', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOrderItemSchema.parse({
        ...req.body,
        orderId: req.params.orderId,
      });
      const item = await storage.createOrderItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  // Artwork upload routes
  app.post('/api/artwork/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { orderId, companyId } = req.body;
      
      const artworkFile = await storage.createArtworkFile({
        orderId: orderId || null,
        companyId: companyId || null,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        uploadedBy: req.user?.claims?.sub,
      });

      res.status(201).json(artworkFile);
    } catch (error) {
      console.error("Error uploading artwork:", error);
      res.status(500).json({ message: "Failed to upload artwork" });
    }
  });

  app.get('/api/artwork', isAuthenticated, async (req, res) => {
    try {
      const orderId = req.query.orderId as string;
      const companyId = req.query.companyId as string;
      const files = await storage.getArtworkFiles(orderId, companyId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching artwork files:", error);
      res.status(500).json({ message: "Failed to fetch artwork files" });
    }
  });

  // Activity/Timeline routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;
      const activities = await storage.getActivities(entityType, entityId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Data Upload routes for AI processing
  app.post('/api/data-uploads', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create upload record
      const dataUpload = await storage.createDataUpload({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        uploadedBy: req.user?.claims?.sub,
        status: 'pending'
      });

      res.status(201).json(dataUpload);

      // Start AI processing in background
      processDataUploadWithAI(dataUpload.id, req.file);
    } catch (error) {
      console.error("Error uploading data file:", error);
      res.status(500).json({ message: "Failed to upload data file" });
    }
  });

  app.get('/api/data-uploads', isAuthenticated, async (req, res) => {
    try {
      const uploads = await storage.getDataUploads();
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching data uploads:", error);
      res.status(500).json({ message: "Failed to fetch data uploads" });
    }
  });

  app.delete('/api/data-uploads/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDataUpload(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting data upload:", error);
      res.status(500).json({ message: "Failed to delete data upload" });
    }
  });

  // AI Search route (placeholder)
  app.post('/api/search/ai', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      
      // This would integrate with an AI service to process natural language queries
      // For now, return a placeholder response
      res.json({
        query,
        results: [],
        message: "AI search functionality would be implemented here with integration to OpenAI or similar service",
      });
    } catch (error) {
      console.error("Error processing AI search:", error);
      res.status(500).json({ message: "Failed to process AI search" });
    }
  });

  // Universal search route
  app.get('/api/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Search across multiple entities
      const [companies, products] = await Promise.all([
        storage.searchCompanies(query),
        storage.searchProducts(query),
      ]);

      res.json({
        companies: companies.slice(0, 5),
        products: products.slice(0, 5),
        orders: [],
      });
    } catch (error) {
      console.error("Error performing universal search:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Enhanced Integration Routes
  
  // HubSpot Integration Routes
  app.get('/api/integrations/hubspot/status', isAuthenticated, async (req, res) => {
    try {
      // Mock HubSpot sync status - would integrate with actual HubSpot API
      res.json({
        lastSync: new Date().toISOString(),
        status: 'active',
        recordsProcessed: 150,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch HubSpot status" });
    }
  });

  app.get('/api/integrations/hubspot/metrics', isAuthenticated, async (req, res) => {
    try {
      // Mock HubSpot metrics - would integrate with actual HubSpot API
      res.json({
        totalContacts: 2847,
        pipelineDeals: 89,
        monthlyRevenue: 285000,
        conversionRate: 24.5,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch HubSpot metrics" });
    }
  });

  app.post('/api/integrations/hubspot/sync', isAuthenticated, async (req, res) => {
    try {
      const { syncType } = req.body;
      // Mock sync initiation - would trigger actual HubSpot sync
      res.json({ message: `${syncType} sync initiated successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to start HubSpot sync" });
    }
  });

  // Slack Configuration Management
  app.post('/api/integrations/slack/config', isAuthenticated, async (req, res) => {
    try {
      const config = req.body;
      
      // Validate required fields
      if (config.enabled && !config.botToken) {
        return res.status(400).json({ message: "Bot token is required when Slack is enabled" });
      }

      // Mock config save - would save to database/environment
      res.json({ 
        message: 'Slack configuration saved successfully',
        config: {
          ...config,
          botToken: config.botToken ? '***masked***' : null
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to save Slack configuration" });
    }
  });

  // Test Slack Connection
  app.post('/api/integrations/slack/test', isAuthenticated, async (req, res) => {
    try {
      const { message, channel } = req.body;
      
      if (!process.env.SLACK_BOT_TOKEN) {
        return res.status(400).json({ message: "Slack bot token not configured" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

      const testMessage = message || "🎉 SwagSuite is now connected! This is a test message from your promotional products ERP system.";

      const result = await slack.chat.postMessage({
        channel: channel,
        text: testMessage,
        username: 'SwagSuite Bot',
        icon_emoji: ':package:'
      });

      res.json({
        success: true,
        message: `Test message sent to channel successfully`,
        timestamp: new Date().toISOString(),
        channel: channel,
        messageId: result.ts
      });
    } catch (error) {
      console.error("Error sending test Slack message:", error);
      res.status(500).json({ message: "Failed to send test message to Slack" });
    }
  });

  // Send Slack Message
  app.post('/api/integrations/slack/message', isAuthenticated, async (req, res) => {
    try {
      const { message, channel } = req.body;
      
      if (!message || !channel) {
        return res.status(400).json({ message: "Message and channel are required" });
      }

      if (!process.env.SLACK_BOT_TOKEN) {
        return res.status(400).json({ message: "Slack bot token not configured" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

      const result = await slack.chat.postMessage({
        channel: channel,
        text: message,
        username: 'SwagSuite Bot'
      });

      res.json({
        success: true,
        message: "Message sent successfully",
        timestamp: new Date().toISOString(),
        messageId: result.ts
      });
    } catch (error) {
      console.error("Error sending Slack message:", error);
      res.status(500).json({ message: "Failed to send message to Slack" });
    }
  });

  // Get Slack Channels
  app.get('/api/integrations/slack/channels', isAuthenticated, async (req, res) => {
    try {
      if (!process.env.SLACK_BOT_TOKEN) {
        return res.status(400).json({ message: "Slack bot token not configured" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

      const result = await slack.conversations.list({
        exclude_archived: true,
        types: 'public_channel,private_channel'
      });

      const channels = result.channels?.map(channel => ({
        id: channel.id,
        name: channel.name,
        memberCount: channel.num_members || 0,
        isArchived: channel.is_archived || false
      })) || [];

      res.json(channels);
    } catch (error) {
      console.error("Error fetching Slack channels:", error);
      res.status(500).json({ message: "Failed to fetch Slack channels" });
    }
  });

  // Slack Integration Routes
  app.get('/api/integrations/slack/channels', isAuthenticated, async (req, res) => {
    try {
      // Mock Slack channels - would integrate with actual Slack API
      res.json([
        { id: 'general', name: 'general', memberCount: 25, isArchived: false },
        { id: 'sales', name: 'sales', memberCount: 12, isArchived: false },
        { id: 'production', name: 'production', memberCount: 8, isArchived: false },
        { id: 'alerts', name: 'alerts', memberCount: 15, isArchived: false },
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Slack channels" });
    }
  });

  app.get('/api/integrations/slack/messages', isAuthenticated, async (req, res) => {
    try {
      if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_CHANNEL_ID) {
        return res.status(400).json({ message: "Slack configuration incomplete" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

      const result = await slack.conversations.history({
        channel: process.env.SLACK_CHANNEL_ID,
        limit: 10
      });

      const messages = result.messages?.map(msg => ({
        id: msg.ts,
        content: msg.text || '',
        user: msg.user || 'Unknown',
        timestamp: new Date(parseFloat(msg.ts || '0') * 1000).toISOString(),
        channel: process.env.SLACK_CHANNEL_ID
      })) || [];

      res.json(messages);
    } catch (error) {
      console.error("Error fetching Slack messages:", error);
      res.status(500).json({ message: "Failed to fetch Slack messages" });
    }
  });

  app.post('/api/integrations/slack/send', isAuthenticated, async (req, res) => {
    try {
      const { channel, message } = req.body;
      // Mock message sending - would integrate with actual Slack API
      res.json({ message: "Message sent successfully to Slack" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send Slack message" });
    }
  });

  // AI News Monitoring Routes
  app.get('/api/integrations/news/items', isAuthenticated, async (req, res) => {
    try {
      // Mock news items - would integrate with AI news monitoring service
      res.json([
        {
          id: '1',
          headline: 'ABC Corp announces major expansion into promotional products',
          summary: 'Leading tech company ABC Corp is expanding their corporate gifting program with a $2M budget.',
          sourceUrl: 'https://example.com/news/abc-corp-expansion',
          sentiment: 'positive',
          relevanceScore: 9,
          entityType: 'company',
          entityName: 'ABC Corp',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          alertsSent: false,
        },
        {
          id: '2',
          headline: 'Supply chain disruptions affecting promotional product industry',
          summary: 'Global supply chain issues are impacting delivery times for promotional products.',
          sourceUrl: 'https://example.com/news/supply-chain',
          sentiment: 'negative',
          relevanceScore: 7,
          entityType: 'industry',
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          alertsSent: true,
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news items" });
    }
  });

  // Enhanced Dashboard Routes
  app.get('/api/dashboard/enhanced-stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getBasicStats();
      // Enhanced metrics with period comparisons
      res.json({
        ...stats,
        ytdRevenue: 2850000,
        lastYearYtdRevenue: 2200000,
        mtdRevenue: 285000,
        lastMonthRevenue: 260000,
        wtdRevenue: 65000,
        todayRevenue: 12000,
        pipelineValue: 1200000,
        conversionRate: 24.5,
        avgOrderValue: 3200,
        orderQuantity: 890,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enhanced dashboard stats" });
    }
  });

  app.get('/api/dashboard/team-leaderboard', isAuthenticated, async (req, res) => {
    try {
      // Mock team leaderboard - would calculate from actual user data
      res.json([
        {
          userId: '1',
          name: 'Sarah Johnson',
          avatar: 'SJ',
          ytdRevenue: 850000,
          mtdRevenue: 85000,
          wtdRevenue: 20000,
          ordersCount: 89,
          conversionRate: 28.5,
          contactsReached: 245,
          meetingsHeld: 67,
          rank: 1,
        },
        {
          userId: '2',
          name: 'Mike Davis',
          avatar: 'MD',
          ytdRevenue: 720000,
          mtdRevenue: 72000,
          wtdRevenue: 18000,
          ordersCount: 76,
          conversionRate: 25.2,
          contactsReached: 198,
          meetingsHeld: 54,
          rank: 2,
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team leaderboard" });
    }
  });

  app.get('/api/dashboard/automation-tasks', isAuthenticated, async (req, res) => {
    try {
      // Mock automation tasks - would fetch from actual AI automation system
      res.json([
        {
          id: '1',
          type: 'vendor_followup',
          title: 'Follow up with XYZ Supplier on Order #12345',
          description: 'Order placed 2 days ago with no confirmation received. Auto-generated follow-up ready.',
          priority: 'high',
          scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          status: 'pending',
          entityName: 'XYZ Supplier',
        },
        {
          id: '2',
          type: 'customer_outreach',
          title: 'Sample suggestion for ABC Corp',
          description: 'Customer has decreased orders by 40% - suggest sending product samples.',
          priority: 'medium',
          scheduledFor: new Date(Date.now() + 7200000).toISOString(),
          status: 'pending',
          entityName: 'ABC Corp',
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation tasks" });
    }
  });

  app.get('/api/dashboard/news-alerts', isAuthenticated, async (req, res) => {
    try {
      // Mock news alerts - would fetch from AI news monitoring
      res.json([
        {
          id: '1',
          headline: 'ABC Corp announces Q4 record profits',
          entityName: 'ABC Corp',
          entityType: 'customer',
          sentiment: 'positive',
          relevanceScore: 8,
          publishedAt: new Date(Date.now() - 1800000).toISOString(),
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news alerts" });
    }
  });

  // AI Report Generation Routes
  app.get('/api/reports/suggestions', isAuthenticated, async (req, res) => {
    try {
      res.json([
        {
          title: 'Top Performing Sales Reps',
          description: 'Revenue and conversion metrics by salesperson',
          query: 'Show me the top 10 sales reps by revenue this quarter with their conversion rates',
          category: 'sales',
        },
        {
          title: 'Vendor Spend Analysis',
          description: 'Year-over-year vendor spending comparison',
          query: 'Compare our vendor spending this year vs last year, show top 20 vendors',
          category: 'vendors',
        },
        {
          title: 'Customer Retention Report',
          description: 'Analysis of customer repeat orders and churn',
          query: 'Which customers have stopped ordering in the last 90 days and their previous order history',
          category: 'customers',
        },
        {
          title: 'Product Margin Analysis',
          description: 'Profit margins by product category',
          query: 'Show me profit margins by product category for the last 6 months',
          category: 'finance',
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report suggestions" });
    }
  });

  app.post('/api/reports/generate', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      // Mock AI report generation - would integrate with actual AI service
      res.json({
        id: Date.now().toString(),
        name: `AI Generated Report - ${new Date().toLocaleDateString()}`,
        query,
        data: [],
        summary: `Report generated based on your query: "${query}". This would contain actual data analysis from your SwagSuite database.`,
        generatedAt: new Date().toISOString(),
        exportFormats: ['pdf', 'xlsx', 'csv'],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI report" });
    }
  });

  // ESP/ASI/SAGE Product Integration Routes
  
  // ESP Product Search and Integration
  app.get('/api/integrations/esp/products', isAuthenticated, async (req, res) => {
    try {
      const { search, category, minPrice, maxPrice, asiNumber } = req.query;
      
      // Mock ESP product search - would integrate with actual ESP API
      const mockProducts = [
        {
          id: 'esp_1',
          asiNumber: '12345',
          productName: 'Custom Branded Coffee Mug - 11oz',
          supplierName: 'Premier Promotions',
          supplierAsiNumber: '98765',
          category: 'Drinkware',
          subCategory: 'Mugs',
          description: 'Ceramic coffee mug with full-color imprint capability. Perfect for corporate branding.',
          longDescription: 'High-quality ceramic mug designed for daily use. Features dishwasher-safe construction and vibrant full-color printing capabilities. Ideal for corporate gifts, events, and promotional campaigns.',
          pricingCode: 'B',
          basePricing: {
            '144': 4.85,
            '288': 4.35,
            '576': 3.95,
            '1008': 3.65
          },
          decorationPricing: {
            setup: 65.00,
            runCharge: 0.85
          },
          minimumQuantity: 144,
          productionTime: '7-10 business days',
          rushService: true,
          decorationMethods: ['Full Color Imprint', 'Screen Print', 'Pad Print'],
          colors: ['White', 'Black', 'Navy', 'Red', 'Forest Green'],
          sizes: ['11oz'],
          imageUrls: [
            'https://example.com/mug-front.jpg',
            'https://example.com/mug-side.jpg'
          ],
          complianceInfo: {
            prop65: false,
            fda: true,
            cpsia: true
          },
          dimensions: '3.75" H x 3.25" Dia',
          weight: 0.75,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'active'
        },
        {
          id: 'esp_2',
          asiNumber: '23456',
          productName: 'Eco-Friendly Bamboo Pen Set',
          supplierName: 'Green Earth Promotions',
          supplierAsiNumber: '87654',
          category: 'Writing Instruments',
          subCategory: 'Pen Sets',
          description: 'Sustainable bamboo pen set with custom laser engraving capability.',
          longDescription: 'Environmentally conscious pen set made from sustainable bamboo. Features smooth-writing ink and precision laser engraving for professional branding. Perfect for eco-friendly corporate campaigns.',
          pricingCode: 'A',
          basePricing: {
            '100': 8.95,
            '250': 7.45,
            '500': 6.25,
            '1000': 5.45
          },
          decorationPricing: {
            setup: 45.00,
            runCharge: 1.25
          },
          minimumQuantity: 100,
          productionTime: '5-7 business days',
          rushService: false,
          decorationMethods: ['Laser Engraving', 'Pad Print'],
          colors: ['Natural Bamboo'],
          sizes: ['Standard'],
          imageUrls: [
            'https://example.com/bamboo-pen-set.jpg',
            'https://example.com/bamboo-pen-engraved.jpg'
          ],
          complianceInfo: {
            prop65: false,
            fsc: true,
            sustainable: true
          },
          dimensions: '6" L x 0.5" Dia',
          weight: 0.25,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'active'
        }
      ];

      // Filter products based on search criteria
      let filteredProducts = mockProducts;
      
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.productName.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.category.toLowerCase().includes(searchTerm)
        );
      }
      
      if (category) {
        filteredProducts = filteredProducts.filter(p => 
          p.category.toLowerCase() === category.toString().toLowerCase()
        );
      }
      
      if (asiNumber) {
        filteredProducts = filteredProducts.filter(p => p.asiNumber === asiNumber);
      }

      res.json({
        products: filteredProducts,
        totalResults: filteredProducts.length,
        searchCriteria: { search, category, minPrice, maxPrice, asiNumber },
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ESP products" });
    }
  });

  // SAGE Product Search and Integration
  app.get('/api/integrations/sage/products', isAuthenticated, async (req, res) => {
    try {
      const { search, category, eqpLevel, brand } = req.query;
      
      // Mock SAGE product search - would integrate with actual SAGE API
      const mockSageProducts = [
        {
          id: 'sage_1',
          sageId: 'SAGE001',
          productName: 'Premium Canvas Tote Bag',
          productNumber: 'CTB-001',
          supplierName: 'Quality Bags Inc',
          category: 'Bags',
          subcategory: 'Tote Bags',
          brand: 'EcoBag',
          description: 'Heavy-duty canvas tote bag with reinforced handles and bottom gusset.',
          features: ['Reinforced Handles', 'Bottom Gusset', '100% Cotton Canvas', 'Machine Washable'],
          materials: ['100% Cotton Canvas', '24oz Weight'],
          dimensions: '15" W x 16" H x 5" D',
          weight: 0.8,
          eqpLevel: 'A+',
          qualityRating: 9,
          pricingStructure: {
            '50': 12.95,
            '100': 10.45,
            '250': 8.95,
            '500': 7.25
          },
          quantityBreaks: [50, 100, 250, 500, 1000],
          setupCharges: {
            screenPrint: 65.00,
            embroidery: 85.00,
            heatTransfer: 45.00
          },
          decorationMethods: ['Screen Print', 'Embroidery', 'Heat Transfer', 'Digital Print'],
          leadTimes: {
            standard: '10-12 business days',
            rush: '5-7 business days'
          },
          imageGallery: [
            'https://example.com/tote-front.jpg',
            'https://example.com/tote-side.jpg',
            'https://example.com/tote-handle.jpg'
          ],
          technicalDrawings: [
            'https://example.com/tote-technical.pdf'
          ],
          complianceCertifications: ['CPSIA', 'CA Prop 65 Compliant'],
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'active'
        },
        {
          id: 'sage_2',
          sageId: 'SAGE002',
          productName: 'Wireless Charging Pad with LED Logo',
          productNumber: 'WCP-LED-001',
          supplierName: 'Tech Innovations',
          category: 'Technology',
          subcategory: 'Wireless Chargers',
          brand: 'PowerTech',
          description: 'Qi-compatible wireless charging pad with illuminated logo capability.',
          features: ['Qi Wireless Technology', 'LED Logo Illumination', 'Non-Slip Base', 'Type-C Input'],
          materials: ['ABS Plastic', 'Rubber Base', 'Aluminum Ring'],
          dimensions: '4" Dia x 0.5" H',
          weight: 0.3,
          eqpLevel: 'A',
          qualityRating: 8,
          pricingStructure: {
            '25': 24.95,
            '50': 19.95,
            '100': 16.45,
            '250': 13.95
          },
          quantityBreaks: [25, 50, 100, 250, 500],
          setupCharges: {
            laserEngraving: 75.00,
            ledLogo: 125.00,
            padPrint: 65.00
          },
          decorationMethods: ['Laser Engraving', 'LED Logo', 'Pad Print', 'Full Color Imprint'],
          leadTimes: {
            standard: '12-15 business days',
            rush: '7-10 business days'
          },
          imageGallery: [
            'https://example.com/charger-top.jpg',
            'https://example.com/charger-bottom.jpg',
            'https://example.com/charger-led.jpg'
          ],
          technicalDrawings: [
            'https://example.com/charger-specs.pdf'
          ],
          complianceCertifications: ['FCC', 'CE', 'RoHS'],
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'active'
        }
      ];

      // Filter SAGE products based on search criteria
      let filteredProducts = mockSageProducts;
      
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.productName.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.features.some(f => f.toLowerCase().includes(searchTerm))
        );
      }
      
      if (category) {
        filteredProducts = filteredProducts.filter(p => 
          p.category.toLowerCase() === category.toString().toLowerCase()
        );
      }
      
      if (eqpLevel) {
        filteredProducts = filteredProducts.filter(p => p.eqpLevel === eqpLevel);
      }
      
      if (brand) {
        filteredProducts = filteredProducts.filter(p => 
          p.brand.toLowerCase() === brand.toString().toLowerCase()
        );
      }

      res.json({
        products: filteredProducts,
        totalResults: filteredProducts.length,
        searchCriteria: { search, category, eqpLevel, brand },
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SAGE products" });
    }
  });

  // Distributor Central Product Search
  app.get('/api/integrations/dc/products', isAuthenticated, async (req, res) => {
    try {
      const { search, category, minPrice, maxPrice } = req.query;
      
      // Mock Distributor Central products - would integrate with actual DC API
      const mockDCProducts = [
        {
          id: 'dc_1',
          dcProductId: 'DC001',
          productName: 'Sport Water Bottle - 32oz',
          supplierName: 'Hydration Solutions',
          category: 'Drinkware',
          subcategory: 'Water Bottles',
          description: 'BPA-free sport water bottle with easy-grip design and leak-proof cap.',
          keyFeatures: ['BPA-Free', 'Leak-Proof Cap', 'Easy-Grip Design', 'Wide Mouth Opening'],
          decorationAreas: {
            front: { width: 3, height: 2.5 },
            back: { width: 3, height: 2.5 }
          },
          imprintMethods: ['Screen Print', 'Pad Print', 'Full Color Digital'],
          colors: ['Clear', 'Blue', 'Red', 'Green', 'Black'],
          sizes: ['32oz'],
          pricing: {
            '48': 7.95,
            '96': 6.45,
            '192': 5.25,
            '384': 4.65
          },
          quantityPricing: {
            setup: 55.00,
            runCharge: 0.95
          },
          minimumOrder: 48,
          rushOptions: {
            available: true,
            additionalCost: 0.50,
            timeReduction: '3 days'
          },
          productImages: [
            'https://example.com/water-bottle-clear.jpg',
            'https://example.com/water-bottle-colors.jpg'
          ],
          compliance: ['BPA-Free', 'FDA Approved', 'CPSIA Compliant'],
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'active'
        }
      ];

      res.json({
        products: mockDCProducts,
        totalResults: mockDCProducts.length,
        searchCriteria: { search, category, minPrice, maxPrice },
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Distributor Central products" });
    }
  });

  // Unified Product Search across all platforms
  app.get('/api/integrations/products/search', isAuthenticated, async (req, res) => {
    try {
      const { query, source, category, minPrice, maxPrice, limit = 50 } = req.query;
      
      // Mock unified search results - would search across ESP, SAGE, DC databases
      const unifiedResults = [
        {
          id: 'unified_1',
          sourceSystem: 'esp',
          sourceProductId: 'esp_1',
          productName: 'Custom Branded Coffee Mug - 11oz',
          category: 'Drinkware',
          subcategory: 'Mugs',
          supplierName: 'Premier Promotions',
          asiNumber: '12345',
          description: 'Ceramic coffee mug with full-color imprint capability',
          minPrice: 3.65,
          maxPrice: 4.85,
          minQuantity: 144,
          decorationMethods: ['Full Color Imprint', 'Screen Print'],
          colors: ['White', 'Black', 'Navy', 'Red'],
          primaryImage: 'https://example.com/mug-front.jpg',
          qualityScore: 8.5,
          popularityScore: 95,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'unified_2',
          sourceSystem: 'sage',
          sourceProductId: 'sage_1',
          productName: 'Premium Canvas Tote Bag',
          category: 'Bags',
          subcategory: 'Tote Bags',
          supplierName: 'Quality Bags Inc',
          description: 'Heavy-duty canvas tote bag with reinforced handles',
          minPrice: 7.25,
          maxPrice: 12.95,
          minQuantity: 50,
          decorationMethods: ['Screen Print', 'Embroidery'],
          colors: ['Natural', 'Black', 'Navy'],
          primaryImage: 'https://example.com/tote-front.jpg',
          qualityScore: 9.2,
          popularityScore: 88,
          lastUpdated: new Date().toISOString()
        }
      ];

      res.json({
        results: unifiedResults,
        totalFound: unifiedResults.length,
        searchSources: ['esp', 'sage', 'dc'],
        searchTime: '0.23s',
        filters: {
          categories: ['Drinkware', 'Bags', 'Writing Instruments', 'Technology'],
          priceRanges: ['$0-$5', '$5-$10', '$10-$25', '$25+'],
          decorationMethods: ['Screen Print', 'Embroidery', 'Laser Engraving', 'Full Color']
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform unified product search" });
    }
  });

  // Integration Configuration Routes
  app.get('/api/integrations/configurations', isAuthenticated, async (req, res) => {
    try {
      // Mock integration configurations - would fetch from database
      const configurations = [
        {
          id: 'config_esp',
          integration: 'esp',
          displayName: 'ASI ESP+',
          syncEnabled: false,
          syncFrequency: 'daily',
          isHealthy: true,
          lastHealthCheck: new Date().toISOString(),
          totalSyncs: 0,
          totalRecordsSynced: 0,
          status: 'Not Configured'
        },
        {
          id: 'config_sage',
          integration: 'sage',
          displayName: 'SAGE World',
          syncEnabled: false,
          syncFrequency: 'daily',
          isHealthy: true,
          lastHealthCheck: new Date().toISOString(),
          totalSyncs: 0,
          totalRecordsSynced: 0,
          status: 'Not Configured'
        },
        {
          id: 'config_dc',
          integration: 'dc',
          displayName: 'Distributor Central',
          syncEnabled: true,
          syncFrequency: 'daily',
          isHealthy: true,
          lastHealthCheck: new Date().toISOString(),
          totalSyncs: 12,
          totalRecordsSynced: 2847,
          status: 'Active'
        }
      ];

      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integration configurations" });
    }
  });

  // Sync product data from external sources
  app.post('/api/integrations/:source/sync', isAuthenticated, async (req, res) => {
    try {
      const { source } = req.params;
      const { syncType = 'incremental', categories = [] } = req.body;
      
      // Mock sync initiation - would trigger actual sync with ESP/SAGE/DC
      const syncId = `sync_${source}_${Date.now()}`;
      
      res.json({
        syncId,
        status: 'initiated',
        source,
        syncType,
        estimatedDuration: '15-30 minutes',
        message: `${source.toUpperCase()} product sync has been initiated. You will receive notifications upon completion.`
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to initiate ${req.params.source} sync` });
    }
  });

  // Update integration configuration
  app.patch('/api/integrations/configurations/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Mock update - would update database configuration
      res.json({ 
        id,
        ...updates,
        message: 'Configuration updated successfully' 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update integration configuration" });
    }
  });

  // API Credentials management
  app.get('/api/integrations/credentials', isAuthenticated, async (req, res) => {
    try {
      const credentials = [
        {
          integration: 'asi',
          keyName: 'ASI_API_KEY',
          displayName: 'ASI API Key',
          isRequired: true,
          isSecret: true,
          description: 'Your ASI ESP Direct Connect API key from developers.asicentral.com'
        },
        {
          integration: 'asi',
          keyName: 'ASI_USERNAME',
          displayName: 'ASI Username',
          isRequired: true,
          isSecret: false,
          description: 'Your ASI member username'
        },
        {
          integration: 'sage',
          keyName: 'SAGE_API_KEY',
          displayName: 'SAGE API Key',
          isRequired: true,
          isSecret: true,
          description: 'Your SAGE World API key (contact SAGE customer service)'
        },
        {
          integration: 'sage',
          keyName: 'SAGE_USERNAME',
          displayName: 'SAGE Username',
          isRequired: true,
          isSecret: false,
          description: 'Your SAGE account username'
        },
        {
          integration: 'distributorcentral',
          keyName: 'DISTRIBUTORCENTRAL_API_KEY',
          displayName: 'Distributor Central API Key',
          isRequired: false,
          isSecret: true,
          description: 'Your Distributor Central API key (optional)'
        }
      ];
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.post('/api/integrations/credentials', isAuthenticated, async (req, res) => {
    try {
      const credentials = req.body;
      
      // Validate credentials format
      const requiredKeys = ['ASI_API_KEY', 'ASI_USERNAME', 'SAGE_API_KEY', 'SAGE_USERNAME'];
      const missingKeys = requiredKeys.filter(key => !credentials[key]);
      
      if (missingKeys.length > 0) {
        return res.status(400).json({ 
          message: `Missing required credentials: ${missingKeys.join(', ')}` 
        });
      }

      // Mock credential storage - in production would save to secure environment
      res.json({ message: 'Credentials saved successfully' });
    } catch (error) {
      res.status(500).json({ message: "Failed to save credentials" });
    }
  });

  // Test integration connections
  app.post('/api/integrations/:integration/test', isAuthenticated, async (req, res) => {
    try {
      const integration = req.params.integration;
      
      // Mock connection tests
      const connectionTests = {
        asi: () => ({
          success: true,
          message: 'Successfully connected to ASI ESP Direct Connect API',
          details: 'API key validated, ready for product searches'
        }),
        sage: () => ({
          success: true,
          message: 'Successfully connected to SAGE World API', 
          details: 'Authentication successful, product database accessible'
        }),
        distributorcentral: () => ({
          success: true,
          message: 'Successfully connected to Distributor Central API',
          details: 'API key validated, vendor network accessible'
        })
      };

      const test = connectionTests[integration as keyof typeof connectionTests];
      if (!test) {
        return res.status(400).json({ message: 'Unknown integration' });
      }

      const result = test();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Connection test failed" });
    }
  });

  // Production Report API routes
  app.get('/api/production/orders', isAuthenticated, async (req, res) => {
    try {
      // Mock production orders data for now
      const productionOrders = [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          companyName: 'TechCorp Inc',
          productName: 'Custom T-Shirts',
          quantity: 500,
          currentStage: 'proof-received',
          assignedTo: 'Sarah Wilson',
          nextActionDate: new Date().toISOString().split('T')[0],
          nextActionNotes: 'Follow up with client on proof approval',
          stagesCompleted: ['sales-booked', 'po-placed', 'confirmation-received'],
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          orderValue: 12500
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          companyName: 'StartupXYZ',
          productName: 'Branded Mugs',
          quantity: 200,
          currentStage: 'order-placed',
          assignedTo: 'Mike Johnson',
          nextActionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextActionNotes: 'Check production timeline with vendor',
          stagesCompleted: ['sales-booked', 'po-placed', 'confirmation-received', 'proof-received', 'proof-approved'],
          priority: 'medium',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          orderValue: 4800
        }
      ];
      
      res.json(productionOrders);
    } catch (error) {
      console.error('Error fetching production orders:', error);
      res.status(500).json({ message: 'Failed to fetch production orders' });
    }
  });

  app.get('/api/production/stages', isAuthenticated, async (req, res) => {
    try {
      // Mock production stages data
      const stages = [
        { id: 'sales-booked', name: 'Sales Order Booked', order: 1, color: 'bg-blue-100 text-blue-800' },
        { id: 'po-placed', name: 'Purchase Order Placed', order: 2, color: 'bg-purple-100 text-purple-800' },
        { id: 'confirmation-received', name: 'Confirmation Received', order: 3, color: 'bg-indigo-100 text-indigo-800' },
        { id: 'proof-received', name: 'Proof Received', order: 4, color: 'bg-yellow-100 text-yellow-800' },
        { id: 'proof-approved', name: 'Proof Approved', order: 5, color: 'bg-orange-100 text-orange-800' },
        { id: 'order-placed', name: 'Order Placed', order: 6, color: 'bg-teal-100 text-teal-800' },
        { id: 'invoice-paid', name: 'Invoice Paid', order: 7, color: 'bg-green-100 text-green-800' },
        { id: 'shipping-scheduled', name: 'Shipping Scheduled', order: 8, color: 'bg-cyan-100 text-cyan-800' },
        { id: 'shipped', name: 'Shipped', order: 9, color: 'bg-emerald-100 text-emerald-800' },
      ];
      
      res.json(stages);
    } catch (error) {
      console.error('Error fetching production stages:', error);
      res.status(500).json({ message: 'Failed to fetch production stages' });
    }
  });

  // Global search API endpoint
  app.get('/api/search', isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 3) {
        return res.json([]);
      }
      
      // Mock search results across different entities
      const searchResults = [
        {
          id: '1',
          title: `TechCorp Inc`,
          description: 'Technology company with 5 active orders',
          type: 'company',
          url: '/crm?company=1',
          metadata: { industry: 'Technology', ytdSpend: 25000 }
        },
        {
          id: '2',
          title: `Order ORD-2024-001`,
          description: 'Custom T-Shirts for TechCorp Inc (500 units)',
          type: 'order',
          url: '/orders?id=1',
          metadata: { status: 'In Production', value: 12500 }
        },
        {
          id: '3',
          title: `Custom T-Shirts`,
          description: 'Promotional t-shirts with custom printing',
          type: 'product',
          url: '/products?id=1',
          metadata: { category: 'Apparel', supplier: 'ABC Textiles' }
        }
      ].filter(result => 
        result.title.toLowerCase().includes(q.toLowerCase()) ||
        result.description.toLowerCase().includes(q.toLowerCase())
      );
      
      res.json(searchResults);
    } catch (error) {
      console.error('Error performing search:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  // Artwork management routes
  app.get('/api/artwork/columns', isAuthenticated, async (req, res) => {
    try {
      const columns = await storage.getArtworkColumns();
      res.json(columns);
    } catch (error) {
      console.error("Error fetching artwork columns:", error);
      res.status(500).json({ message: "Failed to fetch artwork columns" });
    }
  });

  app.post('/api/artwork/columns/initialize', isAuthenticated, async (req, res) => {
    try {
      const { columns } = req.body;
      const result = await storage.initializeArtworkColumns(columns);
      res.json(result);
    } catch (error) {
      console.error("Error initializing artwork columns:", error);
      res.status(500).json({ message: "Failed to initialize artwork columns" });
    }
  });

  app.post('/api/artwork/columns', isAuthenticated, async (req, res) => {
    try {
      const column = await storage.createArtworkColumn(req.body);
      res.json(column);
    } catch (error) {
      console.error("Error creating artwork column:", error);
      res.status(500).json({ message: "Failed to create artwork column" });
    }
  });

  app.get('/api/artwork/cards', isAuthenticated, async (req, res) => {
    try {
      const cards = await storage.getArtworkCards();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching artwork cards:", error);
      res.status(500).json({ message: "Failed to fetch artwork cards" });
    }
  });

  app.post('/api/artwork/cards', isAuthenticated, async (req, res) => {
    try {
      console.log("Received card creation request:", req.body);
      const validatedData = insertArtworkCardSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const card = await storage.createArtworkCard(validatedData);
      console.log("Created card:", card);
      res.status(201).json(card);
    } catch (error) {
      console.error("Error creating artwork card:", error);
      res.status(500).json({ message: "Failed to create artwork card", error: error.message });
    }
  });

  app.patch('/api/artwork/cards/:id/move', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { columnId, position } = req.body;
      const card = await storage.moveArtworkCard(id, columnId, position);
      res.json(card);
    } catch (error) {
      console.error("Error moving artwork card:", error);
      res.status(500).json({ message: "Failed to move artwork card" });
    }
  });

  app.patch('/api/artwork/cards/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const card = await storage.updateArtworkCard(id, updates);
      res.json(card);
    } catch (error) {
      console.error("Error updating artwork card:", error);
      res.status(500).json({ message: "Failed to update artwork card" });
    }
  });

  // Artwork Kanban API routes
  app.get("/api/artwork/columns", isAuthenticated, async (req, res) => {
    try {
      const columns = await storage.getArtworkColumns();
      res.json(columns);
    } catch (error) {
      console.error("Error fetching artwork columns:", error);
      res.status(500).json({ error: "Failed to fetch artwork columns" });
    }
  });

  app.post("/api/artwork/columns/initialize", isAuthenticated, async (req, res) => {
    try {
      const defaultColumns = [
        { id: 'pms-colors', name: 'PMS Colors', position: 1, color: '#EF4444', isDefault: true },
        { id: 'artist-schedule', name: 'Artist Schedule', position: 2, color: '#F97316', isDefault: true },
        { id: 'artwork-todo', name: 'Artwork to Do', position: 3, color: '#EAB308', isDefault: true },
        { id: 'in-progress', name: 'In Progress', position: 4, color: '#3B82F6', isDefault: true },
        { id: 'questions', name: 'Questions and clarifications', position: 5, color: '#8B5CF6', isDefault: true },
        { id: 'for-review', name: 'For Review', position: 6, color: '#EC4899', isDefault: true },
        { id: 'sent-to-client', name: 'Sent to Client', position: 7, color: '#10B981', isDefault: true },
        { id: 'completed', name: 'Completed', position: 8, color: '#22C55E', isDefault: true }
      ];
      
      const columns = await storage.initializeArtworkColumns(defaultColumns);
      res.json(columns);
    } catch (error) {
      console.error("Error initializing artwork columns:", error);
      res.status(500).json({ error: "Failed to initialize artwork columns" });
    }
  });

  app.post("/api/artwork/columns", isAuthenticated, async (req, res) => {
    try {
      const column = await storage.createArtworkColumn(req.body);
      res.status(201).json(column);
    } catch (error) {
      console.error("Error creating artwork column:", error);
      res.status(500).json({ error: "Failed to create artwork column" });
    }
  });

  app.get("/api/artwork/cards", isAuthenticated, async (req, res) => {
    try {
      const cards = await storage.getArtworkCards();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching artwork cards:", error);
      res.status(500).json({ error: "Failed to fetch artwork cards" });
    }
  });



  app.patch("/api/artwork/cards/:id/move", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { columnId, position } = req.body;
      const card = await storage.moveArtworkCard(id, columnId, position);
      res.json(card);
    } catch (error) {
      console.error("Error moving artwork card:", error);
      res.status(500).json({ error: "Failed to move artwork card" });
    }
  });

  // Mock-up Builder API endpoints
  app.get('/api/mockup-builder/products/search', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.query;
      
      // Mock product search from ESP/ASI/SAGE systems
      const mockProducts = [
        {
          id: "1",
          name: "Premium Cotton T-Shirt",
          number: "PC-001",
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
          category: "Apparel",
          colors: ["White", "Black", "Navy", "Red"],
          description: "100% cotton premium t-shirt perfect for promotional printing",
          source: "ESP",
          price: { min: 8.50, max: 12.95 },
          minQuantity: 24
        },
        {
          id: "2", 
          name: "Ceramic Coffee Mug",
          number: "MUG-101",
          image: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop",
          category: "Drinkware",
          colors: ["White", "Blue", "Black"],
          description: "11oz ceramic mug with large imprint area",
          source: "ASI",
          price: { min: 5.25, max: 8.75 },
          minQuantity: 36
        },
        {
          id: "3",
          name: "Promotional Pen Set",
          number: "PEN-202",
          image: "https://images.unsplash.com/photo-1586952518485-11b180e92764?w=400&h=400&fit=crop",
          category: "Writing Instruments",
          colors: ["Blue", "Black", "Red", "Silver"],
          description: "Professional ballpoint pen with custom engraving",
          source: "SAGE",
          price: { min: 2.15, max: 4.95 },
          minQuantity: 100
        }
      ];

      const filtered = query 
        ? mockProducts.filter(product => 
            product.name.toLowerCase().includes(query.toString().toLowerCase()) ||
            product.number.toLowerCase().includes(query.toString().toLowerCase())
          )
        : mockProducts;

      res.json(filtered);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get('/api/mockup-builder/templates', isAuthenticated, async (req, res) => {
    try {
      // Mock template data
      const templates = [
        {
          id: "company-default",
          name: "Company Default",
          type: "company",
          header: "SwagSuite by Liquid Screen Design",
          footer: "Your Promotional Products Partner",
          isActive: true
        },
        {
          id: "customer-abc",
          name: "ABC Corporation Template",
          type: "customer",
          header: "ABC Corporation",
          footer: "Powered by SwagSuite",
          customerLogo: "https://via.placeholder.com/200x80/4F46E5/white?text=ABC+Corp",
          companyLogo: "https://via.placeholder.com/150x60/059669/white?text=SwagSuite",
          isActive: false
        }
      ];

      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/mockup-builder/templates', isAuthenticated, async (req, res) => {
    try {
      const templateData = req.body;
      
      // Mock template creation
      const newTemplate = {
        id: `template_${Date.now()}`,
        ...templateData,
        createdAt: new Date().toISOString(),
        createdBy: (req.user as any)?.claims?.sub
      };

      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.post('/api/mockup-builder/generate-ai-templates', isAuthenticated, async (req, res) => {
    try {
      const { customerInfo, preferences } = req.body;
      
      // Mock AI template generation
      setTimeout(() => {
        const aiTemplates = [
          {
            id: `ai_template_${Date.now()}_1`,
            name: `${customerInfo?.name || 'Customer'} Professional`,
            type: "customer",
            header: `${customerInfo?.name || 'Your Company'} - Professional Solutions`,
            footer: "Crafted with SwagSuite Technology",
            aiGenerated: true,
            confidence: 0.92
          },
          {
            id: `ai_template_${Date.now()}_2`,
            name: `${customerInfo?.name || 'Customer'} Modern`,
            type: "customer", 
            header: `Modern Branding for ${customerInfo?.name || 'Your Business'}`,
            footer: "Innovation Meets Promotion",
            aiGenerated: true,
            confidence: 0.88
          }
        ];
        
        res.json({ templates: aiTemplates, generated: aiTemplates.length });
      }, 2000);
    } catch (error) {
      console.error("Error generating AI templates:", error);
      res.status(500).json({ message: "Failed to generate AI templates" });
    }
  });

  app.post('/api/mockup-builder/mockups/download', isAuthenticated, async (req, res) => {
    try {
      const { mockupData, format = 'png' } = req.body;
      
      // Mock mockup download preparation
      const downloadUrl = `https://mock-storage.example.com/mockups/${Date.now()}.${format}`;
      
      res.json({ 
        downloadUrl,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        format,
        size: '1920x1080'
      });
    } catch (error) {
      console.error("Error preparing mockup download:", error);
      res.status(500).json({ message: "Failed to prepare mockup download" });
    }
  });

  app.post('/api/mockup-builder/mockups/email', isAuthenticated, async (req, res) => {
    try {
      const { mockupData, emailData } = req.body;
      
      // Mock email sending
      res.json({ 
        success: true,
        messageId: `email_${Date.now()}`,
        sentTo: emailData.recipients,
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending mockup email:", error);
      res.status(500).json({ message: "Failed to send mockup email" });
    }
  });

  // Seed dummy data endpoint (for development)
  app.post('/api/seed-dummy-data', isAuthenticated, async (req, res) => {
    try {
      console.log("Starting dummy data seeding...");
      await storage.seedDummyData();
      console.log("Dummy data seeding completed successfully!");
      res.json({ message: 'Dummy data seeded successfully!' });
    } catch (error) {
      console.error("Error seeding dummy data:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to seed dummy data", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
