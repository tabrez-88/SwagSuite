import type { Request, Response } from "express";
import { orderRepository } from "../repositories/order.repository";
import { userRepository } from "../repositories/user.repository";
import { productionRepository } from "../repositories/production.repository";
import { companyRepository } from "../repositories/company.repository";
import { productRepository } from "../repositories/product.repository";
import { activityRepository } from "../repositories/activity.repository";

export class ProductionController {
  // GET /api/production/orders
  static async listOrders(req: Request, res: Response) {
    const orders = await orderRepository.getOrders();

    const productionOrders = await Promise.all(orders.map(async (order) => {
      const company = order.companyId ? await companyRepository.getById(order.companyId) : null;
      const items = await orderRepository.getOrderItems(order.id);
      const user = order.assignedUserId ? await userRepository.getUser(order.assignedUserId) : null;

      // Calculate total quantity and primary product
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const firstProductId = items[0]?.productId;
      const primaryProduct = items.length > 0 && firstProductId
        ? (await productRepository.getById(firstProductId))?.name ?? "Unknown Product"
        : "No Products";
      const productName = items.length > 1 ? `${primaryProduct} + ${items.length - 1} more` : primaryProduct;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        companyName: company?.name || "Unknown Company",
        productName: productName,
        quantity: totalQuantity,
        currentStage: (order as any).currentStage || 'sales-booked',
        assignedTo: user ? `${user.firstName} ${user.lastName}` : "Unassigned",
        nextActionDate: order.inHandsDate ? order.inHandsDate.toISOString() : undefined,
        stagesCompleted: (order as any).stagesCompleted || ['sales-booked'],
        priority: (order as any).priority || 'medium',
        dueDate: order.inHandsDate ? order.inHandsDate.toISOString() : undefined,
        orderValue: parseFloat(order.total || "0"),
        stageData: (order as any).stageData || {},
        trackingNumber: order.trackingNumber || undefined
      };
    }));

