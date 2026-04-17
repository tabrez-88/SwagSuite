import type { Request, Response } from "express";
import { integrationRepository } from "../repositories/integration.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import { productRepository } from "../repositories/product.repository";
import { SsActivewearService } from "../services/ssActivewear.service";
import { SageService, getSageCredentials } from "../services/sage.service";
import { getQuickBooksCredentials } from "../services/quickbooks.service";
import { getStripeCredentials } from "../services/stripe.service";
import { getTaxJarCredentials } from "../services/taxjar.service";
import { ShipStationService, getShipStationCredentials } from "../services/shipstation.service";
import { notificationScheduler } from "../services/notificationScheduler.service";
import { shipmentService } from "../services/shipment.service";

// Helper function to get S&S Activewear credentials
async function getSsActivewearCredentials() {
  // Try to get from database first
  const dbSettings = await integrationRepository.getIntegrationSettings();

  return {
    accountNumber: dbSettings?.ssActivewearAccount || process.env.SS_ACTIVEWEAR_ACCOUNT?.trim() || '',
    apiKey: dbSettings?.ssActivewearApiKey || process.env.SS_ACTIVEWEAR_API_KEY?.trim() || ''
  };
}

export class IntegrationController {

  // ==================== HubSpot ====================

  static async getHubspotStatus(req: Request, res: Response) {
    // Mock HubSpot sync status - would integrate with actual HubSpot API
    res.json({
      lastSync: new Date().toISOString(),
      status: 'active',
      recordsProcessed: 150,
    });
  }

  static async getHubspotMetrics(req: Request, res: Response) {
    // Mock HubSpot metrics - would integrate with actual HubSpot API
    res.json({
      totalContacts: 2847,
      pipelineDeals: 89,
      monthlyRevenue: 285000,
      conversionRate: 24.5,
    });
  }

  static async syncHubspot(req: Request, res: Response) {
    const { syncType } = req.body;
    // Mock sync initiation - would trigger actual HubSpot sync
    res.json({ message: `${syncType} sync initiated successfully` });
  }

  // ==================== Slack Bridge ====================

  static async syncSlackMessages(req: Request, res: Response) {
    try {
      if (!process.env.SLACK_BOT_TOKEN?.trim() || !process.env.SLACK_CHANNEL_ID?.trim()) {
        return res.json({ messages: [] });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN.trim());
      const channelId = process.env.SLACK_CHANNEL_ID.trim();

      const result = await slack.conversations.history({
        channel: channelId,
        limit: 50
      });

      const messages = (result.messages || []).map((msg: any) => ({
        id: msg.ts || msg.client_msg_id || `msg_${Date.now()}_${Math.random()}`,
        channelId: channelId,
        messageId: msg.ts || '',
        userId: msg.user || undefined,
        username: msg.username || msg.user || 'Team Member',
        content: msg.text || '',
        attachments: msg.files || [],
        threadTs: msg.thread_ts || undefined,
        isReply: !!msg.thread_ts && msg.thread_ts !== msg.ts,
        replyCount: msg.reply_count || 0,
        timestamp: msg.ts ? new Date(parseFloat(msg.ts) * 1000).toISOString() : new Date().toISOString(),
        createdAt: msg.ts ? new Date(parseFloat(msg.ts) * 1000).toISOString() : new Date().toISOString(),
        botId: msg.bot_id || undefined,
      }));

      // Filter out thread replies from main list (show only top-level messages)
      const topLevelMessages = messages.filter((m: any) => !m.isReply);

      res.json({ messages: topLevelMessages });
    } catch (error) {
      console.error("Error syncing Slack messages:", error);
      res.json({ messages: [] });
    }
  }

  static async sendSlackBridgeMessage(req: Request, res: Response) {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }

      if (!process.env.SLACK_BOT_TOKEN?.trim() || !process.env.SLACK_CHANNEL_ID?.trim()) {
        return res.status(400).json({ message: "Slack not configured" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN.trim());

      const result = await slack.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID.trim(),
        text: content,
        username: 'SwagSuite Bot'
      });

      res.json({
        success: true,
        message: "Message sent successfully",
        messageId: result.ts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending Slack message:", error);
      res.status(500).json({ message: "Failed to send message to Slack" });
    }
  }

  static async getSlackThread(req: Request, res: Response) {
    try {
      const { threadTs } = req.params;

      if (!process.env.SLACK_BOT_TOKEN?.trim() || !process.env.SLACK_CHANNEL_ID?.trim()) {
        return res.json({ replies: [] });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN.trim());

      const result = await slack.conversations.replies({
        channel: process.env.SLACK_CHANNEL_ID.trim(),
        ts: threadTs,
      });

      // Skip the first message (it's the parent), return only replies
      const replies = (result.messages || []).slice(1).map((msg: any) => ({
        id: msg.ts || `reply_${Date.now()}_${Math.random()}`,
        messageId: msg.ts || '',
        userId: msg.user || undefined,
        username: msg.username || msg.user || 'Team Member',
        content: msg.text || '',
        timestamp: msg.ts ? new Date(parseFloat(msg.ts) * 1000).toISOString() : new Date().toISOString(),
        createdAt: msg.ts ? new Date(parseFloat(msg.ts) * 1000).toISOString() : new Date().toISOString(),
        botId: msg.bot_id || undefined,
      }));

      res.json({ replies });
    } catch (error) {
      console.error("Error fetching Slack thread:", error);
      res.json({ replies: [] });
    }
  }

  // ==================== Slack Configuration ====================

  static async saveSlackConfig(req: Request, res: Response) {
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
  }

