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
  insertActivitySchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common artwork file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/postscript', // .ai, .eps files
      'image/svg+xml'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.ai') ||
        file.originalname.toLowerCase().endsWith('.eps')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, AI, and EPS files are allowed.'));
    }
  }
});

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
        userId: req.user?.claims?.sub,
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
        userId: req.user?.claims?.sub,
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
        userId: req.user?.claims?.sub,
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
        assignedUserId: req.user?.claims?.sub,
      });
      
      const order = await storage.createOrder(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user?.claims?.sub,
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
        userId: req.user?.claims?.sub,
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
      const [companies, products, orders] = await Promise.all([
        storage.searchCompanies(query),
        storage.searchProducts(query),
        // Could add order search here
      ]);

      res.json({
        companies: companies.slice(0, 5),
        products: products.slice(0, 5),
        orders: [], // orders.slice(0, 5),
      });
    } catch (error) {
      console.error("Error performing universal search:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
