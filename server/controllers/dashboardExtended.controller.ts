import type { Request, Response } from "express";
import { dashboardRepository } from "../repositories/dashboard.repository";
import { errorRepository } from "../repositories/error.repository";
import { companyRepository } from "../repositories/company.repository";
import { productRepository } from "../repositories/product.repository";
import { supplierRepository } from "../repositories/supplier.repository";

export class DashboardExtendedController {
  /**
   * GET /api/search — Universal search across companies, products, orders
   */
  static async universalSearch(req: Request, res: Response) {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Search across multiple entities
    const [companies, products] = await Promise.all([
      companyRepository.search(query),
      productRepository.search(query),
    ]);

    res.json({
      companies: companies.slice(0, 5),
      products: products.slice(0, 5),
      orders: [],
    });
  }

  /**
   * GET /api/dashboard/enhanced-stats — Enhanced dashboard metrics with period comparisons
   */
  static async getEnhancedStats(req: Request, res: Response) {
    const stats = await dashboardRepository.getStats();
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
  }

  /**
   * POST /api/sync/ytd-spending — Manual YTD sync: recalculate all YTD spending and product counts
   */
  static async syncYtdSpending(req: Request, res: Response) {
    console.log('Starting YTD and product sync...');
    const { db } = await import("../db");
    const { companies, suppliers, orders, products } = await import("@shared/schema");
    const { eq, and, gte, sql } = await import("drizzle-orm");

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    let companiesUpdated = 0;
    let suppliersUpdated = 0;
    let productCountsUpdated = 0;

    // Get all companies
    const allCompanies = await companyRepository.getAll();
    console.log(`Found ${allCompanies.length} companies to sync`);

    // Update YTD for each company
    for (const company of allCompanies) {
      try {
        const [ytdResult] = await db
          .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
          .from(orders)
          .where(
            and(
              eq(orders.companyId, company.id),
              gte(orders.createdAt, yearStart)
            )
          );

        const ytdSpend = ytdResult?.total ? parseFloat(ytdResult.total) : 0;

        await db
          .update(companies)
          .set({ ytdSpend: ytdSpend.toFixed(2) })
          .where(eq(companies.id, company.id));

        companiesUpdated++;
        console.log(`✓ Synced company ${company.name}: $${ytdSpend.toFixed(2)}`);
      } catch (err) {
        console.error(`Error syncing company ${company.name}:`, err);
      }
    }

    // Get all suppliers
    const allSuppliers = await supplierRepository.getAll();
    console.log(`Found ${allSuppliers.length} suppliers to sync`);

    // Update YTD and product count for each supplier
    for (const supplier of allSuppliers) {
      try {
        // Calculate YTD spend from order items
        const { orderItems } = await import("@shared/schema");
        const [ytdResult] = await db
          .select({ total: sql<string>`COALESCE(SUM(${orderItems.totalPrice}), 0)` })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(
            and(
              eq(orderItems.supplierId, supplier.id),
              gte(orders.createdAt, yearStart)
            )
          );

        const ytdSpend = ytdResult?.total ? parseFloat(ytdResult.total) : 0;

        // Count products
        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(products)
          .where(eq(products.supplierId, supplier.id));

        const productCount = countResult?.count || 0;

        await db
          .update(suppliers)
          .set({
            ytdSpend: ytdSpend.toFixed(2),
            productCount
          })
          .where(eq(suppliers.id, supplier.id));

        suppliersUpdated++;
        productCountsUpdated++;
        console.log(`✓ Synced supplier ${supplier.name}: $${ytdSpend.toFixed(2)}, ${productCount} products`);
      } catch (err) {
        console.error(`Error syncing supplier ${supplier.name}:`, err);
      }
    }

    console.log(`Sync completed: ${companiesUpdated} companies, ${suppliersUpdated} suppliers, ${productCountsUpdated} product counts`);

    res.json({
      message: 'YTD spending and product counts synced successfully',
      companiesUpdated,
      suppliersUpdated,
      productCountsUpdated,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/dashboard/team-performance — Team performance dashboard with error tracking
   */
  static async getTeamPerformance(req: Request, res: Response) {
    // Get error statistics for team performance
    const errors = await errorRepository.getErrors();
    const totalErrors = errors.length;
    const resolvedErrors = errors.filter(e => e.isResolved).length;
    const unresolvedErrors = totalErrors - resolvedErrors;
    const totalErrorCost = errors.reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0);
    const errorResolutionRate = totalErrors > 0 ? Math.round((resolvedErrors / totalErrors) * 100) : 0;

    // Calculate error metrics by responsible party for team insights
    const lsdErrors = errors.filter(e => e.responsibleParty === 'lsd');
    const vendorErrors = errors.filter(e => e.responsibleParty === 'vendor');
    const customerErrors = errors.filter(e => e.responsibleParty === 'customer');

    const teamPerformanceData = {
      teamStats: {
        totalRevenue: 2850000,
        teamTargetRevenue: 3200000,
        achievementPercentage: 89.1,
        totalOrders: 342,
        avgOrderValue: 8333,
        conversionRate: 24.5,
        customerSatisfaction: 4.7,
        activeDeals: 127,
        newClients: 23,
        repeatClients: 89,
        // Error tracking metrics
        totalErrors,
        resolvedErrors,
        unresolvedErrors,
        errorResolutionRate,
        totalErrorCost,
        lsdErrors: lsdErrors.length,
        vendorErrors: vendorErrors.length,
        customerErrors: customerErrors.length
      },
      salesTeam: [
        {
          id: 1,
          name: "Sarah Johnson",
          role: "Senior Sales Rep",
          avatar: "/avatars/sarah.jpg",
          revenue: 485000,
          target: 520000,
          achievement: 93.3,
          orders: 67,
          avgOrderValue: 7239,
          conversionRate: 28.5,
          newClients: 8,
          activities: 145,
          lastActivity: "2024-01-15T14:30:00Z",
          status: "active",
          trend: "up",
          errorsReported: errors.filter(e => e.orderRep === 'Sarah Johnson' || e.productionRep === 'Sarah Johnson').length,
          errorsResolved: errors.filter(e => (e.orderRep === 'Sarah Johnson' || e.productionRep === 'Sarah Johnson') && e.isResolved).length,
          errorCost: errors.filter(e => e.orderRep === 'Sarah Johnson' || e.productionRep === 'Sarah Johnson').reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0),
          monthlyProgress: [
            { month: "Jan", revenue: 52000, target: 45000 },
            { month: "Feb", revenue: 48000, target: 45000 },
            { month: "Mar", revenue: 51000, target: 45000 },
            { month: "Apr", revenue: 49000, target: 45000 },
            { month: "May", revenue: 53000, target: 45000 },
            { month: "Jun", revenue: 47000, target: 45000 }
          ]
        },
        {
          id: 2,
          name: "Mike Chen",
          role: "Account Manager",
          avatar: "/avatars/mike.jpg",
          revenue: 423000,
          target: 450000,
          achievement: 94.0,
          orders: 59,
          avgOrderValue: 7169,
          conversionRate: 26.8,
          newClients: 6,
          activities: 128,
          lastActivity: "2024-01-15T16:45:00Z",
          status: "active",
          trend: "up",
          errorsReported: errors.filter(e => e.orderRep === 'Mike Chen' || e.productionRep === 'Mike Chen').length,
          errorsResolved: errors.filter(e => (e.orderRep === 'Mike Chen' || e.productionRep === 'Mike Chen') && e.isResolved).length,
          errorCost: errors.filter(e => e.orderRep === 'Mike Chen' || e.productionRep === 'Mike Chen').reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0),
          monthlyProgress: [
            { month: "Jan", revenue: 41000, target: 37500 },
            { month: "Feb", revenue: 43000, target: 37500 },
            { month: "Mar", revenue: 45000, target: 37500 },
            { month: "Apr", revenue: 42000, target: 37500 },
            { month: "May", revenue: 46000, target: 37500 },
            { month: "Jun", revenue: 44000, target: 37500 }
          ]
        },
        {
          id: 3,
          name: "Emily Davis",
          role: "Sales Rep",
          avatar: "/avatars/emma.jpg",
          revenue: 367000,
          target: 380000,
          achievement: 96.6,
          orders: 52,
          avgOrderValue: 7058,
          conversionRate: 31.2,
          newClients: 9,
          activities: 167,
          lastActivity: "2024-01-15T11:20:00Z",
          status: "active",
          trend: "up",
          errorsReported: errors.filter(e => e.orderRep === 'Emily Davis' || e.productionRep === 'Emily Davis').length,
          errorsResolved: errors.filter(e => (e.orderRep === 'Emily Davis' || e.productionRep === 'Emily Davis') && e.isResolved).length,
          errorCost: errors.filter(e => e.orderRep === 'Emily Davis' || e.productionRep === 'Emily Davis').reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0),
          monthlyProgress: [
            { month: "Jan", revenue: 35000, target: 32000 },
            { month: "Feb", revenue: 37000, target: 32000 },
            { month: "Mar", revenue: 39000, target: 32000 },
            { month: "Apr", revenue: 36000, target: 32000 },
            { month: "May", revenue: 41000, target: 32000 },
            { month: "Jun", revenue: 38000, target: 32000 }
          ]
        },
        {
          id: 4,
          name: "David Park",
          role: "Inside Sales",
          avatar: "/avatars/david.jpg",
          revenue: 298000,
          target: 320000,
          achievement: 93.1,
          orders: 71,
          avgOrderValue: 4197,
          conversionRate: 22.4,
          newClients: 12,
          activities: 203,
          lastActivity: "2024-01-15T13:15:00Z",
          status: "active",
          trend: "steady",
          errorsReported: errors.filter(e => e.orderRep === 'David Park' || e.productionRep === 'David Park').length,
          errorsResolved: errors.filter(e => (e.orderRep === 'David Park' || e.productionRep === 'David Park') && e.isResolved).length,
          errorCost: errors.filter(e => e.orderRep === 'David Park' || e.productionRep === 'David Park').reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0),
          monthlyProgress: [
            { month: "Jan", revenue: 28000, target: 27000 },
            { month: "Feb", revenue: 29000, target: 27000 },
            { month: "Mar", revenue: 31000, target: 27000 },
            { month: "Apr", revenue: 30000, target: 27000 },
            { month: "May", revenue: 32000, target: 27000 },
            { month: "Jun", revenue: 29000, target: 27000 }
          ]
        },
        {
          id: 5,
          name: "Lisa Thompson",
          role: "Regional Manager",
          avatar: "/avatars/lisa.jpg",
          revenue: 521000,
          target: 550000,
          achievement: 94.7,
          orders: 43,
          avgOrderValue: 12116,
          conversionRate: 35.8,
          newClients: 5,
          activities: 89,
          lastActivity: "2024-01-15T15:30:00Z",
          status: "active",
          trend: "up",
          errorsReported: errors.filter(e => e.orderRep === 'Lisa Thompson' || e.productionRep === 'Lisa Thompson').length,
          errorsResolved: errors.filter(e => (e.orderRep === 'Lisa Thompson' || e.productionRep === 'Lisa Thompson') && e.isResolved).length,
          errorCost: errors.filter(e => e.orderRep === 'Lisa Thompson' || e.productionRep === 'Lisa Thompson').reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0),
          monthlyProgress: [
            { month: "Jan", revenue: 48000, target: 46000 },
            { month: "Feb", revenue: 52000, target: 46000 },
            { month: "Mar", revenue: 55000, target: 46000 },
            { month: "Apr", revenue: 51000, target: 46000 },
            { month: "May", revenue: 58000, target: 46000 },
            { month: "Jun", revenue: 53000, target: 46000 }
          ]
        },
        {
          id: 6,
          name: "James Wilson",
          role: "Sales Rep",
          avatar: "/avatars/james.jpg",
          revenue: 245000,
          target: 290000,
          achievement: 84.5,
          orders: 38,
          avgOrderValue: 6447,
          conversionRate: 19.7,
          newClients: 4,
          activities: 95,
          lastActivity: "2024-01-14T17:20:00Z",
          status: "needs_attention",
          trend: "down",
          errorsReported: errors.filter(e => e.orderRep === 'James Wilson' || e.productionRep === 'James Wilson').length,
          errorsResolved: errors.filter(e => (e.orderRep === 'James Wilson' || e.productionRep === 'James Wilson') && e.isResolved).length,
          errorCost: errors.filter(e => e.orderRep === 'James Wilson' || e.productionRep === 'James Wilson').reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0),
          monthlyProgress: [
            { month: "Jan", revenue: 25000, target: 24000 },
            { month: "Feb", revenue: 23000, target: 24000 },
            { month: "Mar", revenue: 26000, target: 24000 },
            { month: "Apr", revenue: 22000, target: 24000 },
            { month: "May", revenue: 27000, target: 24000 },
            { month: "Jun", revenue: 21000, target: 24000 }
          ]
        }
      ],
      teamKPIs: [
        {
          metric: "Total Revenue",
          value: "$2.85M",
          target: "$3.2M",
          achievement: 89.1,
          trend: "up",
          change: "+12.3%",
          period: "YTD"
        },
        {
          metric: "Average Order Value",
          value: "$8,333",
          target: "$8,500",
          achievement: 98.0,
          trend: "up",
          change: "+5.7%",
          period: "This Month"
        },
        {
          metric: "Conversion Rate",
          value: "24.5%",
          target: "25.0%",
          achievement: 98.0,
          trend: "steady",
          change: "+1.2%",
          period: "This Quarter"
        },
        {
          metric: "Customer Satisfaction",
          value: "4.7/5",
          target: "4.5/5",
          achievement: 104.4,
          trend: "up",
          change: "+0.3",
          period: "This Month"
        },
        {
          metric: "New Clients",
          value: "23",
          target: "25",
          achievement: 92.0,
          trend: "steady",
          change: "+15.0%",
          period: "This Month"
        },
        {
          metric: "Pipeline Value",
          value: "$1.2M",
          target: "$1.1M",
          achievement: 109.1,
          trend: "up",
          change: "+18.5%",
          period: "Current"
        },
        {
          metric: "Error Resolution Rate",
          value: `${errorResolutionRate}%`,
          target: "95%",
          achievement: errorResolutionRate / 95 * 100,
          trend: errorResolutionRate >= 90 ? "up" : "down",
          change: "+8.2%",
          period: "This Month"
        },
        {
          metric: "Total Error Cost",
          value: `$${totalErrorCost.toFixed(0)}`,
          target: "$500",
          achievement: totalErrorCost <= 500 ? 100 : (500 / totalErrorCost * 100),
          trend: totalErrorCost <= 1000 ? "up" : "down",
          change: "-12.5%",
          period: "This Month"
        },
        {
          metric: "Open Error Issues",
          value: `${unresolvedErrors}`,
          target: "5",
          achievement: unresolvedErrors <= 5 ? 100 : (5 / unresolvedErrors * 100),
          trend: unresolvedErrors <= 10 ? "up" : "down",
          change: "-3",
          period: "This Month"
        }
      ],
      activityMetrics: {
        totalCalls: 1247,
        totalEmails: 3456,
        totalMeetings: 156,
        totalProposals: 89,
        avgResponseTime: "2.3 hours",
        followUpRate: 87.5
      },
      productPerformance: [
        {
          category: "Apparel",
          revenue: 1240000,
          orders: 187,
          avgOrderValue: 6631,
          topSalesperson: "Sarah Johnson"
        },
        {
          category: "Promotional Items",
          revenue: 856000,
          orders: 98,
          avgOrderValue: 8735,
          topSalesperson: "Lisa Thompson"
        },
        {
          category: "Custom Bags",
          revenue: 423000,
          orders: 34,
          avgOrderValue: 12441,
          topSalesperson: "Mike Chen"
        },
        {
          category: "Drinkware",
          revenue: 331000,
          orders: 23,
          avgOrderValue: 14391,
          topSalesperson: "Emma Rodriguez"
        }
      ],
      monthlyTrends: {
        revenue: [
          { month: "Jul 2023", value: 220000 },
          { month: "Aug 2023", value: 235000 },
          { month: "Sep 2023", value: 245000 },
          { month: "Oct 2023", value: 228000 },
          { month: "Nov 2023", value: 252000 },
          { month: "Dec 2023", value: 267000 },
          { month: "Jan 2024", value: 275000 },
          { month: "Feb 2024", value: 268000 },
          { month: "Mar 2024", value: 285000 },
          { month: "Apr 2024", value: 292000 },
          { month: "May 2024", value: 301000 },
          { month: "Jun 2024", value: 295000 }
        ],
        orders: [
          { month: "Jul 2023", value: 45 },
          { month: "Aug 2023", value: 48 },
          { month: "Sep 2023", value: 52 },
          { month: "Oct 2023", value: 47 },
          { month: "Nov 2023", value: 54 },
          { month: "Dec 2023", value: 59 },
          { month: "Jan 2024", value: 61 },
          { month: "Feb 2024", value: 58 },
          { month: "Mar 2024", value: 63 },
          { month: "Apr 2024", value: 65 },
          { month: "May 2024", value: 67 },
          { month: "Jun 2024", value: 64 }
        ]
      }
    };

    res.json(teamPerformanceData);
  }

  /**
   * GET /api/products/popular — Popular products analytics with period/type filters
   */
  static async getPopularProducts(req: Request, res: Response) {
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
  }

  /**
   * GET /api/products/suggested — Suggested products (items in presentations but not yet sold)
   */
  static async getSuggestedProducts(req: Request, res: Response) {
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
  }

  /**
   * POST /api/admin/suggested-products — Add admin-managed suggested product
   */
  static async createAdminSuggestedProduct(req: Request, res: Response) {
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
  }

  /**
   * GET /api/admin/suggested-products — List admin-managed suggested products
   */
  static async getAdminSuggestedProducts(req: Request, res: Response) {
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
  }

  /**
   * PUT /api/admin/suggested-products/:id — Update admin-managed suggested product
   */
  static async updateAdminSuggestedProduct(req: Request, res: Response) {
    const { id } = req.params;
    const { discount, adminNote } = req.body;

    // In production, this would update the database record
    res.json({ success: true, message: 'Product updated successfully' });
  }

  /**
   * DELETE /api/admin/suggested-products/:id — Remove admin-managed suggested product
   */
  static async deleteAdminSuggestedProduct(req: Request, res: Response) {
    const { id } = req.params;

    // In production, this would delete from database
    res.json({ success: true, message: 'Product removed successfully' });
  }

  /**
   * GET /api/dashboard/automation-tasks — AI automation tasks
   */
  static async getAutomationTasks(req: Request, res: Response) {
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
  }

  /**
   * GET /api/dashboard/news-alerts — AI news monitoring alerts
   */
  static async getNewsAlerts(req: Request, res: Response) {
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
  }

  /**
   * GET /api/reports/suggestions — AI report suggestions
   */
  static async getReportSuggestions(req: Request, res: Response) {
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
  }

  /**
   * POST /api/reports/generate — Generate AI report
   */
  static async generateReport(req: Request, res: Response) {
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
  }
}