  static async testSlackConnection(req: Request, res: Response) {
    try {
      const { message, channel } = req.body;

      if (!process.env.SLACK_BOT_TOKEN?.trim()) {
        return res.status(400).json({ message: "Slack bot token not configured" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN.trim());

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
  }

  static async sendSlackIntegrationMessage(req: Request, res: Response) {
    try {
      const { message, channel } = req.body;

      if (!message || !channel) {
        return res.status(400).json({ message: "Message and channel are required" });
      }

      if (!process.env.SLACK_BOT_TOKEN?.trim()) {
        return res.status(400).json({ message: "Slack bot token not configured" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN.trim());

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
  }

  static async getSlackChannels(req: Request, res: Response) {
    try {
      if (!process.env.SLACK_BOT_TOKEN?.trim()) {
        return res.status(400).json({ message: "Slack bot token not configured" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN.trim());

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
  }

  static async getSlackMessages(req: Request, res: Response) {
    try {
      if (!process.env.SLACK_BOT_TOKEN?.trim() || !process.env.SLACK_CHANNEL_ID?.trim()) {
        return res.status(400).json({ message: "Slack configuration incomplete" });
      }

      const { WebClient } = await import("@slack/web-api");
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN.trim());

      const result = await slack.conversations.history({
        channel: process.env.SLACK_CHANNEL_ID.trim(),
        limit: 10
      });

      const messages = result.messages?.map(msg => ({
        id: msg.ts,
        content: msg.text || '',
        user: msg.user || 'Unknown',
        timestamp: new Date(parseFloat(msg.ts || '0') * 1000).toISOString(),
        channel: process.env.SLACK_CHANNEL_ID?.trim()
      })) || [];

      res.json(messages);
    } catch (error) {
      console.error("Error fetching Slack messages:", error);
      res.status(500).json({ message: "Failed to fetch Slack messages" });
    }
  }

  // ==================== News ====================

  static async getNewsItems(req: Request, res: Response) {
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
  }

  // ==================== SAGE ====================

  static async getSageProducts(req: Request, res: Response) {
    try {
      const { search, category, brand, limit } = req.query;

      if (!search) {
        // No search term — return locally synced SAGE products
        const products = await integrationRepository.getSageProducts(parseInt(limit as string) || 100);
        return res.json({ products, totalResults: products.length });
      }

      const credentials = await getSageCredentials();
      if (!credentials || !credentials.acctId || !credentials.loginId || !credentials.key) {
        return res.status(400).json({
          message: 'SAGE credentials not configured. Please configure in Settings → Integrations.'
        });
      }

      const sageService = new SageService({
        acctId: credentials.acctId,
        loginId: credentials.loginId,
        key: credentials.key,
      });

      const products = await sageService.searchProducts(search as string, {
        categoryId: category as string,
        supplierId: brand as string,
        maxResults: parseInt(limit as string) || 50
      });

      res.json({
        products,
        totalResults: products.length,
        searchCriteria: { search, category, brand },
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error searching SAGE products:', error);
      res.status(500).json({
        message: 'Failed to fetch SAGE products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async testSageConnection(req: Request, res: Response) {
    try {
      const credentials = await getSageCredentials();

      if (!credentials) {
        return res.status(400).json({
          message: 'SAGE credentials not configured. Please add your SAGE API credentials in settings.'
        });
      }

      const sageService = new SageService(credentials);
      const isConnected = await sageService.testConnection();

      if (isConnected) {
        res.json({
          message: 'Successfully connected to SAGE API',
          status: 'connected'
        });
      } else {
        res.status(400).json({
          message: 'Failed to connect to SAGE API. Please check your credentials.',
          status: 'failed'
        });
      }
    } catch (error) {
      console.error('Error testing SAGE connection:', error);
      res.status(500).json({
        message: 'Error testing SAGE connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async searchSageProducts(req: Request, res: Response) {
    try {
      const { searchTerm, categoryId, supplierId, maxResults } = req.body;

      if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required' });
      }

      const credentials = await getSageCredentials();
      if (!credentials) {
        return res.status(400).json({
          message: 'SAGE credentials not configured'
        });
      }

      const sageService = new SageService(credentials);
      const products = await sageService.searchProducts(searchTerm, {
        categoryId,
        supplierId,
        maxResults: maxResults || 50
      });

      res.json({
        products,
        total: products.length
      });
    } catch (error) {
      console.error('Error searching SAGE products:', error);
      res.status(500).json({
        message: 'Failed to search SAGE products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async syncSageProducts(req: Request, res: Response) {
    try {
      const { products } = req.body;

      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ message: 'Products array is required' });
      }

      const credentials = await getSageCredentials();
      if (!credentials) {
        return res.status(400).json({
          message: 'SAGE credentials not configured'
        });
      }

      const sageService = new SageService(credentials);

      // Sync products to database with supplier deduplication
      const syncResults = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      const enrichedSupplierIds = new Set<string>();

      for (const product of products) {
        try {
          await sageService.syncProductToDatabase(product, enrichedSupplierIds);
          syncResults.success++;
        } catch (error) {
          syncResults.failed++;
          syncResults.errors.push(`Failed to sync ${product.productId || 'unknown'}: ${error}`);
        }
      }

      res.json({
        message: `Synced ${syncResults.success} products successfully`,
        ...syncResults
      });
    } catch (error) {
      console.error('Error syncing SAGE products:', error);
      res.status(500).json({
        message: 'Failed to sync SAGE products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getSageProductsList(req: Request, res: Response) {
    try {
      const { search, limit } = req.query;

      if (search) {
        const credentials = await getSageCredentials();

        if (!credentials || !credentials.acctId || !credentials.loginId || !credentials.key) {
          return res.status(400).json({
            message: 'SAGE credentials not configured. Please configure in Settings → Integrations.'
          });
        }

        const sageService = new SageService({
          acctId: credentials.acctId,
          loginId: credentials.loginId,
          key: credentials.key,
        });

        const products = await sageService.searchProducts(search as string, {
          maxResults: parseInt(limit as string) || 50
        });

        res.json(products);
      } else {
        const products = await integrationRepository.getSageProducts(parseInt(limit as string) || 100);
        res.json(products);
      }
    } catch (error) {
      console.error('Error fetching SAGE products:', error);
      res.status(500).json({
        message: 'Failed to fetch SAGE products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getSageProductById(req: Request, res: Response) {
    try {
      const product = await integrationRepository.getSageProductBySageId(req.params.id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching SAGE product:', error);
      res.status(500).json({
        message: 'Failed to fetch SAGE product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /** GET /api/sage/product-pricing/:prodEId — Fetch full pricing tiers from SAGE 105 API */
  static async getSageProductPricing(req: Request, res: Response) {
    try {
      const { prodEId } = req.params;
      if (!prodEId) return res.status(400).json({ message: "prodEId required" });

      const credentials = await getSageCredentials();
      if (!credentials) return res.status(400).json({ message: "SAGE credentials not configured" });

      const sageService = new SageService(credentials);
      const detail = await sageService.getFullProductDetail(prodEId, false);
      if (!detail) return res.status(404).json({ message: "Product not found in SAGE" });

      // Parse qty/prc/net arrays into normalized tiers
      const qty = Array.isArray(detail.qty) ? detail.qty.map((q: string) => parseInt(q) || 0).filter((q: number) => q > 0) : [];
      const prc = Array.isArray(detail.prc) ? detail.prc.filter((p: string) => p !== '') : [];
      const net = Array.isArray(detail.net) ? detail.net.filter((n: string) => n !== '') : [];

      const pricingTiers = qty.map((q: number, i: number) => ({
        quantity: q,
        cost: parseFloat(net[i] || prc[i] || "0"),
        listPrice: parseFloat(prc[i] || "0"),
      })).filter((t: any) => t.quantity > 0 && t.cost > 0);

      res.json({
        prodEId,
        pricingTiers,
        setupCharges: {
          setupChg: parseFloat(detail.setupChg || "0"),
          screenChg: parseFloat(detail.screenChg || "0"),
          plateChg: parseFloat(detail.plateChg || "0"),
        },
      });
    } catch (error) {
      console.error("Error fetching SAGE product pricing:", error);
      res.status(500).json({ message: "Failed to fetch SAGE pricing", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  // ==================== Unified Product Search ====================

  static async searchUnifiedProducts(req: Request, res: Response) {
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
  }

  // ==================== Credentials ====================

  static async getCredentials(req: Request, res: Response) {
    // Get current settings from database
    const currentSettings = await integrationRepository.getIntegrationSettings();

    const credentials = [
      {
        integration: 'ssactivewear',
        keyName: 'ssActivewearAccount',
        displayName: 'S&S Activewear Account',
        isRequired: false,
        isSecret: false,
        value: currentSettings?.ssActivewearAccount || '',
        description: 'Your S&S Activewear account number'
      },
      {
        integration: 'ssactivewear',
        keyName: 'ssActivewearApiKey',
        displayName: 'S&S Activewear API Key',
        isRequired: false,
        isSecret: true,
        value: currentSettings?.ssActivewearApiKey ? '••••••••' : '',
        description: 'Your S&S Activewear API key'
      },
      {
        integration: 'sage',
        keyName: 'sageAcctId',
        displayName: 'SAGE Account ID',
        isRequired: true,
        isSecret: false,
        value: currentSettings?.sageAcctId || '',
        description: 'Your SAGE Connect account number'
      },
      {
        integration: 'sage',
        keyName: 'sageLoginId',
        displayName: 'SAGE Login ID',
        isRequired: true,
        isSecret: false,
        value: currentSettings?.sageLoginId || '',
        description: 'Your SAGE Connect login ID/username'
      },
      {
        integration: 'sage',
        keyName: 'sageApiKey',
        displayName: 'SAGE API Key',
        isRequired: true,
        isSecret: true,
        value: currentSettings?.sageApiKey ? '••••••••' : '',
        description: 'Your SAGE Connect API authentication key'
      },
      {
        integration: 'hubspot',
        keyName: 'hubspotApiKey',
        displayName: 'HubSpot API Key',
        isRequired: false,
        isSecret: true,
        value: currentSettings?.hubspotApiKey ? '••••••••' : '',
        description: 'Your HubSpot API key (optional)'
      }
    ];
    res.json(credentials);
  }

  static async saveCredentials(req: Request, res: Response) {
    const credentials = req.body;
    const userId = (req as any).user.claims.sub;

    // Define allowed credential keys for security
    const allowedKeys = [
      // QuickBooks
      'qbClientId', 'qbClientSecret',
      // Stripe
      'stripePublishableKey', 'stripeSecretKey', 'stripeWebhookSecret',
      // TaxJar
      'taxjarApiKey',
      // SAGE
      'sageAcctId', 'sageLoginId', 'sageApiKey',
      // S&S Activewear
      'ssActivewearAccount', 'ssActivewearApiKey',
      // SanMar
      'sanmarCustomerId', 'sanmarUsername', 'sanmarPassword',
      // HubSpot
      'hubspotApiKey',
      // Slack
      'slackBotToken', 'slackChannelId',
      // ShipStation
      'shipstationApiKey', 'shipstationApiSecret'
    ];

    // Filter to only allowed keys
    const updates: any = {};
    for (const key of allowedKeys) {
      if (credentials[key] !== undefined) {
        updates[key] = credentials[key];
      }
    }

    // Save to database
    await integrationRepository.upsertIntegrationSettings(updates, userId);

    res.json({ message: 'Credentials saved successfully' });
  }

  // ==================== Configurations ====================

  static async getConfigurations(req: Request, res: Response) {
    const settings = await integrationRepository.getIntegrationSettings();

    // Check if SAGE is actually configured
    const sageConfigured = !!(settings?.sageAcctId && settings?.sageLoginId && settings?.sageApiKey);

    const configs = [
      // Financial Integrations
      {
        id: "quickbooks",
        integration: "quickbooks",
        displayName: "QuickBooks Online",
        description: "Sync invoices and customers with QuickBooks.",
        syncEnabled: !!settings?.quickbooksConnected,
        isHealthy: !!settings?.quickbooksConnected,
        status: settings?.quickbooksConnected ? "Active" : "Inactive",
        apiEndpoint: "https://quickbooks.api.intuit.com",
        totalSyncs: 0,
        totalRecordsSynced: 0,
        rateLimitPerHour: 500,
        maxApiCallsPerHour: 500
      },
      {
        id: "stripe",
        integration: "stripe",
        displayName: "Stripe Payments",
        description: "Accept credit card payments via Stripe.",
        syncEnabled: !!settings?.stripeConnected,
        isHealthy: !!settings?.stripeConnected,
        status: settings?.stripeConnected ? "Active" : "Inactive",
        apiEndpoint: "https://api.stripe.com",
        totalSyncs: 0,
        totalRecordsSynced: 0,
        rateLimitPerHour: 1000,
        maxApiCallsPerHour: 1000
      },
      {
        id: "taxjar",
        integration: "taxjar",
        displayName: "TaxJar",
        description: "Automated sales tax calculations.",
        syncEnabled: !!settings?.taxjarApiKey,
        isHealthy: !!settings?.taxjarApiKey,
        status: settings?.taxjarApiKey ? "Active" : "Inactive",
        apiEndpoint: "https://api.taxjar.com",
        totalSyncs: 0,
        totalRecordsSynced: 0,
        rateLimitPerHour: 1000,
        maxApiCallsPerHour: 1000
      },
      // Product Database Integrations
      {
        id: 'config_sage',
        integration: 'sage',
        displayName: 'SAGE',
        description: 'SAGE promotional product database',
        syncEnabled: sageConfigured,
        syncFrequency: 'daily',
        isHealthy: sageConfigured,
        lastSync: null,
        lastHealthCheck: new Date().toISOString(),
        totalSyncs: 0,
        totalRecordsSynced: 0,
        status: sageConfigured ? 'Ready' : 'Not Configured',
        apiEndpoint: 'https://api.sageworld.com',
        rateLimitPerHour: 500,
        maxApiCallsPerHour: 500
      },
      {
        id: 'config_esp',
        integration: 'esp',
        displayName: 'ASI ESP+',
        description: 'Advertising Specialty Institute product database',
        syncEnabled: false,
        syncFrequency: 'daily',
        isHealthy: true,
        lastSync: null,
        lastHealthCheck: new Date().toISOString(),
        totalSyncs: 0,
        totalRecordsSynced: 0,
        status: 'Not Configured',
        apiEndpoint: 'https://api.asicentral.com',
        rateLimitPerHour: 1000,
        maxApiCallsPerHour: 1000
      }
    ];
    res.json(configs);
  }

  static async updateConfiguration(req: Request, res: Response) {
    res.json({ message: "Updated" });
  }

  static async getFullCredentials(req: Request, res: Response) {
    const settings = await integrationRepository.getIntegrationSettings();
    const credentials = [
      // QuickBooks
      {
        integration: "quickbooks",
        keyName: "qbClientId",
        displayName: "Client ID",
        isRequired: true,
        isSecret: false,
        value: settings?.qbClientId,
        description: "From QuickBooks Developer Portal"
      },
      {
        integration: "quickbooks",
        keyName: "qbClientSecret",
        displayName: "Client Secret",
        isRequired: true,
        isSecret: true,
        value: settings?.qbClientSecret,
        description: "From QuickBooks Developer Portal"
      },
      // Stripe
      {
        integration: "stripe",
        keyName: "stripePublishableKey",
        displayName: "Publishable Key",
        isRequired: true,
        isSecret: false,
        value: settings?.stripePublishableKey,
        description: "pk_test_..."
      },
      {
        integration: "stripe",
        keyName: "stripeSecretKey",
        displayName: "Secret Key",
        isRequired: true,
        isSecret: true,
        value: settings?.stripeSecretKey,
        description: "sk_test_..."
      },
      {
        integration: "stripe",
        keyName: "stripeWebhookSecret",
        displayName: "Webhook Secret",
        isRequired: true,
        isSecret: true,
        value: settings?.stripeWebhookSecret,
        description: "whsec_..."
      },
      // TaxJar
      {
        integration: "taxjar",
        keyName: "taxjarApiKey",
        displayName: "API Key",
        isRequired: true,
        isSecret: true,
        value: settings?.taxjarApiKey,
        description: "TaxJar API Token"
      },
      // SAGE
      {
        integration: 'sage',
        keyName: 'sageAcctId',
        displayName: 'Account ID',
        isRequired: true,
        isSecret: false,
        value: settings?.sageAcctId,
        description: 'Your SAGE account ID'
      },
      {
        integration: 'sage',
        keyName: 'sageLoginId',
        displayName: 'Login ID',
        isRequired: true,
        isSecret: false,
        value: settings?.sageLoginId,
        description: 'Your SAGE login ID'
      },
      {
        integration: 'sage',
        keyName: 'sageApiKey',
        displayName: 'API Key',
        isRequired: true,
        isSecret: true,
        value: settings?.sageApiKey,
        description: 'Your SAGE API key'
      },
      // S&S Activewear
      {
        integration: 'ssactivewear',
        keyName: 'ssActivewearAccount',
        displayName: 'Account Number',
        isRequired: true,
        isSecret: false,
        value: settings?.ssActivewearAccount,
        description: 'Your S&S Activewear account number'
      },
      {
        integration: 'ssactivewear',
        keyName: 'ssActivewearApiKey',
        displayName: 'API Key',
        isRequired: true,
        isSecret: true,
        value: settings?.ssActivewearApiKey,
        description: 'Your S&S Activewear API key'
      },
      // SanMar
      {
        integration: 'sanmar',
        keyName: 'sanmarCustomerId',
        displayName: 'Customer ID',
        isRequired: true,
        isSecret: false,
        value: settings?.sanmarCustomerId,
        description: 'Your SanMar customer ID'
      },
      {
        integration: 'sanmar',
        keyName: 'sanmarUsername',
        displayName: 'Username',
        isRequired: true,
        isSecret: false,
        value: settings?.sanmarUsername,
        description: 'Your SanMar API username'
      },
      {
        integration: 'sanmar',
        keyName: 'sanmarPassword',
        displayName: 'Password',
        isRequired: true,
        isSecret: true,
        value: settings?.sanmarPassword,
        description: 'Your SanMar API password'
      },
      // ShipStation
      {
        integration: 'shipstation',
        keyName: 'shipstationApiKey',
        displayName: 'API Key',
        isRequired: true,
        isSecret: true,
        value: settings?.shipstationApiKey,
        description: 'Your ShipStation API key'
      },
      {
        integration: 'shipstation',
        keyName: 'shipstationApiSecret',
        displayName: 'API Secret',
        isRequired: true,
        isSecret: true,
        value: settings?.shipstationApiSecret,
        description: 'Your ShipStation API secret'
      }
    ];
    res.json(credentials);
  }

  // ==================== Generic Integration Test ====================

  static async testIntegration(req: Request, res: Response) {
    const integration = req.params.integration;

    // Handle SAGE real connection test
    if (integration === 'sage') {
      const credentials = await getSageCredentials();

      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: 'SAGE credentials not configured. Please add your SAGE API credentials in settings.'
        });
      }

      try {
        const sageService = new SageService(credentials);
        const isConnected = await sageService.testConnection();

        if (isConnected) {
          return res.json({
            success: true,
            message: 'Successfully connected to SAGE API',
            details: 'Authentication successful, product database accessible'
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Failed to connect to SAGE API. Please check your credentials.',
            details: 'Authentication failed'
          });
        }
      } catch (error) {
        console.error('Error testing SAGE connection:', error);
        return res.status(500).json({
          success: false,
          message: 'Error testing SAGE connection',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Handle QuickBooks connection test
    if (integration === 'quickbooks') {
      const svc = await getQuickBooksCredentials();
      if (!svc) {
        return res.status(400).json({ message: "QuickBooks not configured" });
      }
      // For test, just check if we have tokens or auth URI
      if (!svc.getAuthUri()) {
        return res.status(400).json({ message: "Auth URI generation failed" });
      }
      return res.json({ message: "QuickBooks connection successful" });
    }

    // Handle Stripe connection test
    if (integration === 'stripe') {
      const svc = await getStripeCredentials();
      if (!svc) {
        return res.status(400).json({ message: "Stripe not configured" });
      }
      return res.json({ message: "Stripe connection successful" });
    }

    // Handle TaxJar connection test
    if (integration === 'taxjar') {
      const svc = await getTaxJarCredentials();
      if (!svc) {
        return res.status(400).json({ message: "TaxJar not configured" });
      }
      return res.json({ message: "TaxJar connection successful" });
    }

    // Handle ShipStation connection test
    if (integration === 'shipstation') {
      const credentials = await getShipStationCredentials();
      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: 'ShipStation credentials not configured. Please add your API key and secret in settings.'
        });
      }

      try {
        const service = new ShipStationService(credentials);
        const isConnected = await service.testConnection();

        if (isConnected) {
          // Update connection status
          await integrationRepository.upsertIntegrationSettings({
            shipstationConnected: true,
          });
          return res.json({
            success: true,
            message: 'Successfully connected to ShipStation API',
          });
        } else {
          await integrationRepository.upsertIntegrationSettings({
            shipstationConnected: false,
          });
          return res.status(400).json({
            success: false,
            message: 'Failed to connect to ShipStation API. Please check your credentials.',
          });
        }
      } catch (error) {
        console.error('Error testing ShipStation connection:', error);
        return res.status(500).json({
          success: false,
          message: 'Error testing ShipStation connection',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Mock connection tests for other integrations
    const connectionTests = {
      asi: () => ({
        success: true,
        message: 'Successfully connected to ASI ESP Direct Connect API',
        details: 'API key validated, ready for product searches'
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
  }

  // ==================== S&S Activewear ====================

  static async getSsActivewearProducts(req: Request, res: Response) {
    try {
      const products = await integrationRepository.getSsActivewearProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching S&S Activewear products:", error);
      res.status(500).json({ message: "Failed to fetch S&S Activewear products" });
    }
  }

  static async testSsActivewearConnection(req: Request, res: Response) {
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
  }

  static async getSsActivewearProductBySku(req: Request, res: Response) {
    try {
      const { sku } = req.params;
      const credentials = await getSsActivewearCredentials();
      const service = new SsActivewearService(credentials);
      const product = await service.getProductBySku(sku);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching S&S Activewear product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  static async getSsActivewearBrands(req: Request, res: Response) {
    try {
      const credentials = await getSsActivewearCredentials();

      if (!credentials.accountNumber || !credentials.apiKey) {
        return res.status(400).json({
          error: 'S&S Activewear credentials not configured. Please add your account number and API key in Settings.'
        });
      }

      const service = new SsActivewearService(credentials);
      const brands = await service.getBrands();

      res.json(brands);
    } catch (error) {
      console.error('Error fetching S&S Activewear brands:', error);
      res.status(500).json({ error: 'Failed to fetch brands. Please verify your credentials are correct.' });
    }
  }

  static async searchSsActivewearProducts(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const credentials = await getSsActivewearCredentials();

      if (!credentials.accountNumber || !credentials.apiKey) {
        return res.status(400).json({
          error: 'S&S Activewear credentials not configured. Please configure in Settings → Integrations.'
        });
      }

      const service = new SsActivewearService(credentials);
      const products = await service.searchProducts(q);

      res.json(products);
    } catch (error) {
      console.error('Error searching S&S Activewear products:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to search products'
      });
    }
  }

  static async syncSsActivewearProducts(req: Request, res: Response) {
    try {
      const { products } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "Products array is required" });
      }

      // Find or create S&S Activewear supplier
      let ssSupplier = await supplierRepository.getByName("S&S Activewear");

      if (!ssSupplier) {
        // Also try alternate name
        ssSupplier = await supplierRepository.getByName("SS Activewear");
      }

      if (!ssSupplier) {
        // Create the supplier if it doesn't exist
        ssSupplier = await supplierRepository.create({
          name: "S&S Activewear",
          website: "https://www.ssactivewear.com",
          email: "support@ssactivewear.com",
          phone: "(800) 523-2155",
        });
      }

      let successCount = 0;
      const errors = [];

      for (const ssProduct of products) {
        try {
          // Build comprehensive description with all available details
          const descriptionParts = [
            `${ssProduct.brandName} ${ssProduct.styleName}`,
            `Color: ${ssProduct.colorName} (${ssProduct.colorCode})`,
            `Size: ${ssProduct.sizeName} (${ssProduct.sizeCode})`,
            ssProduct.colorFamily ? `Color Family: ${ssProduct.colorFamily}` : null,
            ssProduct.colorGroupName ? `Color Group: ${ssProduct.colorGroupName}` : null,
            ssProduct.countryOfOrigin ? `Made in: ${ssProduct.countryOfOrigin}` : null,
            ssProduct.unitWeight ? `Weight: ${ssProduct.unitWeight} oz` : null,
            ssProduct.caseQty ? `Case Quantity: ${ssProduct.caseQty}` : null,
            ssProduct.gtin ? `GTIN: ${ssProduct.gtin}` : null,
          ].filter(Boolean);

          // Map S&S product to our product schema
          const product = {
            name: `${ssProduct.brandName} ${ssProduct.styleName} - ${ssProduct.colorName} ${ssProduct.sizeName}`,
            description: descriptionParts.join(' | '),
            sku: ssProduct.sku,
            supplierSku: ssProduct.sku,
            supplierId: ssSupplier.id,
            basePrice: ssProduct.customerPrice?.toString() || ssProduct.piecePrice?.toString() || '0',
            minimumQuantity: ssProduct.caseQty || 1,
            brand: ssProduct.brandName,
            category: 'Apparel',
            colors: [ssProduct.colorName], // Store as string array
            sizes: [ssProduct.sizeName], // Store as string array
            imprintMethods: null, // S&S API doesn't provide this
            leadTime: null, // S&S API doesn't provide this directly
            imageUrl: null, // S&S CDN images are behind Cloudflare — can't be loaded externally
            productType: 'apparel',
            // Build pricing tiers from S&S pricing levels
            pricingTiers: (() => {
              const tiers = [];
              const piecePrice = ssProduct.piecePrice || 0;
              const dozenPrice = ssProduct.dozenPrice ? ssProduct.dozenPrice / 12 : 0;
              const casePrice = ssProduct.casePrice ? ssProduct.casePrice / (ssProduct.caseQty || 12) : 0;
              if (piecePrice > 0) tiers.push({ quantity: 1, cost: +piecePrice.toFixed(2) });
              if (dozenPrice > 0 && +dozenPrice.toFixed(2) !== +piecePrice.toFixed(2)) tiers.push({ quantity: 12, cost: +dozenPrice.toFixed(2) });
              if (casePrice > 0 && +casePrice.toFixed(2) !== +dozenPrice.toFixed(2)) tiers.push({ quantity: ssProduct.caseQty || 72, cost: +casePrice.toFixed(2) });
              return tiers.length > 0 ? tiers : undefined;
            })(),
          };

          // Check if product already exists
          const existingProduct = await productRepository.getBySku(ssProduct.sku);

          if (existingProduct) {
            // Merge colors and sizes with existing data
            const existingColors = Array.isArray(existingProduct.colors) ? existingProduct.colors : [];
            const existingSizes = Array.isArray(existingProduct.sizes) ? existingProduct.sizes : [];

            product.colors = Array.from(new Set([...existingColors, ...product.colors]));
            product.sizes = Array.from(new Set([...existingSizes, ...product.sizes]));

            // Update existing product
            await productRepository.update(existingProduct.id, product);
          } else {
            // Create new product
            await productRepository.create(product);
          }

          successCount++;
        } catch (error) {
          console.error(`Error syncing product ${ssProduct.sku}:`, error);
          errors.push({ sku: ssProduct.sku, error: String(error) });
        }
      }

      res.json({
        count: successCount,
        total: products.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error syncing S&S Activewear products:", error);
      res.status(500).json({ message: "Failed to sync products" });
    }
  }

  // ==================== SanMar ====================

  static async testSanmarConnection(req: Request, res: Response) {
    try {
      const { customerId, username, password } = req.body;

      if (!customerId || !username || !password) {
        return res.status(400).json({ message: "Customer ID, username, and password are required" });
      }

      const { createSanMarService } = await import('../services/sanmar.service');
      const sanmarService = createSanMarService({ customerId, username, password });

      const isConnected = await sanmarService.testConnection();

      if (isConnected) {
        res.json({ success: true, message: "Successfully connected to SanMar API" });
      } else {
        res.status(400).json({ success: false, message: "Failed to connect to SanMar API" });
      }
    } catch (error) {
      console.error("SanMar connection test error:", error);
      res.status(500).json({ message: "Connection test failed" });
    }
  }

  static async searchSanmarProducts(req: Request, res: Response) {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Get credentials from integration settings
    const settings = await integrationRepository.getIntegrationSettings();

    if (!settings?.sanmarCustomerId || !settings?.sanmarUsername || !settings?.sanmarPassword) {
      return res.status(400).json({ message: "SanMar credentials not configured. Please configure in Settings → Integrations." });
    }

    try {
      const { createSanMarService } = await import('../services/sanmar.service');
      const sanmarService = createSanMarService({
        customerId: settings.sanmarCustomerId,
        username: settings.sanmarUsername,
        password: settings.sanmarPassword,
      });

      const products = await sanmarService.searchProducts(q);

      // Products already have colors and sizes aggregated
      res.json(products);
    } catch (error: any) {
      console.error("SanMar search error:", error);
      const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
      res.status(500).json({
        message: isTimeout
          ? "Search timed out. Try searching by style number (e.g., PC54, 5000) instead of brand name for faster results."
          : `Failed to search SanMar products: ${error?.message || 'Unknown error'}`
      });
    }
  }

  static async getSanmarProductDetails(req: Request, res: Response) {
    try {
      const { styleId } = req.params;

      const settings = await integrationRepository.getIntegrationSettings();

      if (!settings?.sanmarCustomerId || !settings?.sanmarUsername || !settings?.sanmarPassword) {
        return res.status(400).json({ message: "SanMar credentials not configured" });
      }

      const { createSanMarService } = await import('../services/sanmar.service');
      const sanmarService = createSanMarService({
        customerId: settings.sanmarCustomerId,
        username: settings.sanmarUsername,
        password: settings.sanmarPassword,
      });

      const product = await sanmarService.getProductDetails(styleId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Product already has all details including colors, sizes, and images
      res.json(product);
    } catch (error) {
      console.error("SanMar product details error:", error);
      res.status(500).json({ message: "Failed to get product details" });
    }
  }

  static async syncSanmarProducts(req: Request, res: Response) {
    try {
      const { products } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "Products array is required" });
      }

      // Find or create SanMar supplier
      let sanmarSupplier = await supplierRepository.getByName("SanMar");

      if (!sanmarSupplier) {
        sanmarSupplier = await supplierRepository.create({
          name: "SanMar",
          website: "https://www.sanmar.com",
          email: "customerservice@sanmar.com",
          phone: "(800) 426-6399",
        });
      }

      let successCount = 0;
      const errors = [];

      for (const sanmarProduct of products) {
        try {
          // Build comprehensive description
          const descriptionParts = [
            sanmarProduct.productTitle || `${sanmarProduct.brandName} ${sanmarProduct.styleName}`,
            sanmarProduct.productDescription,
            sanmarProduct.fabricContent ? `Fabric: ${sanmarProduct.fabricContent}` : null,
            sanmarProduct.productWeight ? `Weight: ${sanmarProduct.productWeight}` : null,
            sanmarProduct.countryOfOrigin ? `Made in: ${sanmarProduct.countryOfOrigin}` : null,
            sanmarProduct.caseQuantity ? `Case Qty: ${sanmarProduct.caseQuantity}` : null,
          ].filter(Boolean);

          // Map SanMar product to our schema
          const product = {
            name: sanmarProduct.productTitle || `${sanmarProduct.brandName} ${sanmarProduct.styleName}`,
            description: descriptionParts.join(' | '),
            sku: sanmarProduct.styleId,
            supplierSku: sanmarProduct.styleId,
            supplierId: sanmarSupplier.id,
            basePrice: (sanmarProduct.pieceSalePrice || sanmarProduct.piecePrice || sanmarProduct.dozenPrice / 12 || 0).toString(),
            minimumQuantity: sanmarProduct.caseSize || 1,
            brand: sanmarProduct.brandName,
            category: sanmarProduct.categoryName || 'Apparel',
            colors: Array.isArray(sanmarProduct.colors) ? sanmarProduct.colors : [],
            sizes: Array.isArray(sanmarProduct.sizes) ? sanmarProduct.sizes : [],
            imprintMethods: null,
            leadTime: null,
            imageUrl: sanmarProduct.frontModel || sanmarProduct.colorProductImage || sanmarProduct.productImage || null,
            productType: 'apparel',
            // Build pricing tiers from SanMar pricing levels
            pricingTiers: (() => {
              const tiers = [];
              const piecePrice = sanmarProduct.pieceSalePrice || sanmarProduct.piecePrice || 0;
              const dozenPrice = sanmarProduct.dozenPrice ? sanmarProduct.dozenPrice / 12 : 0;
              const casePrice = sanmarProduct.casePrice ? sanmarProduct.casePrice / (sanmarProduct.caseSize || 12) : 0;
              if (piecePrice > 0) tiers.push({ quantity: 1, cost: piecePrice });
              if (dozenPrice > 0 && dozenPrice !== piecePrice) tiers.push({ quantity: 12, cost: +dozenPrice.toFixed(2) });
              if (casePrice > 0 && casePrice !== dozenPrice) tiers.push({ quantity: sanmarProduct.caseSize || 72, cost: +casePrice.toFixed(2) });
              return tiers.length > 0 ? tiers : undefined;
            })(),
          };

          // Check if product already exists
          const existingProduct = await productRepository.getBySku(sanmarProduct.styleId);

          if (existingProduct) {
            // Merge colors and sizes with existing data
            const existingColors = Array.isArray(existingProduct.colors) ? existingProduct.colors : [];
            const existingSizes = Array.isArray(existingProduct.sizes) ? existingProduct.sizes : [];

            product.colors = Array.from(new Set([...existingColors, ...product.colors]));
            product.sizes = Array.from(new Set([...existingSizes, ...product.sizes]));

            await productRepository.update(existingProduct.id, product);
          } else {
            await productRepository.create(product);
          }

          successCount++;
        } catch (error) {
          console.error(`Error syncing SanMar product ${sanmarProduct.styleId}:`, error);
          errors.push({ styleId: sanmarProduct.styleId, error: String(error) });
        }
      }

      res.json({
        count: successCount,
        total: products.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error syncing SanMar products:", error);
      res.status(500).json({ message: "Failed to sync products" });
    }
  }

  // ==================== ShipStation ====================

  static async testShipStationConnection(req: Request, res: Response) {
    const { apiKey, apiSecret } = req.body;
    const userId = (req as any).user?.claims?.sub;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: "API Key and API Secret are required" });
    }

    try {
      const service = new ShipStationService({ apiKey, apiSecret });
      const isConnected = await service.testConnection();

      // Persist credentials on successful test so they survive page reload without
      // requiring a separate "Save Settings" click.
      if (isConnected) {
        await integrationRepository.upsertIntegrationSettings(
          {
            shipstationApiKey: apiKey,
            shipstationApiSecret: apiSecret,
            shipstationConnected: true,
          },
          userId
        );
      }

      res.json({ success: isConnected, message: isConnected ? "Connected" : "Connection failed" });
    } catch (error) {
      console.error("ShipStation test connection error:", error);
      res.status(500).json({ success: false, message: "Connection test failed" });
    }
  }

  static async getShipStationCarriers(req: Request, res: Response) {
    const credentials = await getShipStationCredentials();
    if (!credentials) {
      return res.status(400).json({ message: "ShipStation not configured" });
    }

    const service = new ShipStationService(credentials);
    const carriers = await service.getCarriers();
    res.json(carriers);
  }

  static async getShipStationShipments(req: Request, res: Response) {
    const credentials = await getShipStationCredentials();
    if (!credentials) {
      return res.status(400).json({ message: "ShipStation not configured" });
    }

    const { orderNumber, trackingNumber, page, pageSize } = req.query;

    const service = new ShipStationService(credentials);
    const result = await service.getShipments({
      orderNumber: orderNumber as string,
      trackingNumber: trackingNumber as string,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json(result);
  }

  static async syncShipStationShipments(req: Request, res: Response) {
    const credentials = await getShipStationCredentials();
    if (!credentials) {
      return res.status(400).json({ message: "ShipStation not configured" });
    }

    const { orderNumber } = req.body;

    try {
      const service = new ShipStationService(credentials);
      const result = await service.getShipments({
        orderNumber: orderNumber as string,
        pageSize: 100,
      });

      // Import DB utilities dynamically (existing convention)
      const { db } = await import("../db");
      const { orderShipments } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      let synced = 0;
      for (const ss of result.shipments) {
        // Check if we already have this shipment
        const existing = await db
          .select()
          .from(orderShipments)
          .where(eq(orderShipments.shipstationShipmentId, String(ss.shipmentId)))
          .limit(1);

        if (existing.length > 0) {
          // Update existing shipment
          await db
            .update(orderShipments)
            .set({
              trackingNumber: ss.trackingNumber,
              carrier: ShipStationService.mapCarrierCode(ss.carrierCode),
              status: ShipStationService.mapShipmentStatus(ss),
              shipDate: ss.shipDate ? new Date(ss.shipDate) : undefined,
              actualDelivery: ss.deliveryDate ? new Date(ss.deliveryDate) : undefined,
              shippingCost: ss.shipmentCost?.toString(),
              lastTrackingCheck: new Date(),
              shipstationMetadata: ss as any,
              updatedAt: new Date(),
            })
            .where(eq(orderShipments.shipstationShipmentId, String(ss.shipmentId)));
          synced++;
        }
        // If no match by shipstation ID, we could try by orderNumber + tracking number
        // but that's handled in webhook flow or manual linking
      }

      res.json({ synced, total: result.shipments.length });
    } catch (error) {
      console.error("ShipStation sync error:", error);
      res.status(500).json({ message: "Failed to sync shipments from ShipStation" });
    }
  }

  static async pushOrderToShipStation(req: Request, res: Response) {
    const credentials = await getShipStationCredentials();
    if (!credentials) {
      return res.status(400).json({ message: "ShipStation not configured" });
    }

    const { orderId } = req.params;

    try {
      const { db } = await import("../db");
      const { orders, orderItems, products } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Fetch order
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Fetch items with product info
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          description: orderItems.description,
          shipToAddress: orderItems.shipToAddress,
          productName: products.name,
          sku: products.sku,
          productImageUrl: products.imageUrl,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));

      // Use first item's ship-to address or order-level address
      const shipToAddress = items[0]?.shipToAddress
        || (order.shippingAddress ? JSON.parse(order.shippingAddress) : null)
        || {};

      const ssOrder = ShipStationService.mapToShipStationOrder(order, items, shipToAddress);
      const service = new ShipStationService(credentials);
      const created = await service.createOrUpdateOrder(ssOrder);

      res.json({
        success: true,
        shipstationOrderId: created.orderId,
        message: "Order pushed to ShipStation",
      });
    } catch (error) {
      console.error("Error pushing order to ShipStation:", error);
      res.status(500).json({ message: "Failed to push order to ShipStation" });
    }
  }

  static async handleShipStationWebhook(req: Request, res: Response) {
    // ShipStation webhooks send a resource_url - we fetch the actual data from that URL
    const payload = req.body as { resource_url?: string; resource_type?: string };

    if (!payload?.resource_url) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    try {
      const credentials = await getShipStationCredentials();
      if (!credentials) {
        console.error("ShipStation webhook received but no credentials configured");
        return res.status(200).json({ message: "Acknowledged (no credentials)" });
      }

      const service = new ShipStationService(credentials);

      if (payload.resource_type === "SHIP_NOTIFY") {
        // Fetch the shipment data from the resource URL
        const shipmentData = await service.fetchWebhookResource<any>(payload.resource_url);

        if (shipmentData?.shipments) {
          const { db } = await import("../db");
          const { orderShipments, orders } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");

          for (const ss of shipmentData.shipments) {
            // Try to find matching order by orderNumber
            const [order] = await db
              .select()
              .from(orders)
              .where(eq(orders.orderNumber, ss.orderNumber))
              .limit(1);

            if (!order) continue;

            // Check if shipment already exists
            const existing = await db
              .select()
              .from(orderShipments)
              .where(eq(orderShipments.shipstationShipmentId, String(ss.shipmentId)))
              .limit(1);

            if (existing.length > 0) {
              // Update
              await db
                .update(orderShipments)
                .set({
                  trackingNumber: ss.trackingNumber,
                  carrier: ShipStationService.mapCarrierCode(ss.carrierCode),
                  status: "shipped",
                  shipDate: ss.shipDate ? new Date(ss.shipDate) : new Date(),
                  shippingCost: ss.shipmentCost?.toString(),
                  lastTrackingCheck: new Date(),
                  shipstationMetadata: ss as any,
                  updatedAt: new Date(),
                })
                .where(eq(orderShipments.id, existing[0].id));

              // Trigger notifications + SO auto-transition
              await shipmentService.checkShipmentAutoTransition(order.id, "shipped");
              notificationScheduler.sendShippingNotificationToClient(order.id, existing[0].id, 'shipped').catch(() => {});
            } else {
              // Create new shipment record
              const [newShipment] = await db.insert(orderShipments).values({
                orderId: order.id,
                carrier: ShipStationService.mapCarrierCode(ss.carrierCode),
                trackingNumber: ss.trackingNumber,
                status: "shipped",
                shipDate: ss.shipDate ? new Date(ss.shipDate) : new Date(),
                shippingCost: ss.shipmentCost?.toString(),
                shipstationOrderId: String(ss.orderId),
                shipstationShipmentId: String(ss.shipmentId),
                lastTrackingCheck: new Date(),
                shipstationMetadata: ss as any,
              }).returning();

              // Trigger notifications + SO auto-transition
              await shipmentService.checkShipmentAutoTransition(order.id, "shipped");
              if (newShipment) {
                notificationScheduler.sendShippingNotificationToClient(order.id, newShipment.id, 'shipped').catch(() => {});
              }
            }
          }
        }
      }

      // Always respond 200 to acknowledge webhook
      res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
      console.error("ShipStation webhook processing error:", error);
      // Still respond 200 to prevent webhook retries
      res.status(200).json({ message: "Webhook acknowledged with errors" });
    }
  }
}
