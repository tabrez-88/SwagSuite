import type { Request, Response } from "express";
import path from "path";
import OpenAI from "openai";
import { presentationRepository } from "../repositories/presentation.repository";
import { companyRepository } from "../repositories/company.repository";
import { productRepository } from "../repositories/product.repository";
import { projectRepository } from "../repositories/project.repository";
import { portalRepository } from "../repositories/portal.repository";
import { getUserId } from "../utils/getUserId";
import { registerInMediaLibrary } from "../utils/registerInMediaLibrary";

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY?.trim() ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY.trim(),
}) : null;

/**
 * AI-powered presentation generation (background task).
 * Moved from routes.ts so presentation controllers can call it.
 */
async function generatePresentationWithAI(presentationId: string, dealNotes: string) {
  try {
    await presentationRepository.updatePresentation(presentationId, { status: 'generating' });

    if (!openai) {
      console.log('OpenAI API key not configured, using fallback suggestions');

      // Fallback product suggestions when AI is not available
      const products = await productRepository.getAll();
      const fallbackSuggestions = products.slice(0, 4).map((product, index) => ({
        productName: product.name,
        suggestedQuantity: [250, 500, 1000, 750][index] || 500,
        suggestedPrice: product.basePrice,
        reasoning: `Popular promotional item suitable for corporate campaigns. Great for brand visibility and customer engagement.`
      }));

      await presentationRepository.updatePresentation(presentationId, {
        suggestedProducts: fallbackSuggestions,
        status: 'completed'
      });

      for (const product of fallbackSuggestions) {
        await presentationRepository.createPresentationProduct({
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
    const products = await productRepository.getAll();
    const productContext = products.slice(0, 20).map(p =>
      `${p.name} - $${p.basePrice} - Promotional Product - ${p.description || 'No description'}`
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.choices[0]?.message?.content || '{}';
    const aiResponse = JSON.parse(textContent);

    // Update presentation with AI suggestions
    await presentationRepository.updatePresentation(presentationId, {
      suggestedProducts: aiResponse.suggestedProducts,
      status: 'completed'
    });

    // Create individual product suggestions
    for (const product of aiResponse.suggestedProducts) {
      await presentationRepository.createPresentationProduct({
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
    await presentationRepository.updatePresentation(presentationId, { status: 'error' });
  }
}

// ────────────────────────────────────────────────────────────
// Mockup Builder
// ────────────────────────────────────────────────────────────

export class MockupBuilderController {
  static async searchProducts(req: Request, res: Response) {
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
  }

  static async getTemplates(_req: Request, res: Response) {
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
  }

  static async createTemplate(req: Request, res: Response) {
    const templateData = req.body;

    // Mock template creation
    const newTemplate = {
      id: `template_${Date.now()}`,
      ...templateData,
      createdAt: new Date().toISOString(),
      createdBy: (req.user as any)?.claims?.sub
    };

    res.status(201).json(newTemplate);
  }

  static async generateAiTemplates(req: Request, res: Response) {
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
  }

  static async downloadMockup(req: Request, res: Response) {
    const { mockupData, format = 'png' } = req.body;

    // Mock mockup download preparation
    const downloadUrl = `https://mock-storage.example.com/mockups/${Date.now()}.${format}`;

    res.json({
      downloadUrl,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      format,
      size: '1920x1080'
    });
  }

  static async emailMockup(req: Request, res: Response) {
    const { mockupData, emailData } = req.body;

    // Mock email sending
    res.json({
      success: true,
      messageId: `email_${Date.now()}`,
      sentTo: emailData.recipients,
      sentAt: new Date().toISOString()
    });
  }
}

// ────────────────────────────────────────────────────────────
// Presentations (AI Presentation Builder)
// ────────────────────────────────────────────────────────────

export class PresentationController {
  static async list(req: Request, res: Response) {
    const presentations = await presentationRepository.getPresentations(req.user!.claims.sub);
    res.json(presentations);
  }

  static async create(req: Request, res: Response) {
    const { title, description, dealNotes } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Create presentation
    const presentation = await presentationRepository.createPresentation({
      title: title.trim(),
      description: description?.trim() || null,
      dealNotes: dealNotes?.trim() || null,
      userId: req.user!.claims.sub,
      status: 'draft'
    });

    // Handle file uploads if any
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        await presentationRepository.createPresentationFile({
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
  }

  static async importHubspot(req: Request, res: Response) {
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

    const presentation = await presentationRepository.createPresentation({
      title: mockDealData.dealname,
      description: `Imported from HubSpot Deal - ${mockDealData.company}`,
      dealNotes: mockDealData.description,
      hubspotDealId: hubspotDealId.trim(),
      userId: req.user!.claims.sub,
      status: 'draft'
    });

    res.status(201).json(presentation);

    // Start AI analysis in background
    generatePresentationWithAI(presentation.id, mockDealData.description);
  }

  static async generate(req: Request, res: Response) {
    const presentationId = req.params.id;
    const presentation = await presentationRepository.getPresentation(presentationId);

    if (!presentation || presentation.userId !== req.user!.claims.sub) {
      return res.status(404).json({ message: "Presentation not found" });
    }

    // Update status to generating
    await presentationRepository.updatePresentation(presentationId, { status: 'generating' });

    res.json({ message: "Generation started" });

    // Start AI generation in background
    generatePresentationWithAI(presentationId, presentation.dealNotes || '');
  }

  static async delete(req: Request, res: Response) {
    const presentationId = req.params.id;
    const presentation = await presentationRepository.getPresentation(presentationId);

    if (!presentation || presentation.userId !== req.user!.claims.sub) {
      return res.status(404).json({ message: "Presentation not found" });
    }

    await presentationRepository.deletePresentation(presentationId);
    res.json({ message: "Presentation deleted" });
  }
}

// ────────────────────────────────────────────────────────────
// Product Comments
// ────────────────────────────────────────────────────────────

export class ProductCommentController {
  static async list(req: Request, res: Response) {
    const { projectActivities } = await import("@shared/schema");
    const actDb = await import("../db").then(m => m.db);
    const { eq: eqOp, and: andOp } = await import("drizzle-orm");

    const comments = await actDb
      .select()
      .from(projectActivities)
      .where(
        andOp(
          eqOp(projectActivities.orderId, req.params.projectId),
          eqOp(projectActivities.activityType, "product_comment"),
        )
      );

    // Group by orderItemId
    const grouped: Record<string, any[]> = {};
    for (const c of comments) {
      const itemId = (c.metadata as any)?.orderItemId;
      if (itemId) {
        if (!grouped[itemId]) grouped[itemId] = [];
        grouped[itemId].push({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          isClient: (c.metadata as any)?.isClientComment || false,
          clientName: (c.metadata as any)?.clientName || null,
          userId: c.userId,
        });
      }
    }

    res.json(grouped);
  }

  static async create(req: Request, res: Response) {
    const { orderItemId, content } = req.body;
    if (!orderItemId || !content) {
      return res.status(400).json({ message: "orderItemId and content are required" });
    }

    const { projectActivities } = await import("@shared/schema");
    const actDb = await import("../db").then(m => m.db);
    const currentUserId = getUserId(req);

    const [comment] = await actDb.insert(projectActivities).values({
      orderId: req.params.projectId,
      userId: currentUserId,
      activityType: "product_comment",
      content: content.substring(0, 2000),
      metadata: { orderItemId, isClientComment: false },
      isSystemGenerated: false,
    }).returning();

    res.status(201).json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      isClient: false,
      userId: currentUserId,
    });
  }
}

// ────────────────────────────────────────────────────────────
// Presentation Share (customer-facing)
// ────────────────────────────────────────────────────────────

export class PresentationShareController {
  static async createShareLink(req: Request, res: Response) {
    const projectId = req.params.projectId;
    const order = await projectRepository.getOrder(projectId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check if an active presentation token already exists
    const existing = await portalRepository.getActivePortalTokenByType(projectId, "presentation");
    if (existing) {
      return res.json({
        token: existing.token,
        url: `${req.protocol}://${req.get('host')}/presentation/${existing.token}`,
        existingToken: true,
        accessCount: existing.accessCount,
      });
    }

    // Create new presentation token
    const crypto = await import("crypto");
    const tokenValue = crypto.randomUUID();
    const expiryDate = (order as any)?.stageData?.presentation?.expiryDate;

    const portalToken = await portalRepository.createCustomerPortalToken({
      orderId: projectId,
      token: tokenValue,
      clientEmail: (order as any)?.stageData?.presentation?.clientContactId || null,
      isActive: true,
      tokenType: "presentation",
      expiresAt: expiryDate ? new Date(expiryDate) : null,
    } as any);

    // Auto-transition status to client_review if currently open
    if ((order as any).presentationStatus === "open") {
      await projectRepository.updateOrder(projectId, { presentationStatus: "client_review" } as any);
      // Log activity
      const { projectActivities } = await import("@shared/schema");
      const actDb = await import("../db").then(m => m.db);
      await actDb.insert(projectActivities).values({
        orderId: projectId, userId: (req.user as any)?.claims?.sub || "system",
        activityType: "status_change",
        content: "Presentation status changed from Open to Client Review",
        metadata: { section: "presentation", oldStatus: "open", newStatus: "client_review" },
        isSystemGenerated: true,
      });
    }

    res.json({
      token: portalToken.token,
      url: `${req.protocol}://${req.get('host')}/presentation/${portalToken.token}`,
      existingToken: false,
      accessCount: 0,
    });
  }

  static async getPublicPresentation(req: Request, res: Response) {
    const portalToken = await portalRepository.getCustomerPortalTokenByToken(req.params.token);

    if (!portalToken || (portalToken as any).tokenType !== "presentation") {
      return res.status(404).json({ message: "Presentation not found" });
    }
    if (!portalToken.isActive) {
      return res.status(403).json({ message: "This presentation link has been deactivated" });
    }
    if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) {
      return res.status(403).json({ message: "This presentation has expired", expired: true });
    }

    // Increment access
    await portalRepository.incrementPortalTokenAccess(portalToken.id);

    // Fetch order + items + company
    const order = await projectRepository.getOrder(portalToken.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const items = await projectRepository.getOrderItems(portalToken.orderId);
    const company = (order as any).companyId ? await companyRepository.getById((order as any).companyId) : null;

    // Get item lines for pricing tiers + charges
    const allItemLines: Record<string, any[]> = {};
    const allItemCharges: Record<string, any[]> = {};
    for (const item of items) {
      const lines = await projectRepository.getOrderItemLines(item.id);
      allItemLines[item.id] = lines;
      const charges = await projectRepository.getOrderAdditionalCharges(item.id);
      allItemCharges[item.id] = charges;
    }

    // Get products for images/colors/sizes
    const productIds = Array.from(new Set(items.map((i: any) => i.productId).filter(Boolean)));
    const products: any[] = [];
    for (const pid of productIds) {
      const p = await productRepository.getById(pid as string);
      if (p) products.push(p);
    }

    // Get presentation settings
    const presSettings = (order as any)?.stageData?.presentation || {};
    const itemVisibility = presSettings.itemVisibility || {};
    const itemOrder = presSettings.itemOrder || [];
    const hidePricing = presSettings.hidePricing || false;

    // Build enriched items (sanitized — no cost, margin, vendor info)
    let enrichedItems = items
      .filter((item: any) => itemVisibility[item.id] !== false)
      .map((item: any) => {
        const product = products.find((p: any) => p.id === item.productId);
        const lines = allItemLines[item.id] || [];
        const charges = (allItemCharges[item.id] || []).filter((c: any) => c.displayToClient !== false);
        return {
          id: item.id,
          productName: item.productName,
          productSku: item.productSku,
          productImageUrl: item.productImageUrl || product?.imageUrl || null,
          productBrand: item.productBrand || product?.brand || null,
          productDescription: item.productDescription || product?.description || null,
          productColors: item.productColors || product?.colors || [],
          productSizes: item.productSizes || product?.sizes || [],
          quantity: item.quantity,
          unitPrice: hidePricing ? null : item.unitPrice,
          lines: hidePricing ? [] : lines.map((l: any) => ({
            id: l.id, quantity: l.quantity, unitPrice: l.unitPrice,
          })),
          charges: hidePricing ? [] : charges.map((c: any) => ({
            id: c.id, description: c.description, chargeType: c.chargeType, amount: c.amount,
          })),
        };
      });

    // Apply custom ordering
    if (itemOrder.length > 0) {
      enrichedItems.sort((a: any, b: any) => {
        const aIdx = itemOrder.indexOf(a.id);
        const bIdx = itemOrder.indexOf(b.id);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    }

    // Get product comments
    const { projectActivities } = await import("@shared/schema");
    const actDb = await import("../db").then(m => m.db);
    const { eq: eqOp, and: andOp } = await import("drizzle-orm");
    const comments = await actDb
      .select()
      .from(projectActivities)
      .where(
        andOp(
          eqOp(projectActivities.orderId, portalToken.orderId),
          eqOp(projectActivities.activityType, "product_comment"),
        )
      );

    // Group comments by orderItemId
    const commentsByItem: Record<string, any[]> = {};
    for (const c of comments) {
      const itemId = (c.metadata as any)?.orderItemId;
      if (itemId) {
        if (!commentsByItem[itemId]) commentsByItem[itemId] = [];
        commentsByItem[itemId].push({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          isClient: (c.metadata as any)?.isClientComment || false,
          clientName: (c.metadata as any)?.clientName || null,
          userName: c.isSystemGenerated ? "System" : "Rep",
        });
      }
    }

    // Auto-transition: first view logs activity
    if ((order as any).presentationStatus === "client_review" && portalToken.accessCount === 0 && order.assignedUserId) {
      await actDb.insert(projectActivities).values({
        orderId: portalToken.orderId, userId: order.assignedUserId,
        activityType: "system_action",
        content: "Client viewed the presentation for the first time",
        metadata: { action: "presentation_first_view" },
        isSystemGenerated: true,
      });
    }

    res.json({
      presentation: {
        orderNumber: order.orderNumber,
        companyName: company?.name || (order as any).companyName || "",
        companyLogo: (company as any)?.logoUrl || null,
        introduction: presSettings.introduction || "",
        primaryColor: presSettings.primaryColor || "#2563eb",
        headerStyle: presSettings.headerStyle || "banner",
        fontFamily: presSettings.fontFamily || "default",
        footerText: presSettings.footerText || "",
        logoUrl: presSettings.logoUrl || null,
        hidePricing,
        currency: presSettings.currency || "USD",
      },
      items: enrichedItems,
      comments: commentsByItem,
    });
  }

  static async postPublicComment(req: Request, res: Response) {
    const portalToken = await portalRepository.getCustomerPortalTokenByToken(req.params.token);
    if (!portalToken || (portalToken as any).tokenType !== "presentation") {
      return res.status(404).json({ message: "Presentation not found" });
    }
    if (!portalToken.isActive) {
      return res.status(403).json({ message: "This presentation is no longer active" });
    }

    const { orderItemId, content, clientName, clientEmail } = req.body;
    if (!orderItemId || !content) {
      return res.status(400).json({ message: "orderItemId and content are required" });
    }

    const { projectActivities } = await import("@shared/schema");
    const actDb = await import("../db").then(m => m.db);

    // Get order to use assignedUserId (FK requires valid user)
    const order = await projectRepository.getOrder(portalToken.orderId);
    if (!order?.assignedUserId) {
      return res.status(500).json({ message: "Unable to post comment" });
    }

    const [comment] = await actDb.insert(projectActivities).values({
      orderId: portalToken.orderId,
      userId: order.assignedUserId,
      activityType: "product_comment",
      content: content.substring(0, 2000),
      metadata: {
        orderItemId,
        clientName: clientName || "Client",
        clientEmail: clientEmail || null,
        isClientComment: true,
      },
      isSystemGenerated: false,
    }).returning();

    res.status(201).json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      isClient: true,
      clientName: clientName || "Client",
    });
  }
}

// ────────────────────────────────────────────────────────────
// Cloudinary Upload
// ────────────────────────────────────────────────────────────

export class CloudinaryUploadController {
  static async upload(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // File is uploaded to Cloudinary via multer-storage-cloudinary
    // req.file.path contains the Cloudinary URL
    const cloudinaryUrl = (req.file as any).path;
    const publicId = (req.file as any).filename || (req.file as any).public_id;

    // Dual-write to media library
    try {
      const userId = (req.user as any)?.id;
      await registerInMediaLibrary({
        cloudinaryUrl,
        cloudinaryPublicId: publicId,
        fileName: publicId,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        sourceTable: "direct",
        sourceId: publicId,
        uploadedBy: userId,
      });
    } catch (mlError) {
      console.error("Failed to register in media library (non-blocking):", mlError);
    }

    res.status(200).json({
      url: cloudinaryUrl,
      publicId: publicId,
      fileName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
  }
}

// ────────────────────────────────────────────────────────────
// Seed Dummy Data
// ────────────────────────────────────────────────────────────

export class SeedController {
  static async seed(req: Request, res: Response) {
    console.log("Starting dummy data seeding...");
    const { seedDummyData } = await import("../utils/seedDummyData");
    await seedDummyData();
    console.log("Dummy data seeding completed successfully!");
    res.json({ message: 'Dummy data seeded successfully!' });
  }
}
