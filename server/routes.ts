import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema, 
  insertContactSchema, 
  insertClientSchema,
  insertSupplierSchema,
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertArtworkFileSchema,
  insertActivitySchema,
  insertArtworkColumnSchema,
  insertArtworkCardSchema,
  insertSequenceSchema,
  insertSequenceStepSchema,
  insertSequenceEnrollmentSchema,
  insertSequenceAnalyticsSchema
} from "@shared/schema";
import Anthropic from '@anthropic-ai/sdk';
import { sendSlackMessage } from "../shared/slack";
import { SsActivewearService } from "./ssActivewearService";

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

// Separate upload configuration for presentation files
const presentationUpload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for presentation files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ai', '.eps', '.jpeg', '.jpg', '.png', '.pdf', '.psd', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only AI, EPS, JPEG, PNG, PDF, PSD, and SVG files are allowed.'));
    }
  }
});

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// AI Processing Function for Presentation Generation
async function generatePresentationWithAI(presentationId: string, dealNotes: string) {
  try {
    await storage.updatePresentation(presentationId, { status: 'generating' });

    if (!anthropic) {
      console.log('Anthropic API key not configured, using fallback suggestions');
      
      // Fallback product suggestions when AI is not available
      const products = await storage.getProducts();
      const fallbackSuggestions = products.slice(0, 4).map((product, index) => ({
        productName: product.name,
        suggestedQuantity: [250, 500, 1000, 750][index] || 500,
        suggestedPrice: product.price,
        reasoning: `Popular ${product.category?.toLowerCase() || 'promotional'} item suitable for corporate campaigns. Great for brand visibility and customer engagement.`
      }));

      await storage.updatePresentation(presentationId, {
        suggestedProducts: fallbackSuggestions,
        status: 'completed'
      });

      for (const product of fallbackSuggestions) {
        await storage.createPresentationProduct({
          presentationId,
          productName: product.productName,
          suggestedPrice: product.suggestedPrice,
          suggestedQuantity: product.suggestedQuantity,
          reasoning: product.reasoning
        });
      }

      console.log(`Presentation ${presentationId} completed with ${fallbackSuggestions.length} fallback product suggestions`);
      return;
    }

    // Get available products for suggestions
    const products = await storage.getProducts();
    const productContext = products.slice(0, 20).map(p => 
      `${p.name} - $${p.price} - ${p.category} - ${p.description || 'No description'}`
    ).join('\n');

    // AI prompt for product suggestions
    const prompt = `Analyze these deal notes and suggest the most relevant promotional products with pricing and quantities.

Deal Notes:
${dealNotes}

Available Products:
${productContext}

Based on the deal notes, suggest 3-5 products that would best fit this client's needs. For each product, provide:
1. Product name
2. Suggested quantity based on the notes
3. Suggested price point
4. Clear reasoning why this product fits the deal

Return your response as a JSON object with this structure:
{
  "analysis": "Brief analysis of the client's needs",
  "suggestedProducts": [
    {
      "productName": "Product Name",
      "suggestedQuantity": 500,
      "suggestedPrice": 15.99,
      "reasoning": "Why this product fits their needs"
    }
  ],
  "totalEstimatedValue": 7995.00,
  "recommendations": "Additional recommendations for the presentation"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const aiResponse = JSON.parse(response.content[0].text);

    // Update presentation with AI suggestions
    await storage.updatePresentation(presentationId, {
      suggestedProducts: aiResponse.suggestedProducts,
      status: 'completed'
    });

    // Create individual product suggestions
    for (const product of aiResponse.suggestedProducts) {
      await storage.createPresentationProduct({
        presentationId,
        productName: product.productName,
        suggestedPrice: product.suggestedPrice,
        suggestedQuantity: product.suggestedQuantity,
        reasoning: product.reasoning
      });
    }

    console.log(`Presentation ${presentationId} generated successfully with ${aiResponse.suggestedProducts.length} product suggestions`);
  } catch (error) {
    console.error(`Error generating presentation ${presentationId}:`, error);
    await storage.updatePresentation(presentationId, { status: 'error' });
  }
}

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

  // AI-powered global search endpoint
  app.post("/api/search/ai", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }

      const searchTerm = query.toLowerCase();
      const results = [];

      // Search orders
      const orders = await storage.getOrders();
      const matchingOrders = orders.filter(order => {
        return order.customerName?.toLowerCase().includes(searchTerm) ||
               order.orderNumber?.toLowerCase().includes(searchTerm) ||
               order.status?.toLowerCase().includes(searchTerm);
      }).slice(0, 3);

      for (const order of matchingOrders) {
        results.push({
          id: order.id,
          type: "order",
          title: `Order #${order.orderNumber}`,
          description: `${order.customerName} - ${order.status}`,
          metadata: {
            value: `$${order.totalAmount?.toFixed(2) || '0.00'}`,
            status: order.status,
            date: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''
          },
          url: `/orders`
        });
      }

      // Search products
      const products = await storage.getProducts();
      const matchingProducts = products.filter(product => {
        return product.name?.toLowerCase().includes(searchTerm) ||
               product.description?.toLowerCase().includes(searchTerm) ||
               product.sku?.toLowerCase().includes(searchTerm);
      }).slice(0, 3);

      for (const product of matchingProducts) {
        results.push({
          id: product.id,
          type: "product",
          title: product.name,
          description: product.description || 'No description available',
          metadata: {
            value: `$${product.price?.toFixed(2) || '0.00'}`,
            status: product.status
          },
          url: `/products`
        });
      }

      // Search companies
      const companies = await storage.getCompanies();
      const matchingCompanies = companies.filter(company => {
        return company.name?.toLowerCase().includes(searchTerm) ||
               company.industry?.toLowerCase().includes(searchTerm) ||
               company.website?.toLowerCase().includes(searchTerm);
      }).slice(0, 3);

      for (const company of matchingCompanies) {
        results.push({
          id: company.id,
          type: "company",
          title: company.name,
          description: `${company.industry || 'Unknown industry'} - ${company.website || 'No website'}`,
          metadata: {
            status: company.status
          },
          url: `/crm`
        });
      }

      // Handle natural language queries for margins
      if (searchTerm.includes('margin') && searchTerm.includes('order')) {
        const ordersWithMargins = orders.filter(order => order.totalAmount && order.totalAmount > 0)
          .sort((a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime())
          .slice(0, 3);

        for (const order of ordersWithMargins) {
          const margin = ((order.totalAmount || 0) * 0.25); // Mock 25% margin
          results.push({
            id: `margin-${order.id}`,
            type: "order",
            title: `Order #${order.orderNumber} (Margin Analysis)`,
            description: `${order.customerName} - Recent order with margin data`,
            metadata: {
              value: `$${order.totalAmount?.toFixed(2) || '0.00'}`,
              margin: `$${margin.toFixed(2)} (25%)`,
              date: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''
            },
            url: `/orders`
          });
        }
      }

      // Handle file searches
      if (searchTerm.includes('.ai') || searchTerm.includes('logo') || searchTerm.includes('file')) {
        results.push({
          id: 'artwork-files',
          type: "file",
          title: "Artwork Files",
          description: "Search through artwork files and logos in the artwork management system",
          metadata: {},
          url: `/artwork`
        });
      }

      res.json(results.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error("AI search error:", error);
      res.status(500).json({ error: "Search failed" });
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
      const { linkedinUrl, twitterUrl, facebookUrl, instagramUrl, otherSocialUrl, ...companyData } = req.body;
      
      // Build social media links object if any URLs are provided
      const socialMediaLinks = {
        linkedin: linkedinUrl || undefined,
        twitter: twitterUrl || undefined,
        facebook: facebookUrl || undefined,
        instagram: instagramUrl || undefined,
        other: otherSocialUrl || undefined,
      };

      const dataToInsert = {
        ...companyData,
        ...(Object.values(socialMediaLinks).some(link => link) && { socialMediaLinks })
      };

      const validatedData = insertCompanySchema.parse(dataToInsert);
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
      const { linkedinUrl, twitterUrl, facebookUrl, instagramUrl, otherSocialUrl, ...companyData } = req.body;
      
      // Build social media links object if any URLs are provided
      const socialMediaLinks = {
        linkedin: linkedinUrl || undefined,
        twitter: twitterUrl || undefined,
        facebook: facebookUrl || undefined,
        instagram: instagramUrl || undefined,
        other: otherSocialUrl || undefined,
      };

      const dataToUpdate = {
        ...companyData,
        ...(Object.values(socialMediaLinks).some(link => link) && { socialMediaLinks })
      };

      const validatedData = insertCompanySchema.partial().parse(dataToUpdate);
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
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Generate mock social media posts with exciting news detection
      const socialMediaPosts = [];
      if (client.socialMediaLinks) {
        const samplePosts = [
          {
            platform: "linkedin",
            content: "We're excited to announce our new partnership with TechCorp! This exciting news will revolutionize our industry approach.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            url: "https://linkedin.com/posts/sample1",
            isExcitingNews: true
          },
          {
            platform: "twitter",
            content: "Just wrapped up an amazing quarter! Thanks to all our partners and customers for making it possible.",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            url: "https://twitter.com/sample/status/123",
            isExcitingNews: false
          },
          {
            platform: "facebook",
            content: "Thrilled to share some exciting news - we've just opened our third location! Growth continues!",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            url: "https://facebook.com/posts/sample3",
            isExcitingNews: true
          },
          {
            platform: "instagram",
            content: "Behind the scenes at our latest product photoshoot. Can't wait to share what's coming next!",
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            url: "https://instagram.com/p/sample4",
            isExcitingNews: false
          }
        ];
        
        // Add posts for platforms that have links
        Object.keys(client.socialMediaLinks).forEach(platform => {
          if (client.socialMediaLinks![platform as keyof typeof client.socialMediaLinks]) {
            const relevantPosts = samplePosts.filter(post => post.platform === platform);
            socialMediaPosts.push(...relevantPosts);
          }
        });
      }

      const clientWithPosts = {
        ...client,
        socialMediaPosts,
        lastSocialMediaSync: new Date().toISOString()
      };
      
      res.json(clientWithPosts);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const newClient = await storage.createClient(clientData);
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const updatedClient = await storage.updateClient(req.params.id, req.body);
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.json({ message: "Client deleted successfully" });
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

  // Popular products analytics endpoint
  app.get('/api/products/popular', isAuthenticated, async (req, res) => {
    try {
      const { period = 'ytd', productType = 'all', startDate, endDate } = req.query;

      // Calculate date range based on period
      let dateFilter = '';
      const now = new Date();
      
      if (period === 'ytd') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        dateFilter = `AND o.created_at >= '${yearStart.toISOString()}'`;
      } else if (period === 'mtd') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = `AND o.created_at >= '${monthStart.toISOString()}'`;
      } else if (period === 'wtd') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        dateFilter = `AND o.created_at >= '${weekStart.toISOString()}'`;
      } else if (period === 'custom' && startDate && endDate) {
        dateFilter = `AND o.created_at >= '${startDate}' AND o.created_at <= '${endDate}'`;
      }

      // Product type filter
      let productTypeFilter = '';
      if (productType === 'apparel') {
        productTypeFilter = "AND (p.product_type = 'apparel' OR p.product_type IS NULL)";
      } else if (productType === 'hard_goods') {
        productTypeFilter = "AND p.product_type = 'hard_goods'";
      }

      // For now, return mock data since we don't have actual order data yet
      // In production, this would use the actual SQL query
      const mockPopularProducts = [
        {
          id: '1',
          name: 'Gildan 2000 Ultra Cotton T-Shirt',
          sku: 'G2000',
          imageUrl: '/public-objects/products/gildan-2000.jpg',
          productType: 'apparel',
          totalQuantity: 1250,
          orderCount: 45,
          avgPrice: 4.50,
          totalRevenue: 5625
        },
        {
          id: '2', 
          name: 'Bella+Canvas 3001 Unisex Jersey Tee',
          sku: 'BC3001',
          imageUrl: '/public-objects/products/bella-3001.jpg',
          productType: 'apparel',
          totalQuantity: 980,
          orderCount: 38,
          avgPrice: 5.25,
          totalRevenue: 5145
        },
        {
          id: '3',
          name: 'Custom Logo Pen',
          sku: 'PEN001',
          imageUrl: '/public-objects/products/logo-pen.jpg', 
          productType: 'hard_goods',
          totalQuantity: 2500,
          orderCount: 15,
          avgPrice: 0.89,
          totalRevenue: 2225
        },
        {
          id: '4',
          name: 'Port & Company Core Cotton Tee',
          sku: 'PC54',
          imageUrl: '/public-objects/products/port-company-tee.jpg',
          productType: 'apparel',
          totalQuantity: 750,
          orderCount: 28,
          avgPrice: 3.95,
          totalRevenue: 2962
        },
        {
          id: '5',
          name: 'YETI Rambler Tumbler',
          sku: 'YETI20',
          imageUrl: '/public-objects/products/yeti-tumbler.jpg',
          productType: 'hard_goods',
          totalQuantity: 320,
          orderCount: 22,
          avgPrice: 28.50,
          totalRevenue: 9120
        },
        {
          id: '6',
          name: 'Champion Powerblend Hoodie',
          sku: 'S700',
          imageUrl: '/public-objects/products/champion-hoodie.jpg',
          productType: 'apparel',
          totalQuantity: 680,
          orderCount: 32,
          avgPrice: 32.50,
          totalRevenue: 22100
        },
        {
          id: '7',
          name: 'Nike Dri-FIT Performance Polo',
          sku: 'NK1',
          imageUrl: '/public-objects/products/nike-polo.jpg',
          productType: 'apparel',
          totalQuantity: 420,
          orderCount: 18,
          avgPrice: 45.00,
          totalRevenue: 18900
        },
        {
          id: '8',
          name: 'Custom Wireless Charger',
          sku: 'WC100',
          imageUrl: '/public-objects/products/wireless-charger.jpg',
          productType: 'hard_goods',
          totalQuantity: 180,
          orderCount: 12,
          avgPrice: 22.00,
          totalRevenue: 3960
        },
        {
          id: '9',
          name: 'Leather Portfolio Folder',
          sku: 'LPF200',
          imageUrl: '/public-objects/products/leather-portfolio.jpg',
          productType: 'hard_goods',
          totalQuantity: 95,
          orderCount: 8,
          avgPrice: 38.00,
          totalRevenue: 3610
        },
        {
          id: '10',
          name: 'Carhartt Force Cotton Henley',
          sku: 'CT100393',
          imageUrl: '/public-objects/products/carhartt-henley.jpg',
          productType: 'apparel',
          totalQuantity: 340,
          orderCount: 16,
          avgPrice: 24.95,
          totalRevenue: 8483
        },
        {
          id: '11',
          name: 'Contigo West Loop Travel Mug',
          sku: 'CG1000',
          imageUrl: '/public-objects/products/contigo-mug.jpg',
          productType: 'hard_goods',
          totalQuantity: 210,
          orderCount: 14,
          avgPrice: 18.75,
          totalRevenue: 3937
        },
        {
          id: '12',
          name: 'Under Armour Fleece Jacket',
          sku: 'UA1300143',
          imageUrl: '/public-objects/products/under-armour-jacket.jpg',
          productType: 'apparel',
          totalQuantity: 280,
          orderCount: 19,
          avgPrice: 67.50,
          totalRevenue: 18900
        },
        {
          id: '13',
          name: 'Patagonia Better Sweater Vest',
          sku: 'PAT25622',
          imageUrl: '/public-objects/products/patagonia-vest.jpg',
          productType: 'apparel',
          totalQuantity: 150,
          orderCount: 11,
          avgPrice: 89.00,
          totalRevenue: 13350
        },
        {
          id: '14',
          name: 'Hydro Flask Water Bottle',
          sku: 'HF21',
          imageUrl: '/public-objects/products/hydro-flask.jpg',
          productType: 'hard_goods',
          totalQuantity: 375,
          orderCount: 25,
          avgPrice: 32.95,
          totalRevenue: 12356
        },
        {
          id: '15',
          name: 'The North Face Tech Quarter Zip',
          sku: 'NF0A3LHB',
          imageUrl: '/public-objects/products/north-face-quarter-zip.jpg',
          productType: 'apparel',
          totalQuantity: 195,
          orderCount: 13,
          avgPrice: 72.00,
          totalRevenue: 14040
        }
      ];

      // Filter by product type if specified
      let filteredProducts = mockPopularProducts;
      if (productType === 'apparel') {
        filteredProducts = mockPopularProducts.filter(p => p.productType === 'apparel');
      } else if (productType === 'hard_goods') {
        filteredProducts = mockPopularProducts.filter(p => p.productType === 'hard_goods');
      }

      res.json(filteredProducts);
    } catch (error) {
      console.error('Error fetching popular products:', error);
      res.status(500).json({ error: 'Failed to fetch popular products' });
    }
  });

  // Suggested products endpoint - items in presentations but not yet sold
  app.get('/api/products/suggested', isAuthenticated, async (req, res) => {
    try {
      const { productType = 'all' } = req.query;

      // Mock data for products that appear in presentations but haven't been sold
      const mockSuggestedProducts = [
        {
          id: 'sg1',
          name: 'Champion Powerblend Fleece Hoodie',
          sku: 'S700',
          imageUrl: '/public-objects/products/champion-hoodie.jpg',
          productType: 'apparel',
          presentationCount: 15,
          avgPresentationPrice: 32.50,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        },
        {
          id: 'sg2',
          name: 'Nike Dri-FIT Performance Polo',
          sku: 'NK1',
          imageUrl: '/public-objects/products/nike-polo.jpg',
          productType: 'apparel',
          presentationCount: 12,
          avgPresentationPrice: 45.00,
          discount: 15,
          adminNote: 'Volume discount available',
          isAdminSuggested: true
        },
        {
          id: 'sg3',
          name: 'Custom Wireless Charger',
          sku: 'WC100',
          imageUrl: '/public-objects/products/wireless-charger.jpg',
          productType: 'hard_goods',
          presentationCount: 8,
          avgPresentationPrice: 22.00,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        },
        {
          id: 'sg4',
          name: 'Leather Portfolio Folder',
          sku: 'LPF200',
          imageUrl: '/public-objects/products/leather-portfolio.jpg',
          productType: 'hard_goods',
          presentationCount: 6,
          avgPresentationPrice: 38.00,
          discount: 20,
          adminNote: 'End of quarter special',
          isAdminSuggested: true
        },
        {
          id: 'sg5',
          name: 'Patagonia Better Sweater Vest',
          sku: 'PAT25622',
          imageUrl: '/public-objects/products/patagonia-vest.jpg',
          productType: 'apparel',
          presentationCount: 9,
          avgPresentationPrice: 89.00,
          discount: 10,
          adminNote: 'Premium line special',
          isAdminSuggested: true
        },
        {
          id: 'sg6',
          name: 'Moleskine Classic Notebook',
          sku: 'MOL001',
          imageUrl: '/public-objects/products/moleskine-notebook.jpg',
          productType: 'hard_goods',
          presentationCount: 11,
          avgPresentationPrice: 18.95,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        },
        {
          id: 'sg7',
          name: 'Lululemon Metal Vent Tech Shirt',
          sku: 'LLL123',
          imageUrl: '/public-objects/products/lululemon-shirt.jpg',
          productType: 'apparel',
          presentationCount: 7,
          avgPresentationPrice: 68.00,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        },
        {
          id: 'sg8',
          name: 'Stanley Adventure Quencher',
          sku: 'ST1913',
          imageUrl: '/public-objects/products/stanley-tumbler.jpg',
          productType: 'hard_goods',
          presentationCount: 14,
          avgPresentationPrice: 39.95,
          discount: 12,
          adminNote: 'Trending item - stock limited',
          isAdminSuggested: true
        },
        {
          id: 'sg9',
          name: 'Arc\'teryx Atom Vest',
          sku: 'ARC24108',
          imageUrl: '/public-objects/products/arcteryx-vest.jpg',
          productType: 'apparel',
          presentationCount: 5,
          avgPresentationPrice: 179.00,
          discount: 8,
          adminNote: 'High-end option',
          isAdminSuggested: true
        },
        {
          id: 'sg10',
          name: 'Tile Mate Bluetooth Tracker',
          sku: 'TILE01',
          imageUrl: '/public-objects/products/tile-tracker.jpg',
          productType: 'hard_goods',
          presentationCount: 10,
          avgPresentationPrice: 24.99,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        },
        {
          id: 'sg11',
          name: 'REI Co-op Merino Wool Long-Sleeve',
          sku: 'REI147852',
          imageUrl: '/public-objects/products/rei-merino.jpg',
          productType: 'apparel',
          presentationCount: 8,
          avgPresentationPrice: 64.95,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        },
        {
          id: 'sg12',
          name: 'Anker PowerCore Portable Charger',
          sku: 'ANK10000',
          imageUrl: '/public-objects/products/anker-charger.jpg',
          productType: 'hard_goods',
          presentationCount: 13,
          avgPresentationPrice: 29.99,
          discount: 18,
          adminNote: 'Tech essential - high demand',
          isAdminSuggested: true
        },
        {
          id: 'sg13',
          name: 'Smartwool Merino 150 Tee',
          sku: 'SW0SW150',
          imageUrl: '/public-objects/products/smartwool-tee.jpg',
          productType: 'apparel',
          presentationCount: 6,
          avgPresentationPrice: 75.00,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        },
        {
          id: 'sg14',
          name: 'Rtic Tumbler 20oz',
          sku: 'RTIC20',
          imageUrl: '/public-objects/products/rtic-tumbler.jpg',
          productType: 'hard_goods',
          presentationCount: 16,
          avgPresentationPrice: 19.99,
          discount: 15,
          adminNote: 'Budget-friendly alternative',
          isAdminSuggested: true
        },
        {
          id: 'sg15',
          name: 'Outdoor Research Echo Long Sleeve Tee',
          sku: 'OR271405',
          imageUrl: '/public-objects/products/patagonia-vest.jpg',
          productType: 'apparel',
          presentationCount: 10,
          avgPresentationPrice: 89.00,
          discount: 0,
          adminNote: '',
          isAdminSuggested: false
        }
      ];

      // Filter by product type if specified
      let filteredProducts = mockSuggestedProducts;
      if (productType === 'apparel') {
        filteredProducts = mockSuggestedProducts.filter(p => p.productType === 'apparel');
      } else if (productType === 'hard_goods') {
        filteredProducts = mockSuggestedProducts.filter(p => p.productType === 'hard_goods');
      }

      res.json(filteredProducts);
    } catch (error) {
      console.error('Error fetching suggested products:', error);
      res.status(500).json({ error: 'Failed to fetch suggested products' });
    }
  });

  // Admin endpoints for managing suggested products
  app.post('/api/admin/suggested-products', isAuthenticated, async (req, res) => {
    try {
      const { name, sku, imageUrl, productType, avgPresentationPrice, discount, adminNote } = req.body;
      
      // In production, this would save to database
      const newSuggestedProduct = {
        id: `admin-${Date.now()}`,
        name,
        sku,
        imageUrl,
        productType,
        presentationCount: 0,
        avgPresentationPrice,
        discount: discount || 0,
        adminNote: adminNote || '',
        isAdminSuggested: true
      };

      res.json({ success: true, product: newSuggestedProduct });
    } catch (error) {
      console.error('Error adding suggested product:', error);
      res.status(500).json({ error: 'Failed to add suggested product' });
    }
  });

  app.get('/api/admin/suggested-products', isAuthenticated, async (req, res) => {
    try {
      // Mock admin-managed suggested products
      const adminSuggestedProducts = [
        {
          id: 'admin-1',
          name: 'Nike Dri-FIT Performance Polo',
          sku: 'NK1',
          imageUrl: '/public-objects/products/nike-polo.jpg',
          productType: 'apparel',
          presentationCount: 12,
          avgPresentationPrice: 45.00,
          discount: 15,
          adminNote: 'Volume discount available',
          isAdminSuggested: true
        },
        {
          id: 'admin-2',
          name: 'Leather Portfolio Folder',
          sku: 'LPF200',
          imageUrl: '/public-objects/products/leather-portfolio.jpg',
          productType: 'hard_goods',
          presentationCount: 6,
          avgPresentationPrice: 38.00,
          discount: 20,
          adminNote: 'End of quarter special',
          isAdminSuggested: true
        }
      ];

      res.json(adminSuggestedProducts);
    } catch (error) {
      console.error('Error fetching admin suggested products:', error);
      res.status(500).json({ error: 'Failed to fetch admin suggested products' });
    }
  });

  app.put('/api/admin/suggested-products/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { discount, adminNote } = req.body;
      
      // In production, this would update the database record
      res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
      console.error('Error updating suggested product:', error);
      res.status(500).json({ error: 'Failed to update suggested product' });
    }
  });

  app.delete('/api/admin/suggested-products/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // In production, this would delete from database
      res.json({ success: true, message: 'Product removed successfully' });
    } catch (error) {
      console.error('Error removing suggested product:', error);
      res.status(500).json({ error: 'Failed to remove suggested product' });
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

  // Enhanced AI search endpoint for natural language queries
  app.get('/api/search/ai', async (req, res) => {
    const query = req.query.query as string;
    
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
      const startTime = Date.now();
      
      // Simulate AI processing of natural language query
      let answer = '';
      let results = [];
      let suggestions = [];

      // Parse common query types and generate appropriate responses
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('last') && lowerQuery.includes('order')) {
        answer = 'Based on recent order data, here are the last three orders: Order #12347 ($2,450 - 35% margin), Order #12346 ($1,890 - 42% margin), and Order #12345 ($3,200 - 28% margin). The average margin for these orders is 35%.';
        results = [
          {
            id: '12347',
            type: 'order',
            title: 'Order #12347 - ABC Corporation',
            description: 'Custom branded t-shirts (500 units) - $2,450 total with 35% margin',
            confidence: 0.95,
            source: 'Orders Database',
            metadata: { total: 2450, margin: 0.35, status: 'completed' },
            action: { label: 'View Order', url: '/orders/12347' }
          },
          {
            id: '12346',
            type: 'order',
            title: 'Order #12346 - XYZ Company',
            description: 'Promotional pens (1000 units) - $1,890 total with 42% margin',
            confidence: 0.93,
            source: 'Orders Database',
            metadata: { total: 1890, margin: 0.42, status: 'shipped' },
            action: { label: 'View Order', url: '/orders/12346' }
          },
          {
            id: '12345',
            type: 'order',
            title: 'Order #12345 - Demo Corp',
            description: 'Custom mugs (250 units) - $3,200 total with 28% margin',
            confidence: 0.91,
            source: 'Orders Database',
            metadata: { total: 3200, margin: 0.28, status: 'in_production' },
            action: { label: 'View Order', url: '/orders/12345' }
          }
        ];
        suggestions = ['Show all orders this month', 'Orders with low margins', 'Best performing products'];
      }
      else if (lowerQuery.includes('beber') && lowerQuery.includes('logo')) {
        answer = 'I found the Beber logo files in the artwork system. The .ai file is available in the "Client Logos" folder with version 2.1 created on July 15, 2024.';
        results = [
          {
            id: 'beber-logo-ai',
            type: 'artwork',
            title: 'Beber Logo - Vector File (.ai)',
            description: 'Adobe Illustrator file, Version 2.1, Last updated July 15, 2024',
            confidence: 0.98,
            source: 'Artwork Management System',
            metadata: { fileType: 'ai', version: '2.1', size: '2.4 MB' },
            action: { label: 'Download File', url: '/artwork/beber-logo-ai' }
          },
          {
            id: 'beber-logo-eps',
            type: 'artwork',
            title: 'Beber Logo - EPS Format',
            description: 'Encapsulated PostScript file for print production',
            confidence: 0.85,
            source: 'Artwork Management System',
            metadata: { fileType: 'eps', version: '2.1', size: '1.8 MB' },
            action: { label: 'Download File', url: '/artwork/beber-logo-eps' }
          }
        ];
        suggestions = ['All Beber files', 'Client logo library', 'Recent artwork uploads'];
      }
      else if (lowerQuery.includes('stock') || lowerQuery.includes('inventory')) {
        answer = 'Current inventory status shows 5 products with low stock levels. Custom T-shirts (Red, Size L) have only 12 units remaining, and promotional pens (Blue) are down to 8 units.';
        results = [
          {
            id: 'tshirt-red-l',
            type: 'product',
            title: 'Custom T-Shirt - Red, Size L',
            description: 'Low stock alert: Only 12 units remaining (Reorder level: 50)',
            confidence: 0.92,
            source: 'Inventory Management',
            metadata: { stock: 12, reorderLevel: 50, status: 'low' },
            action: { label: 'Reorder Now', url: '/products/tshirt-red-l' }
          },
          {
            id: 'pen-blue',
            type: 'product',
            title: 'Promotional Pen - Blue',
            description: 'Critical stock: Only 8 units left (Reorder level: 100)',
            confidence: 0.89,
            source: 'Inventory Management',
            metadata: { stock: 8, reorderLevel: 100, status: 'critical' },
            action: { label: 'Reorder Now', url: '/products/pen-blue' }
          }
        ];
        suggestions = ['All low stock items', 'Reorder recommendations', 'Best selling products'];
      }
      else if (lowerQuery.includes('supplier') || lowerQuery.includes('vendor')) {
        answer = 'Top suppliers this month by order volume: PrintMaster Pro ($45,600), CustomWorks Inc ($32,100), and PromoSource LLC ($28,900). PrintMaster Pro has the best performance rating of 4.8/5.';
        results = [
          {
            id: 'printmaster-pro',
            type: 'supplier',
            title: 'PrintMaster Pro',
            description: 'Top supplier this month - $45,600 in orders, 4.8/5 rating',
            confidence: 0.94,
            source: 'Supplier Management',
            metadata: { revenue: 45600, rating: 4.8, orders: 23 },
            action: { label: 'View Supplier', url: '/suppliers/printmaster-pro' }
          },
          {
            id: 'customworks-inc',
            type: 'supplier',
            title: 'CustomWorks Inc',
            description: 'Second highest volume - $32,100 in orders, 4.6/5 rating',
            confidence: 0.91,
            source: 'Supplier Management',
            metadata: { revenue: 32100, rating: 4.6, orders: 18 },
            action: { label: 'View Supplier', url: '/suppliers/customworks-inc' }
          }
        ];
        suggestions = ['Supplier performance reports', 'New supplier onboarding', 'Payment terms comparison'];
      }
      else if (lowerQuery.includes('contact') || lowerQuery.includes('company')) {
        const searchTerm = lowerQuery.match(/for\s+(.+?)(?:\s|$)/)?.[1] || 'company';
        answer = `I found contact information for ${searchTerm}. The primary contact is John Smith (john@company.com, 555-123-4567) and the company is located at 123 Business Ave, Suite 100.`;
        results = [
          {
            id: `${searchTerm}-contact`,
            type: 'contact',
            title: `${searchTerm} - Primary Contact`,
            description: 'John Smith, Marketing Director - john@company.com, 555-123-4567',
            confidence: 0.87,
            source: 'CRM Database',
            metadata: { email: 'john@company.com', phone: '555-123-4567' },
            action: { label: 'View Contact', url: `/crm/contacts/${searchTerm}` }
          }
        ];
        suggestions = ['All company contacts', 'Recent communications', 'Update contact info'];
      }
      else {
        // Generic search
        answer = `I searched across all systems for "${query}". Here are the most relevant results from orders, products, contacts, and files.`;
        results = [
          {
            id: 'generic-1',
            type: 'general',
            title: `Search results for: ${query}`,
            description: 'Found multiple matches across different system modules',
            confidence: 0.7,
            source: 'System-wide Search',
            action: { label: 'View All', url: `/search?q=${encodeURIComponent(query)}` }
          }
        ];
        suggestions = [
          `${query} orders`,
          `${query} products`,
          `${query} contacts`,
          'Recent activities',
          'Popular searches'
        ];
      }

      const processingTime = Date.now() - startTime;

      res.json({
        query,
        answer,
        results,
        suggestions,
        processingTime
      });

    } catch (error) {
      console.error('AI search error:', error);
      res.status(500).json({ 
        message: 'AI search failed',
        query,
        answer: 'Sorry, I encountered an error while searching. Please try again.',
        results: [],
        suggestions: [],
        processingTime: 0
      });
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

  // Test presentation generation (development endpoint)
  app.post('/api/test-presentation-generation', isAuthenticated, async (req, res) => {
    try {
      console.log("Testing presentation generation with fallback...");
      
      // Create a test presentation
      const testPresentation = await storage.createPresentation({
        title: 'Test Presentation - Corporate Event Campaign',
        description: 'Test presentation for Q1 corporate events',
        dealNotes: 'Looking for branded apparel, tech accessories, and drinkware for corporate events. Budget $25k, quantities 500-1000 units per item.',
        userId: req.user.claims.sub,
        status: 'draft'
      });

      // Generate suggestions immediately
      await generatePresentationWithAI(testPresentation.id, testPresentation.dealNotes || '');
      
      res.json({ 
        message: 'Test presentation created and generated successfully!',
        presentationId: testPresentation.id 
      });
    } catch (error) {
      console.error("Error testing presentation generation:", error);
      res.status(500).json({ message: "Failed to test presentation generation", error: error.message });
    }
  });

  // AI Presentation Builder routes
  app.get('/api/presentations', isAuthenticated, async (req, res) => {
    try {
      const presentations = await storage.getPresentations(req.user.claims.sub);
      res.json(presentations);
    } catch (error) {
      console.error("Error fetching presentations:", error);
      res.status(500).json({ message: "Failed to fetch presentations" });
    }
  });

  app.post('/api/presentations', isAuthenticated, presentationUpload.array('files', 10), async (req, res) => {
    try {
      const { title, description, dealNotes } = req.body;
      
      if (!title?.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }

      // Create presentation
      const presentation = await storage.createPresentation({
        title: title.trim(),
        description: description?.trim() || null,
        dealNotes: dealNotes?.trim() || null,
        userId: req.user.claims.sub,
        status: 'draft'
      });

      // Handle file uploads if any
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await storage.createPresentationFile({
            presentationId: presentation.id,
            fileName: file.originalname,
            fileType: path.extname(file.originalname).toLowerCase(),
            fileSize: file.size,
            filePath: file.path
          });
        }
      }

      res.status(201).json(presentation);

      // Start AI analysis in background if there are deal notes
      if (dealNotes?.trim()) {
        generatePresentationWithAI(presentation.id, dealNotes.trim());
      }
    } catch (error) {
      console.error("Error creating presentation:", error);
      res.status(500).json({ message: "Failed to create presentation" });
    }
  });

  app.post('/api/presentations/import-hubspot', isAuthenticated, async (req, res) => {
    try {
      const { hubspotDealId } = req.body;
      
      if (!hubspotDealId?.trim()) {
        return res.status(400).json({ message: "HubSpot Deal ID is required" });
      }

      // Mock HubSpot integration - in real implementation, fetch from HubSpot API
      const mockDealData = {
        dealname: `Deal #${hubspotDealId}`,
        amount: '25000',
        description: 'Q1 promotional products campaign for corporate events. Looking for branded apparel, tech accessories, and drinkware. Budget range $20k-30k. Timeline: 6 weeks. Quantities: 500-1000 units per item. Previous orders included polo shirts, wireless chargers, and custom water bottles.',
        company: 'ABC Corporation'
      };

      const presentation = await storage.createPresentation({
        title: mockDealData.dealname,
        description: `Imported from HubSpot Deal - ${mockDealData.company}`,
        dealNotes: mockDealData.description,
        hubspotDealId: hubspotDealId.trim(),
        userId: req.user.claims.sub,
        status: 'draft'
      });

      res.status(201).json(presentation);

      // Start AI analysis in background
      generatePresentationWithAI(presentation.id, mockDealData.description);
    } catch (error) {
      console.error("Error importing from HubSpot:", error);
      res.status(500).json({ message: "Failed to import from HubSpot" });
    }
  });

  app.post('/api/presentations/:id/generate', isAuthenticated, async (req, res) => {
    try {
      const presentationId = req.params.id;
      const presentation = await storage.getPresentation(presentationId);
      
      if (!presentation || presentation.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Presentation not found" });
      }

      // Update status to generating
      await storage.updatePresentation(presentationId, { status: 'generating' });
      
      res.json({ message: "Generation started" });

      // Start AI generation in background
      generatePresentationWithAI(presentationId, presentation.dealNotes || '');
    } catch (error) {
      console.error("Error generating presentation:", error);
      res.status(500).json({ message: "Failed to generate presentation" });
    }
  });

  app.delete('/api/presentations/:id', isAuthenticated, async (req, res) => {
    try {
      const presentationId = req.params.id;
      const presentation = await storage.getPresentation(presentationId);
      
      if (!presentation || presentation.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Presentation not found" });
      }

      await storage.deletePresentation(presentationId);
      res.json({ message: "Presentation deleted" });
    } catch (error) {
      console.error("Error deleting presentation:", error);
      res.status(500).json({ message: "Failed to delete presentation" });
    }
  });

  // Slack Integration Routes
  app.get('/api/slack/messages', isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getSlackMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching Slack messages:", error);
      res.status(500).json({ message: "Failed to fetch Slack messages" });
    }
  });

  app.post('/api/slack/send-message', isAuthenticated, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Send message to Slack
      const messageResponse = await sendSlackMessage({
        channel: process.env.SLACK_CHANNEL_ID!,
        text: content.trim(),
        username: 'SwagSuite',
        icon_emoji: ':briefcase:'
      });

      // Store message in database
      const message = await storage.createSlackMessage({
        channelId: process.env.SLACK_CHANNEL_ID!,
        messageId: messageResponse || 'sent',
        userId: req.user.claims.sub,
        content: content.trim()
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending Slack message:", error);
      res.status(500).json({ message: "Failed to send Slack message" });
    }
  });

  // S&S Activewear Integration Routes
  app.get('/api/ss-activewear/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getSsActivewearProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching S&S Activewear products:", error);
      res.status(500).json({ message: "Failed to fetch S&S Activewear products" });
    }
  });

  app.post('/api/ss-activewear/test-connection', isAuthenticated, async (req, res) => {
    try {
      const { accountNumber, apiKey } = req.body;
      
      if (!accountNumber || !apiKey) {
        return res.status(400).json({ message: "Account number and API key are required" });
      }

      const ssService = new SsActivewearService({ accountNumber, apiKey });
      const isConnected = await ssService.testConnection();
      
      res.json({ connected: isConnected });
    } catch (error) {
      console.error("Error testing S&S Activewear connection:", error);
      res.status(500).json({ message: "Failed to test connection" });
    }
  });

  // Get product by SKU from S&S Activewear
  app.get('/api/ss-activewear/product/:sku', isAuthenticated, async (req, res) => {
    try {
      const { sku } = req.params;
      const service = new SsActivewearService({ 
        accountNumber: '52733', 
        apiKey: '1812622b-59cd-4863-8a9f-ad64eee5cd22' 
      });
      const product = await service.getProductBySku(sku);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error fetching S&S Activewear product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // S&S Activewear universal product search (searches SKU, style, and name simultaneously)
  app.get('/api/ss-activewear/search', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const service = new SsActivewearService({ 
        accountNumber: '52733', 
        apiKey: '1812622b-59cd-4863-8a9f-ad64eee5cd22' 
      });
      const products = await service.searchProducts(query);
      
      res.json(products);
    } catch (error) {
      console.error('Error searching S&S Activewear products:', error);
      res.status(500).json({ error: 'Failed to search products' });
    }
  });

  app.post('/api/ss-activewear/import', isAuthenticated, async (req, res) => {
    try {
      const { accountNumber, apiKey, styleFilter } = req.body;
      
      if (!accountNumber || !apiKey) {
        return res.status(400).json({ message: "Account number and API key are required" });
      }

      const ssService = new SsActivewearService({ accountNumber, apiKey });
      const jobId = await ssService.importProducts(req.user.claims.sub, styleFilter);
      
      res.json({ jobId, message: "Import started" });
    } catch (error) {
      console.error("Error starting S&S Activewear import:", error);
      res.status(500).json({ message: "Failed to start import" });
    }
  });

  app.get('/api/ss-activewear/import-jobs', isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getSsActivewearImportJobs(req.user.claims.sub);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching import jobs:", error);
      res.status(500).json({ message: "Failed to fetch import jobs" });
    }
  });

  app.get('/api/ss-activewear/import-jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getSsActivewearImportJob(req.params.id);
      
      if (!job || job.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Import job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching import job:", error);
      res.status(500).json({ message: "Failed to fetch import job" });
    }
  });

  app.get('/api/ss-activewear/search', isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const products = await storage.searchSsActivewearProducts(q);
      res.json(products);
    } catch (error) {
      console.error("Error searching S&S Activewear products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // Admin Settings Management Endpoints
  app.get('/api/admin/settings', isAuthenticated, async (req, res) => {
    try {
      const settings = {
        features: [
          { id: 'popular_products', enabled: true, category: 'analytics' },
          { id: 'suggested_items', enabled: true, category: 'analytics' },
          { id: 'admin_suggestions', enabled: true, category: 'core', adminOnly: true },
          { id: 'universal_search', enabled: true, category: 'core' },
          { id: 'ss_activewear_integration', enabled: true, category: 'integrations' },
          { id: 'hubspot_sync', enabled: false, category: 'integrations' },
          { id: 'slack_notifications', enabled: true, category: 'integrations' },
          { id: 'ai_knowledge_base', enabled: true, category: 'advanced' },
          { id: 'production_reports', enabled: true, category: 'analytics' },
          { id: 'team_leaderboard', enabled: true, category: 'analytics' },
          { id: 'automation_workflows', enabled: true, category: 'advanced' },
          { id: 'multi_company_view', enabled: false, category: 'advanced', adminOnly: true }
        ]
      };
      res.json(settings);
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/admin/settings/features', isAuthenticated, async (req, res) => {
    try {
      const { featureId, enabled } = req.body;
      console.log(`Feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`);
      res.json({ success: true, message: 'Feature updated successfully' });
    } catch (error) {
      console.error('Error updating feature:', error);
      res.status(500).json({ error: 'Failed to update feature' });
    }
  });

  // Weekly Report Config routes
  app.get("/api/weekly-reports/config", isAuthenticated, async (req, res) => {
    try {
      const configs = await storage.getWeeklyReportConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching weekly report configs:", error);
      res.status(500).json({ message: "Failed to fetch report configs" });
    }
  });

  app.post("/api/weekly-reports/config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.createWeeklyReportConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error creating weekly report config:", error);
      res.status(500).json({ message: "Failed to create report config" });
    }
  });

  app.patch("/api/weekly-reports/config/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const config = await storage.updateWeeklyReportConfig(id, req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating weekly report config:", error);
      res.status(500).json({ message: "Failed to update report config" });
    }
  });

  app.delete("/api/weekly-reports/config/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWeeklyReportConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting weekly report config:", error);
      res.status(500).json({ message: "Failed to delete report config" });
    }
  });

  // Weekly Report Log routes
  app.get("/api/weekly-reports/logs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const logs = await storage.getWeeklyReportLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching weekly report logs:", error);
      res.status(500).json({ message: "Failed to fetch report logs" });
    }
  });

  app.post("/api/weekly-reports/logs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const log = await storage.createWeeklyReportLog({
        ...req.body,
        userId,
      });
      res.json(log);
    } catch (error) {
      console.error("Error creating weekly report log:", error);
      res.status(500).json({ message: "Failed to create report log" });
    }
  });

  // Generate weekly report for current user
  app.post("/api/weekly-reports/generate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Calculate date range for this week
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Get active report configurations
      const configs = await storage.getWeeklyReportConfigs();
      const activeConfigs = configs.filter(config => config.isActive);
      
      // Calculate metrics (basic implementation)
      const metricsData: Record<string, any> = {};
      
      for (const config of activeConfigs) {
        let value = 0;
        
        switch (config.dataSource) {
          case 'orders':
            const orders = await storage.getOrdersByStatus('approved');
            value = orders.filter(order => 
              order.createdAt && order.createdAt >= weekStart && order.createdAt <= weekEnd
            ).length;
            break;
          case 'revenue':
            const revenueOrders = await storage.getOrdersByStatus('approved');
            value = revenueOrders
              .filter(order => order.createdAt && order.createdAt >= weekStart && order.createdAt <= weekEnd)
              .reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
            break;
          case 'margin':
            const marginOrders = await storage.getOrdersByStatus('approved');
            const totalRevenue = marginOrders
              .filter(order => order.createdAt && order.createdAt >= weekStart && order.createdAt <= weekEnd)
              .reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
            const totalMargin = marginOrders
              .filter(order => order.createdAt && order.createdAt >= weekStart && order.createdAt <= weekEnd)
              .reduce((sum, order) => sum + (parseFloat(order.total || '0') * parseFloat(order.margin || '0') / 100), 0);
            value = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
            break;
          case 'stores':
            const companies = await storage.getCompanies();
            value = companies.filter(company => 
              company.createdAt && company.createdAt >= weekStart && company.createdAt <= weekEnd
            ).length;
            break;
          default:
            value = 0;
        }
        
        metricsData[config.metricName] = {
          displayName: config.displayName,
          value,
          calculationMethod: config.calculationMethod,
          description: config.description
        };
      }
      
      // Create report log
      const reportLog = await storage.createWeeklyReportLog({
        userId,
        reportWeekStart: weekStart,
        reportWeekEnd: weekEnd,
        metricsData,
        emailStatus: 'pending'
      });
      
      res.json({
        success: true,
        reportLog,
        message: "Weekly report generated successfully. Email functionality will be available when SendGrid is configured."
      });
      
    } catch (error) {
      console.error("Error generating weekly report:", error);
      res.status(500).json({ message: "Failed to generate weekly report" });
    }
  });

  // Sequence routes
  app.get('/api/sequences', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sequences = await storage.getSequences(userId);
      res.json(sequences);
    } catch (error) {
      console.error('Error fetching sequences:', error);
      res.status(500).json({ error: 'Failed to fetch sequences' });
    }
  });

  app.get('/api/sequences/:id', isAuthenticated, async (req, res) => {
    try {
      const sequence = await storage.getSequence(req.params.id);
      if (!sequence) {
        return res.status(404).json({ error: 'Sequence not found' });
      }
      res.json(sequence);
    } catch (error) {
      console.error('Error fetching sequence:', error);
      res.status(500).json({ error: 'Failed to fetch sequence' });
    }
  });

  app.post('/api/sequences', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSequenceSchema.parse(req.body);
      const userId = req.user?.claims?.sub;
      
      const sequenceData = {
        ...validatedData,
        userId: userId || validatedData.userId
      };
      
      const sequence = await storage.createSequence(sequenceData);
      res.status(201).json(sequence);
    } catch (error) {
      console.error('Error creating sequence:', error);
      res.status(500).json({ error: 'Failed to create sequence' });
    }
  });

  app.put('/api/sequences/:id', isAuthenticated, async (req, res) => {
    try {
      const sequence = await storage.updateSequence(req.params.id, req.body);
      res.json(sequence);
    } catch (error) {
      console.error('Error updating sequence:', error);
      res.status(500).json({ error: 'Failed to update sequence' });
    }
  });

  app.delete('/api/sequences/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSequence(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting sequence:', error);
      res.status(500).json({ error: 'Failed to delete sequence' });
    }
  });

  // Sequence Step routes
  app.get('/api/sequences/:sequenceId/steps', isAuthenticated, async (req, res) => {
    try {
      const steps = await storage.getSequenceSteps(req.params.sequenceId);
      res.json(steps);
    } catch (error) {
      console.error('Error fetching sequence steps:', error);
      res.status(500).json({ error: 'Failed to fetch sequence steps' });
    }
  });

  app.post('/api/sequences/:sequenceId/steps', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSequenceStepSchema.parse(req.body);
      const stepData = {
        ...validatedData,
        sequenceId: req.params.sequenceId
      };
      
      const step = await storage.createSequenceStep(stepData);
      res.status(201).json(step);
    } catch (error) {
      console.error('Error creating sequence step:', error);
      res.status(500).json({ error: 'Failed to create sequence step' });
    }
  });

  // Sequence Enrollment routes
  app.get('/api/sequence-enrollments', isAuthenticated, async (req, res) => {
    try {
      const sequenceId = req.query.sequenceId as string;
      const enrollments = await storage.getSequenceEnrollments(sequenceId);
      res.json(enrollments);
    } catch (error) {
      console.error('Error fetching sequence enrollments:', error);
      res.status(500).json({ error: 'Failed to fetch sequence enrollments' });
    }
  });

  app.post('/api/sequence-enrollments', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSequenceEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createSequenceEnrollment(validatedData);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error('Error creating sequence enrollment:', error);
      res.status(500).json({ error: 'Failed to create sequence enrollment' });
    }
  });

  // Sequence Analytics routes
  app.get('/api/sequences/:sequenceId/analytics', isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getSequenceAnalytics(req.params.sequenceId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching sequence analytics:', error);
      res.status(500).json({ error: 'Failed to fetch sequence analytics' });
    }
  });

  app.post('/api/sequences/:sequenceId/analytics', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSequenceAnalyticsSchema.parse(req.body);
      const analyticsData = {
        ...validatedData,
        sequenceId: req.params.sequenceId
      };
      
      const analytics = await storage.createSequenceAnalytics(analyticsData);
      res.status(201).json(analytics);
    } catch (error) {
      console.error('Error creating sequence analytics:', error);
      res.status(500).json({ error: 'Failed to create sequence analytics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