    res.json(productionOrders);
  }

  // PATCH /api/orders/:id/production
  static async updateProduction(req: Request, res: Response) {
    const { currentStage, stagesCompleted, stageData, status, trackingNumber, customNotes, nextActionDate, nextActionType, nextActionNotes } = req.body;

    const updateData: any = {};
    if (currentStage) updateData.currentStage = currentStage;
    if (stagesCompleted) updateData.stagesCompleted = stagesCompleted;
    if (stageData) updateData.stageData = stageData;
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (customNotes !== undefined) updateData.customNotes = customNotes;
    // Save next action fields to proper columns for notification scheduler
    if (nextActionDate !== undefined) updateData.nextActionDate = nextActionDate ? new Date(nextActionDate) : null;
    if (nextActionType !== undefined) updateData.nextActionType = nextActionType || null;
    if (nextActionNotes !== undefined) updateData.nextActionNotes = nextActionNotes || null;

    const order = await orderRepository.updateOrder(req.params.id, updateData);

    // Log activity
    await activityRepository.createActivity({
      userId: (req.user as any)?.id,
      entityType: 'order',
      entityId: order.id,
      action: 'stage_updated',
      description: `Updated production stage to: ${currentStage || order.status}`,
    });

    res.json(order);
  }

  // GET /api/production/stages
  static async listStages(req: Request, res: Response) {
    const stages = await productionRepository.getProductionStages();
    res.json(stages);
  }

  // POST /api/production/stages
  static async createStage(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can create production stages" });
    }

    const { name, description, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Stage name is required' });
    }
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existingStages = await productionRepository.getProductionStages();
    const maxOrder = existingStages.reduce((max, s) => Math.max(max, s.order), 0);

    const stage = await productionRepository.createProductionStage({
      id,
      name,
      description: description || null,
      color: color || 'bg-gray-100 text-gray-800',
      icon: icon || 'Package',
      order: maxOrder + 1,
    });
    res.json(stage);
  }

  // PUT /api/production/stages/:id
  static async updateStage(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can update production stages" });
    }

    const { name, description, color, icon } = req.body;
    const stage = await productionRepository.updateProductionStage(req.params.id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(icon && { icon }),
    });
    res.json(stage);
  }

  // DELETE /api/production/stages/:id
  static async deleteStage(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can delete production stages" });
    }

    await productionRepository.deleteProductionStage(req.params.id);
    res.json({ success: true });
  }

  // POST /api/production/stages/reorder
  static async reorderStages(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can reorder production stages" });
    }

    const { stageIds } = req.body;
    if (!Array.isArray(stageIds)) {
      return res.status(400).json({ message: 'stageIds array is required' });
    }
    const stages = await productionRepository.reorderProductionStages(stageIds);
    res.json(stages);
  }

  // POST /api/production/stages/reset
  static async resetStages(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can reset production stages" });
    }

    const { db: database } = await import("../db");
    const { productionStages } = await import("@shared/schema");
    await database.delete(productionStages);
    await productionRepository.seedDefaultProductionStages();
    const stages = await productionRepository.getProductionStages();
    res.json(stages);
  }

  // GET /api/production/next-action-types
  static async listNextActionTypes(req: Request, res: Response) {
    const types = await productionRepository.getNextActionTypes();
    res.json(types);
  }

  // POST /api/production/next-action-types
  static async createNextActionType(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can create next action types" });
    }

    const { name, description, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Action type name is required' });
    }
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const existingTypes = await productionRepository.getNextActionTypes();
    const maxOrder = existingTypes.reduce((max: number, t: any) => Math.max(max, t.order), 0);

    const actionType = await productionRepository.createNextActionType({
      id,
      name,
      description: description || null,
      color: color || 'bg-gray-100 text-gray-800',
      icon: icon || 'ClipboardList',
      order: maxOrder + 1,
    });
    res.json(actionType);
  }

  // PUT /api/production/next-action-types/:id
  static async updateNextActionType(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can update next action types" });
    }

    const { name, description, color, icon } = req.body;
    const actionType = await productionRepository.updateNextActionType(req.params.id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(icon && { icon }),
    });
    res.json(actionType);
  }

  // DELETE /api/production/next-action-types/:id
  static async deleteNextActionType(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can delete next action types" });
    }

    await productionRepository.deleteNextActionType(req.params.id);
    res.json({ success: true });
  }

  // POST /api/production/next-action-types/reorder
  static async reorderNextActionTypes(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can reorder next action types" });
    }

    const { typeIds } = req.body;
    if (!Array.isArray(typeIds)) {
      return res.status(400).json({ message: 'typeIds array is required' });
    }
    const types = await productionRepository.reorderNextActionTypes(typeIds);
    res.json(types);
  }

  // POST /api/production/next-action-types/reset
  static async resetNextActionTypes(req: Request, res: Response) {
    const currentUser = await userRepository.getUser((req as any).user.claims.sub);
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can reset next action types" });
    }

    const { db: database } = await import("../db");
    const { nextActionTypes } = await import("@shared/schema");
    await database.delete(nextActionTypes);
    await productionRepository.seedDefaultNextActionTypes();
    const types = await productionRepository.getNextActionTypes();
    res.json(types);
  }

  // GET /api/production/alerts
  static async getAlerts(req: Request, res: Response) {
    const { db: database } = await import("../db");
    const { generatedDocuments, orders, artworkItems, orderItems } = await import("@shared/schema");
    const { eq, and, sql, lt, inArray, isNull, not } = await import("drizzle-orm");
    const now = new Date();

    // 1. Overdue POs (open POs where order's inHandsDate < now)
    const overduePOsByInHands = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(generatedDocuments)
      .innerJoin(orders, eq(generatedDocuments.orderId, orders.id))
      .where(and(
        eq(generatedDocuments.documentType, "purchase_order"),
        not(inArray(sql`${generatedDocuments.metadata}->>'poStage'`, ["billed", "closed"])),
        lt(orders.inHandsDate, now)
      ));

    // 2. Overdue POs by next action date
    const overduePOsByNextAction = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(generatedDocuments)
      .innerJoin(orders, eq(generatedDocuments.orderId, orders.id))
      .where(and(
        eq(generatedDocuments.documentType, "purchase_order"),
        not(inArray(sql`${generatedDocuments.metadata}->>'poStage'`, ["billed", "closed"])),
        lt(orders.nextActionDate, now)
      ));

    // 3. POs in Problem status
    const problemPOs = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(generatedDocuments)
      .where(and(
        eq(generatedDocuments.documentType, "purchase_order"),
        sql`${generatedDocuments.metadata}->>'poStatus' = 'problem'`,
        not(inArray(sql`${generatedDocuments.metadata}->>'poStage'`, ["billed", "closed"]))
      ));

    // 4. POs in Follow Up status
    const followUpPOs = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(generatedDocuments)
      .where(and(
        eq(generatedDocuments.documentType, "purchase_order"),
        sql`${generatedDocuments.metadata}->>'poStatus' = 'follow_up'`,
        not(inArray(sql`${generatedDocuments.metadata}->>'poStage'`, ["billed", "closed"]))
      ));

    // 5. SOs in "client_approved" without any PO
    const sosWithoutPO = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(
        eq(orders.salesOrderStatus, "client_approved"),
        isNull(
          database
            .select({ id: generatedDocuments.id })
            .from(generatedDocuments)
            .where(and(
              eq(generatedDocuments.orderId, orders.id),
              eq(generatedDocuments.documentType, "purchase_order")
            ))
            .limit(1)
        )
      ));

    // 5b. Alternative: use NOT EXISTS subquery for SOs without PO
    const sosWithoutPOResult = await database.execute(sql`
      SELECT COUNT(*)::int as count FROM orders o
      WHERE o.sales_order_status = 'client_approved'
      AND NOT EXISTS (
        SELECT 1 FROM generated_documents gd
        WHERE gd.order_id = o.id AND gd.document_type = 'purchase_order'
      )
    `);

    // 6. Overdue proofs (active proofing past in-hands date)
    const overdueProofs = await database.execute(sql`
      SELECT COUNT(*)::int as count
      FROM artwork_items ai
      INNER JOIN order_items oi ON ai.order_item_id = oi.id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE ai.status IN ('awaiting_proof', 'proof_received', 'pending_approval', 'change_requested')
      AND o.in_hands_date < NOW()
    `);

    res.json({
      overduePOsByInHands: overduePOsByInHands[0]?.count ?? 0,
      overduePOsByNextAction: overduePOsByNextAction[0]?.count ?? 0,
      problemPOs: problemPOs[0]?.count ?? 0,
      followUpPOs: followUpPOs[0]?.count ?? 0,
      sosWithoutPO: (sosWithoutPOResult as any).rows?.[0]?.count ?? (sosWithoutPOResult as any)[0]?.count ?? 0,
      overdueProofs: (overdueProofs as any).rows?.[0]?.count ?? (overdueProofs as any)[0]?.count ?? 0,
    });
  }

  // GET /api/production/po-report
  static async getPoReport(req: Request, res: Response) {
    const { db: database } = await import("../db");
    const { sql } = await import("drizzle-orm");

    const {
      stage, status, vendorId, assigneeId, search,
      dateFrom, dateTo, dateType, proofStatus, productionStage,
      sortBy = 'created_at', sortOrder = 'desc',
      page = '1', limit = '50'
    } = req.query as Record<string, string>;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE conditions
    const conditions: string[] = ["gd.document_type = 'purchase_order'"];

    if (stage) {
      if (stage === 'open') {
        conditions.push(`gd.metadata->>'poStage' IN ('created','submitted','confirmed','shipped','ready_for_billing')`);
      } else if (stage === 'in_production') {
        conditions.push(`gd.metadata->>'poStage' IN ('created','submitted','confirmed')`);
      } else {
        conditions.push(`gd.metadata->>'poStage' = '${stage}'`);
      }
    }
    if (status) conditions.push(`gd.metadata->>'poStatus' = '${status}'`);
    if (vendorId) conditions.push(`gd.vendor_id = '${vendorId}'`);
    if (assigneeId) conditions.push(`o.assigned_user_id = '${assigneeId}'`);
    if (search) {
      conditions.push(`(
        gd.document_number ILIKE '%${search}%'
        OR o.order_number ILIKE '%${search}%'
        OR gd.vendor_name ILIKE '%${search}%'
        OR c.name ILIKE '%${search}%'
      )`);
    }
    if (dateFrom) {
      const dateCol = dateType === 'nextAction' ? 'o.next_action_date' : 'o.in_hands_date';
      conditions.push(`${dateCol} >= '${dateFrom}'`);
    }
    if (dateTo) {
      const dateCol = dateType === 'nextAction' ? 'o.next_action_date' : 'o.in_hands_date';
      conditions.push(`${dateCol} <= '${dateTo}'`);
    }
    // Filter by alert type (from clicking alert tiles)
    const alertFilter = req.query.alertFilter as string;
    if (alertFilter === 'overdue_in_hands') {
      conditions.push(`o.in_hands_date < NOW()`);
      conditions.push(`gd.metadata->>'poStage' NOT IN ('billed', 'closed')`);
    } else if (alertFilter === 'overdue_next_action') {
      conditions.push(`o.next_action_date < NOW()`);
      conditions.push(`gd.metadata->>'poStage' NOT IN ('billed', 'closed')`);
    } else if (alertFilter === 'problem') {
      conditions.push(`gd.metadata->>'poStatus' = 'problem'`);
    } else if (alertFilter === 'follow_up') {
      conditions.push(`gd.metadata->>'poStatus' = 'follow_up'`);
    }
    if (productionStage) {
      conditions.push(`o.current_stage = '${productionStage}'`);
    }
    if (proofStatus) {
      // Filter POs that have items with a specific proof status
      conditions.push(`EXISTS (
        SELECT 1 FROM order_items oi
        INNER JOIN artwork_items ai ON ai.order_item_id = oi.id
        WHERE oi.order_id = o.id
        AND (oi.supplier_id = gd.vendor_id OR gd.vendor_id IS NULL)
        AND ai.status = '${proofStatus}'
      )`);
    }

    const whereClause = conditions.join(' AND ');

    // Determine sort column
    const sortMap: Record<string, string> = {
      created_at: 'gd.created_at',
      document_number: 'gd.document_number',
      order_number: 'o.order_number',
      vendor_name: 'gd.vendor_name',
      in_hands_date: 'o.in_hands_date',
      po_stage: "gd.metadata->>'poStage'",
      total: 'gd.metadata->>\'totalCost\'',
    };
    const sortCol = sortMap[sortBy] || 'gd.created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Main query — get POs with joined order/company/vendor/user data
    const result = await database.execute(sql.raw(`
      SELECT
        gd.id as "documentId",
        gd.document_number as "documentNumber",
        gd.order_id as "orderId",
        gd.vendor_id as "vendorId",
        gd.vendor_name as "vendorName",
        gd.file_url as "fileUrl",
        gd.status as "documentStatus",
        gd.sent_at as "sentAt",
        gd.metadata,
        gd.created_at as "createdAt",
        o.order_number as "orderNumber",
        o.in_hands_date as "inHandsDate",
        o.supplier_in_hands_date as "supplierInHandsDate",
        o.event_date as "eventDate",
        o.next_action_date as "nextActionDate",
        o.next_action_type as "nextActionType",
        o.next_action_notes as "nextActionNotes",
        o.is_firm as "isFirm",
        o.is_rush as "isRush",
        o.sales_order_status as "salesOrderStatus",
        o.assigned_user_id as "assignedUserId",
        o.csr_user_id as "csrUserId",
        o.current_stage as "currentStage",
        o.stages_completed as "stagesCompleted",
        c.name as "companyName",
        c.id as "companyId",
        COALESCE(u_assigned.first_name || ' ' || u_assigned.last_name, u_assigned.username) as "assignedUserName",
        u_assigned.profile_image_url as "assignedUserImage",
        COALESCE(u_csr.first_name || ' ' || u_csr.last_name, u_csr.username) as "csrUserName",
        COALESCE((
          SELECT SUM(oil.quantity * oil.cost)
          FROM order_items oi2
          INNER JOIN order_item_lines oil ON oil.order_item_id = oi2.id
          WHERE oi2.order_id = gd.order_id
          AND (oi2.supplier_id = gd.vendor_id OR gd.vendor_id IS NULL)
        ), 0) as "poTotalCost"
      FROM generated_documents gd
      INNER JOIN orders o ON gd.order_id = o.id
      LEFT JOIN companies c ON o.company_id = c.id
      LEFT JOIN users u_assigned ON o.assigned_user_id = u_assigned.id
      LEFT JOIN users u_csr ON o.csr_user_id = u_csr.id
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${order} NULLS LAST
      LIMIT ${parseInt(limit)}
      OFFSET ${offset}
    `));

    // Count query for pagination
    const countResult = await database.execute(sql.raw(`
      SELECT COUNT(*)::int as total
      FROM generated_documents gd
      INNER JOIN orders o ON gd.order_id = o.id
      LEFT JOIN companies c ON o.company_id = c.id
      WHERE ${whereClause}
    `));

    const rows = (result as any).rows ?? result;
    const total = (countResult as any).rows?.[0]?.total ?? (countResult as any)[0]?.total ?? 0;

    // For each PO, get the aggregated proof status from artwork items
    const poIds = rows.map((r: any) => r.documentId);
    let proofData: Record<string, any> = {};

    if (poIds.length > 0) {
      // Get proof statuses per vendor (PO)
      const proofResult = await database.execute(sql.raw(`
        SELECT
          gd.id as "documentId",
          COALESCE(
            json_agg(
              json_build_object(
                'status', ai.status,
                'name', ai.name,
                'proofFilePath', ai.proof_file_path
              )
            ) FILTER (WHERE ai.id IS NOT NULL),
            '[]'::json
          ) as "proofItems"
        FROM generated_documents gd
        INNER JOIN orders o ON gd.order_id = o.id
        LEFT JOIN order_items oi ON oi.order_id = o.id AND (oi.supplier_id = gd.vendor_id OR gd.vendor_id IS NULL)
        LEFT JOIN artwork_items ai ON ai.order_item_id = oi.id
        WHERE gd.id IN (${poIds.map((id: string) => `'${id}'`).join(',')})
        GROUP BY gd.id
      `));
      const proofRows = (proofResult as any).rows ?? proofResult;
      for (const row of proofRows) {
        proofData[row.documentId] = row.proofItems;
      }
    }

    // Get shipment data per order
    let shipmentData: Record<string, any[]> = {};
    const orderIds = Array.from(new Set(rows.map((r: any) => r.orderId))) as string[];
    if (orderIds.length > 0) {
      const shipmentResult = await database.execute(sql.raw(`
        SELECT
          os.order_id as "orderId",
          os.carrier, os.tracking_number as "trackingNumber",
          os.status, os.ship_date as "shipDate",
          os.estimated_delivery as "estimatedDelivery",
          os.actual_delivery as "actualDelivery"
        FROM order_shipments os
        WHERE os.order_id IN (${(orderIds as string[]).map(id => `'${id}'`).join(',')})
        ORDER BY os.created_at DESC
      `));
      const shipRows = (shipmentResult as any).rows ?? shipmentResult;
      for (const row of shipRows) {
        if (!shipmentData[row.orderId]) shipmentData[row.orderId] = [];
        shipmentData[row.orderId].push(row);
      }
    }

    // Enrich rows
    const enrichedRows = rows.map((row: any) => {
      const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {});
      return {
        ...row,
        poStage: metadata.poStage || 'created',
        poStatus: metadata.poStatus || 'ok',
        totalCost: parseFloat(row.poTotalCost) || 0,
        itemCount: metadata.items?.length || 0,
        proofItems: proofData[row.documentId] || [],
        shipments: shipmentData[row.orderId] || [],
      };
    });

    res.json({
      data: enrichedRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  }

  // GET /api/production/po-report/:documentId
  static async getPoReportDetail(req: Request, res: Response) {
    const { db: database } = await import("../db");
    const { sql } = await import("drizzle-orm");
    const { documentId } = req.params;

    // Get full PO detail
    const result = await database.execute(sql.raw(`
      SELECT
        gd.*,
        o.order_number, o.in_hands_date, o.supplier_in_hands_date, o.event_date,
        o.next_action_date, o.next_action_type, o.next_action_notes, o.is_firm, o.is_rush,
        o.sales_order_status, o.assigned_user_id, o.csr_user_id,
        o.shipping_address, o.billing_address, o.payment_terms,
        o.notes as order_notes, o.supplier_notes,
        c.name as company_name, c.id as company_id,
        s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone,
        s.contact_person as supplier_contact,
        COALESCE(u_assigned.first_name || ' ' || u_assigned.last_name, u_assigned.username) as assigned_user_name,
        COALESCE(u_csr.first_name || ' ' || u_csr.last_name, u_csr.username) as csr_user_name
      FROM generated_documents gd
      INNER JOIN orders o ON gd.order_id = o.id
      LEFT JOIN companies c ON o.company_id = c.id
      LEFT JOIN suppliers s ON gd.vendor_id = s.id
      LEFT JOIN users u_assigned ON o.assigned_user_id = u_assigned.id
      LEFT JOIN users u_csr ON o.csr_user_id = u_csr.id
      WHERE gd.id = '${documentId}'
    `));

    const rows = (result as any).rows ?? result;
    if (rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    const doc = rows[0];
    const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {});

    // Get order items for this vendor
    const itemsResult = await database.execute(sql.raw(`
      SELECT oi.*, p.name as product_name, p.sku as product_sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = '${doc.order_id}'
      AND (oi.supplier_id = '${doc.vendor_id}' OR '${doc.vendor_id}' = 'null')
    `));

    // Get artwork/proof items
    const artworkResult = await database.execute(sql.raw(`
      SELECT ai.*, oi.product_id
      FROM artwork_items ai
      INNER JOIN order_items oi ON ai.order_item_id = oi.id
      WHERE oi.order_id = '${doc.order_id}'
      AND (oi.supplier_id = '${doc.vendor_id}' OR '${doc.vendor_id}' = 'null')
      ORDER BY ai.created_at
    `));

    // Get shipments
    const shipmentsResult = await database.execute(sql.raw(`
      SELECT * FROM order_shipments
      WHERE order_id = '${doc.order_id}'
      ORDER BY created_at DESC
    `));

    // Get activity log for this order
    const activitiesResult = await database.execute(sql.raw(`
      SELECT pa.*, COALESCE(u.first_name || ' ' || u.last_name, u.username) as user_name
      FROM project_activities pa
      LEFT JOIN users u ON pa.user_id = u.id
      WHERE pa.order_id = '${doc.order_id}'
      ORDER BY pa.created_at DESC
      LIMIT 20
    `));

    res.json({
      ...doc,
      metadata,
      poStage: metadata.poStage || 'created',
      poStatus: metadata.poStatus || 'ok',
      totalCost: metadata.totalCost || 0,
      items: (itemsResult as any).rows ?? itemsResult,
      artworkItems: (artworkResult as any).rows ?? artworkResult,
      shipments: (shipmentsResult as any).rows ?? shipmentsResult,
      activities: (activitiesResult as any).rows ?? activitiesResult,
    });
  }
}
