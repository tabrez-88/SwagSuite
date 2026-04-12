import type { Request, Response } from "express";
import { projectRepository } from "../repositories/project.repository";
import { userRepository } from "../repositories/user.repository";
import { productionRepository } from "../repositories/production.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { getUserId } from "../utils/getUserId";

export class ApprovalController {
  // =====================================================
  // GROUP 1: ARTWORK APPROVALS (public endpoints)
  // =====================================================

  /** GET /api/approvals/:token — Get artwork approval details (PUBLIC) */
  static async getArtworkApproval(req: Request, res: Response) {
    const { token } = req.params;

    const { db } = await import("../db");
    const { artworkApprovals, artworkItems, orders, orderItems, products, companies } = await import("@shared/schema");
    const { eq, and, desc } = await import("drizzle-orm");

    const [approval] = await db
      .select({
        id: artworkApprovals.id,
        orderId: artworkApprovals.orderId,
        orderItemId: artworkApprovals.orderItemId,
        artworkFileId: artworkApprovals.artworkFileId,
        artworkItemId: artworkApprovals.artworkItemId,
        approvalToken: artworkApprovals.approvalToken,
        status: artworkApprovals.status,
        approvedAt: artworkApprovals.approvedAt,
        declinedAt: artworkApprovals.declinedAt,
        declineReason: artworkApprovals.declineReason,
        pdfPath: artworkApprovals.pdfPath,
        clientName: artworkApprovals.clientName,
        sentAt: artworkApprovals.sentAt,
        orderNumber: orders.orderNumber,
        companyId: orders.companyId,
        companyName: companies.name,
        productName: products.name,
        productSku: products.sku,
        productImageUrl: products.imageUrl,
        itemQuantity: orderItems.quantity,
        itemColor: orderItems.color,
        itemSize: orderItems.size,
      })
      .from(artworkApprovals)
      .leftJoin(orders, eq(artworkApprovals.orderId, orders.id))
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .leftJoin(orderItems, eq(artworkApprovals.orderItemId, orderItems.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(artworkApprovals.approvalToken, token));

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    // Fetch artwork items — specific one if artworkItemId set, else all for orderItem
    let artworkDetails: any[] = [];
    if (approval.artworkItemId) {
      artworkDetails = await db
        .select()
        .from(artworkItems)
        .where(eq(artworkItems.id, approval.artworkItemId));
    } else if (approval.orderItemId) {
      artworkDetails = await db
        .select()
        .from(artworkItems)
        .where(eq(artworkItems.orderItemId, approval.orderItemId));
    }

    // Fetch approval history for this order item (previous approvals)
    let approvalHistory: any[] = [];
    if (approval.orderItemId) {
      approvalHistory = await db
        .select({
          id: artworkApprovals.id,
          status: artworkApprovals.status,
          approvedAt: artworkApprovals.approvedAt,
          declinedAt: artworkApprovals.declinedAt,
          declineReason: artworkApprovals.declineReason,
          clientName: artworkApprovals.clientName,
          sentAt: artworkApprovals.sentAt,
          createdAt: artworkApprovals.createdAt,
        })
        .from(artworkApprovals)
        .where(and(
          eq(artworkApprovals.orderItemId, approval.orderItemId),
          eq(artworkApprovals.orderId, approval.orderId)
        ))
        .orderBy(desc(artworkApprovals.createdAt));
    }

    // Format response
    const response = {
      id: approval.id,
      orderId: approval.orderId,
      orderItemId: approval.orderItemId,
      artworkFileId: approval.artworkFileId,
      approvalToken: approval.approvalToken,
      status: approval.status,
      artworkUrl: approval.pdfPath,
      approvedAt: approval.approvedAt,
      rejectedAt: approval.declinedAt,
      comments: approval.declineReason,
      clientName: approval.clientName,
      sentAt: approval.sentAt,
      order: {
        orderNumber: approval.orderNumber,
        companyName: approval.companyName || "Individual Client",
      },
      orderItem: {
        productName: approval.productName || "Product",
        productSku: approval.productSku,
        quantity: approval.itemQuantity || 0,
        color: approval.itemColor,
        size: approval.itemSize,
        imageUrl: approval.productImageUrl,
      },
      artworkDetails: artworkDetails.map((art: any) => ({
        id: art.id,
        name: art.name,
        artworkType: art.artworkType,
        location: art.location,
        color: art.color,
        size: art.size,
        status: art.status,
        filePath: art.filePath,
        fileName: art.fileName,
        proofFilePath: art.proofFilePath,
        proofFileName: art.proofFileName,
        notes: art.notes,
      })),
      approvalHistory: approvalHistory
        .filter((h: any) => h.id !== approval.id) // exclude current
        .map((h: any) => ({
          id: h.id,
          status: h.status,
          approvedAt: h.approvedAt,
          declinedAt: h.declinedAt,
          declineReason: h.declineReason,
          clientName: h.clientName,
          sentAt: h.sentAt,
          createdAt: h.createdAt,
        })),
    };

    res.json(response);
  }

  /** POST /api/approvals/:token/approve — Approve artwork (PUBLIC) */
  static async approveArtwork(req: Request, res: Response) {
    const { token } = req.params;
    const { comments } = req.body;

    const { db } = await import("../db");
    const { artworkApprovals } = await import("@shared/schema");
    const { projectActivities } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    // Get approval
    const [approval] = await db
      .select()
      .from(artworkApprovals)
      .where(eq(artworkApprovals.approvalToken, token));

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    if (approval.status !== "pending") {
      return res.status(400).json({ message: "This approval has already been processed" });
    }

    // Update approval status
    const [updated] = await db
      .update(artworkApprovals)
      .set({
        status: "approved",
        approvedAt: new Date(),
        declineReason: comments || null,
        updatedAt: new Date(),
      })
      .where(eq(artworkApprovals.id, approval.id))
      .returning();

    // Auto-update specific artworkItem proof status to "approved"
    if (approval.orderItemId) {
      try {
        const { artworkItems } = await import("@shared/schema");
        const { and } = await import("drizzle-orm");
        if (approval.artworkItemId) {
          // Update only the specific artwork item
          await db
            .update(artworkItems)
            .set({ status: "approved", updatedAt: new Date() })
            .where(and(
              eq(artworkItems.id, approval.artworkItemId),
              eq(artworkItems.status, "pending_approval")
            ));
        } else {
          // Legacy fallback: no specific artwork ID, update all pending_approval for this orderItem
          await db
            .update(artworkItems)
            .set({ status: "approved", updatedAt: new Date() })
            .where(and(
              eq(artworkItems.orderItemId, approval.orderItemId),
              eq(artworkItems.status, "pending_approval")
            ));
        }
      } catch (artErr) {
        console.error('Error auto-updating artwork status:', artErr);
      }
    }

    // Create activity log and handle notifications + stage progression
    if (approval.orderId) {
      try {
        const approvalOrder = await projectRepository.getOrder(approval.orderId);
        if (approvalOrder?.assignedUserId) {
          await db.insert(projectActivities).values({
            orderId: approval.orderId,
            userId: approvalOrder.assignedUserId,
            activityType: "artwork_approved",
            content: `Artwork approved by client${comments ? `: ${comments}` : ''}`,
            metadata: {
              approvalId: approval.id,
              clientEmail: approval.clientEmail,
              orderItemId: approval.orderItemId,
            },
            mentionedUsers: [],
            isSystemGenerated: true,
          });
        }
      } catch (err) {
        console.error('Error creating activity:', err);
      }

      // Notify sales rep and CSR + auto-advance stage
      try {
        const { orders } = await import("@shared/schema");
        const [order] = await db.select().from(orders).where(eq(orders.id, approval.orderId));

        if (order) {
          const usersToNotify: string[] = [];
          if (order.assignedUserId) usersToNotify.push(order.assignedUserId);
          if (order.csrUserId && !usersToNotify.includes(order.csrUserId)) usersToNotify.push(order.csrUserId);

          if (usersToNotify.length > 0) {
            await notificationRepository.createForMultipleUsers(usersToNotify, {
              type: 'artwork_approved',
              title: 'Artwork Approved',
              message: `Client ${approval.clientEmail} has approved the artwork for order #${order.orderNumber}`,
              orderId: order.id,
            });

            // Send email notifications
            try {
              const { emailService } = await import("../services/email.service");
              for (const userId of usersToNotify) {
                const user = await userRepository.getUser(userId);
                if (user?.email) {
                  await emailService.sendEmail({
                    to: user.email,
                    subject: `\u2705 Artwork Approved - Order #${order.orderNumber}`,
                    html: `
                      <h2>Artwork Approved</h2>
                      <p>Great news! The client has approved the artwork.</p>
                      <ul>
                        <li><strong>Order:</strong> #${order.orderNumber}</li>
                        <li><strong>Approved By:</strong> ${approval.clientEmail}</li>
                        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                      </ul>
                      <p>You can now proceed with production.</p>
                    `,
                  });
                }
              }
            } catch (emailErr) {
              console.error("Failed to send artwork approval emails:", emailErr);
            }
          }

          // Auto-advance production stage to proof-approved
          const stagesCompleted = Array.isArray((order as any).stagesCompleted) ? (order as any).stagesCompleted : ['sales-booked'];
          if (!stagesCompleted.includes('in_production')) {
            const updatedCompleted = Array.from(new Set([...stagesCompleted, 'confirmed', 'in_production']));
            const allStages = await productionRepository.getProductionStages();
            const proofApprovedStage = allStages.find(s => s.id === 'in_production');
            const nextStage = proofApprovedStage ? allStages.find(s => s.order === proofApprovedStage.order + 1) : null;

            await projectRepository.updateOrder(order.id, {
              currentStage: nextStage ? nextStage.id : 'in_production',
              stagesCompleted: updatedCompleted,
            } as any);
          }
        }
      } catch (notifyErr) {
        console.error("Error in post-approval processing:", notifyErr);
      }
    }

    res.json({ success: true, approval: updated });
  }

  /** POST /api/approvals/:token/reject — Reject artwork (PUBLIC) */
  static async rejectArtwork(req: Request, res: Response) {
    const { token } = req.params;
    const { comments } = req.body;

    if (!comments || !comments.trim()) {
      return res.status(400).json({ message: "Comments are required for rejection" });
    }

    const { db } = await import("../db");
    const { artworkApprovals } = await import("@shared/schema");
    const { projectActivities } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    // Get approval
    const [approval] = await db
      .select()
      .from(artworkApprovals)
      .where(eq(artworkApprovals.approvalToken, token));

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    if (approval.status !== "pending") {
      return res.status(400).json({ message: "This approval has already been processed" });
    }

    // Update approval status
    const [updated] = await db
      .update(artworkApprovals)
      .set({
        status: "declined",
        declinedAt: new Date(),
        declineReason: comments,
        updatedAt: new Date(),
      })
      .where(eq(artworkApprovals.id, approval.id))
      .returning();

    // Auto-update specific artworkItem proof status to "change_requested"
    if (approval.orderItemId) {
      try {
        const { artworkItems } = await import("@shared/schema");
        const { and } = await import("drizzle-orm");
        if (approval.artworkItemId) {
          // Update only the specific artwork item
          await db
            .update(artworkItems)
            .set({ status: "change_requested", updatedAt: new Date() })
            .where(and(
              eq(artworkItems.id, approval.artworkItemId),
              eq(artworkItems.status, "pending_approval")
            ));
        } else {
          // Legacy fallback: update all pending_approval for this orderItem
          await db
            .update(artworkItems)
            .set({ status: "change_requested", updatedAt: new Date() })
            .where(and(
              eq(artworkItems.orderItemId, approval.orderItemId),
              eq(artworkItems.status, "pending_approval")
            ));
        }
      } catch (artErr) {
        console.error('Error auto-updating artwork status:', artErr);
      }
    }

    // Create activity log and notify team
    if (approval.orderId) {
      try {
        const declineOrder = await projectRepository.getOrder(approval.orderId);
        if (declineOrder?.assignedUserId) {
          await db.insert(projectActivities).values({
            orderId: approval.orderId,
            userId: declineOrder.assignedUserId,
            activityType: "artwork_rejected",
            content: `Artwork revision requested by client: ${comments}`,
            metadata: {
              approvalId: approval.id,
              clientEmail: approval.clientEmail,
              orderItemId: approval.orderItemId,
            },
            mentionedUsers: [],
            isSystemGenerated: true,
          });
        }
      } catch (err) {
        console.error('Error creating activity:', err);
      }

      // Notify sales rep and CSR
      try {
        const { orders } = await import("@shared/schema");
        const [order] = await db.select().from(orders).where(eq(orders.id, approval.orderId));
        if (order) {
          const usersToNotify: string[] = [];
          if (order.assignedUserId) usersToNotify.push(order.assignedUserId);
          if (order.csrUserId && !usersToNotify.includes(order.csrUserId)) usersToNotify.push(order.csrUserId);

          if (usersToNotify.length > 0) {
            await notificationRepository.createForMultipleUsers(usersToNotify, {
              type: 'artwork_declined',
              title: 'Artwork Revision Requested',
              message: `Client ${approval.clientEmail} has requested revisions for order #${order.orderNumber}: ${comments}`,
              orderId: order.id,
            });

            try {
              const { emailService } = await import("../services/email.service");
              for (const userId of usersToNotify) {
                const user = await userRepository.getUser(userId);
                if (user?.email) {
                  await emailService.sendEmail({
                    to: user.email,
                    subject: `\u26a0\ufe0f Artwork Revision Requested - Order #${order.orderNumber}`,
                    html: `
                      <h2>Artwork Revision Requested</h2>
                      <p>The client has requested revisions to the artwork.</p>
                      <ul>
                        <li><strong>Order:</strong> #${order.orderNumber}</li>
                        <li><strong>Client:</strong> ${approval.clientEmail}</li>
                        <li><strong>Comments:</strong> ${comments}</li>
                      </ul>
                      <p>Please review the feedback and prepare revised artwork.</p>
                    `,
                  });
                }
              }
            } catch (emailErr) {
              console.error("Failed to send artwork rejection emails:", emailErr);
            }
          }
        }
      } catch (notifyErr) {
        console.error("Error in post-rejection processing:", notifyErr);
      }
    }

    res.json({ success: true, approval: updated });
  }

  /** POST /api/projects/:projectId/generate-approval — Generate approval link (AUTHENTICATED) */
  static async generateApproval(req: Request, res: Response) {
    const { projectId } = req.params;
    const { orderItemId, artworkFileId, artworkItemId, clientEmail, clientName } = req.body;

    if (!clientEmail) {
      return res.status(400).json({ message: "Client email is required" });
    }

    const { db } = await import("../db");
    const { artworkApprovals, orders } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    const crypto = await import("crypto");

    // Verify order exists
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, projectId));

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Check if approval already exists for this combination
    let conditions = [
      eq(artworkApprovals.orderId, projectId),
      eq(artworkApprovals.clientEmail, clientEmail),
    ];

    if (orderItemId) {
      conditions.push(eq(artworkApprovals.orderItemId, orderItemId));
    }

    if (artworkItemId) {
      conditions.push(eq(artworkApprovals.artworkItemId, artworkItemId));
    } else if (artworkFileId) {
      conditions.push(eq(artworkApprovals.artworkFileId, artworkFileId));
    }

    const [existing] = await db
      .select()
      .from(artworkApprovals)
      .where(and(...conditions));

    if (existing && existing.status === "pending") {
      // Return existing pending approval
      return res.json({
        ...existing,
        approvalUrl: `${req.protocol}://${req.get('host')}/approve/${existing.approvalToken}`
      });
    }

    // Create new approval
    const [newApproval] = await db
      .insert(artworkApprovals)
      .values({
        orderId: projectId,
        orderItemId: orderItemId || null,
        artworkFileId: artworkFileId || null,
        artworkItemId: artworkItemId || null,
        approvalToken: token,
        status: "pending",
        clientEmail,
        clientName: clientName || null,
        sentAt: new Date(),
      })
      .returning();

    // Auto-update order status to pending_approval when approval link is generated
    if (order.status === 'quote' || order.status === 'in_production') {
      await db
        .update(orders)
        .set({ status: 'pending_approval', updatedAt: new Date() })
        .where(eq(orders.id, projectId));
    }

    res.json({
      ...newApproval,
      approvalUrl: `${req.protocol}://${req.get('host')}/approval/${token}`
    });
  }

  /** GET /api/projects/:projectId/approvals — List all approvals for an order (AUTHENTICATED) */
  static async listOrderApprovals(req: Request, res: Response) {
    const { projectId } = req.params;

    const { db } = await import("../db");
    const { artworkApprovals, orderItems, products, artworkFiles } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const approvals = await db
      .select({
        id: artworkApprovals.id,
        orderId: artworkApprovals.orderId,
        orderItemId: artworkApprovals.orderItemId,
        artworkFileId: artworkApprovals.artworkFileId,
        artworkItemId: artworkApprovals.artworkItemId,
        approvalToken: artworkApprovals.approvalToken,
        status: artworkApprovals.status,
        clientEmail: artworkApprovals.clientEmail,
        clientName: artworkApprovals.clientName,
        sentAt: artworkApprovals.sentAt,
        approvedAt: artworkApprovals.approvedAt,
        declinedAt: artworkApprovals.declinedAt,
        declineReason: artworkApprovals.declineReason,
        pdfPath: artworkApprovals.pdfPath,
        reminderSentAt: artworkApprovals.reminderSentAt,
        productName: products.name,
        artworkFileName: artworkFiles.fileName,
        artworkOriginalName: artworkFiles.originalName,
      })
      .from(artworkApprovals)
      .leftJoin(orderItems, eq(artworkApprovals.orderItemId, orderItems.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(artworkFiles, eq(artworkApprovals.artworkFileId, artworkFiles.id))
      .where(eq(artworkApprovals.orderId, projectId));

    res.json(approvals);
  }

  // =====================================================
  // GROUP 2: CLIENT APPROVALS (quote/SO approval, public)
  // =====================================================

  /** GET /api/client-approvals/:token — Get approval details (PUBLIC) */
  static async getClientApproval(req: Request, res: Response) {
    const { token } = req.params;

    const { db } = await import("../db");
    const { quoteApprovals, orders, companies, orderItems, products, generatedDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const [approval] = await db
      .select({
        id: quoteApprovals.id,
        orderId: quoteApprovals.orderId,
        approvalToken: quoteApprovals.approvalToken,
        status: quoteApprovals.status,
        clientEmail: quoteApprovals.clientEmail,
        clientName: quoteApprovals.clientName,
        quoteTotal: quoteApprovals.quoteTotal,
        sentAt: quoteApprovals.sentAt,
        viewedAt: quoteApprovals.viewedAt,
        approvedAt: quoteApprovals.approvedAt,
        declinedAt: quoteApprovals.declinedAt,
        declineReason: quoteApprovals.declineReason,
        approvalNotes: quoteApprovals.approvalNotes,
        pdfPath: quoteApprovals.pdfPath,
        orderNumber: orders.orderNumber,
        orderTotal: orders.total,
        companyName: companies.name,
        inHandsDate: orders.inHandsDate,
        salesOrderStatus: orders.salesOrderStatus,
        documentType: generatedDocuments.documentType,
      })
      .from(quoteApprovals)
      .leftJoin(orders, eq(quoteApprovals.orderId, orders.id))
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .leftJoin(generatedDocuments, eq(quoteApprovals.documentId, generatedDocuments.id))
      .where(eq(quoteApprovals.approvalToken, token));

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    // Mark as viewed if first time
    if (!approval.viewedAt) {
      await db
        .update(quoteApprovals)
        .set({ viewedAt: new Date(), updatedAt: new Date() })
        .where(eq(quoteApprovals.approvalToken, token));
    }

    // Get order items for this quote
    const items = await db
      .select({
        id: orderItems.id,
        productName: products.name,
        productSku: products.sku,
        productImageUrl: products.imageUrl,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        color: orderItems.color,
        size: orderItems.size,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, approval.orderId));

    // Determine document type: from document join, or fallback to order's salesOrderStatus
    const resolvedDocType = approval.documentType
      || (approval.salesOrderStatus === "pending_client_approval" ? "sales_order" : "quote");

    const { salesOrderStatus: _sos, documentType: _dt, ...approvalData } = approval;
    res.json({
      ...approvalData,
      documentType: resolvedDocType,
      items,
    });
  }

  /** POST /api/client-approvals/:token/approve — Approve quote or sales order (PUBLIC) */
  static async approveClientApproval(req: Request, res: Response) {
    const { token } = req.params;
    const { notes, clientName } = req.body;

    const { db } = await import("../db");
    const { quoteApprovals, orders, users, generatedDocuments } = await import("@shared/schema");
    const { eq, or } = await import("drizzle-orm");

    // Get approval with document type
    const [approvalRow] = await db
      .select({
        approval: quoteApprovals,
        documentType: generatedDocuments.documentType,
      })
      .from(quoteApprovals)
      .leftJoin(generatedDocuments, eq(quoteApprovals.documentId, generatedDocuments.id))
      .where(eq(quoteApprovals.approvalToken, token));

    if (!approvalRow) {
      return res.status(404).json({ message: "Approval not found" });
    }

    const approval = approvalRow.approval;

    if (approval.status !== "pending") {
      return res.status(400).json({ message: "This has already been processed" });
    }

    // Update approval status
    const [updated] = await db
      .update(quoteApprovals)
      .set({
        status: "approved",
        approvedAt: new Date(),
        approvalNotes: notes || null,
        clientName: clientName || approval.clientName,
        updatedAt: new Date(),
      })
      .where(eq(quoteApprovals.approvalToken, token))
      .returning();

    // Update the document status to approved
    if (approval.documentId) {
      await db
        .update(generatedDocuments)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(generatedDocuments.id, approval.documentId));
    }

    // Get order details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, approval.orderId));

    if (order) {
      // Determine if SO approval: check document type OR fallback to order's salesOrderStatus
      const isSalesOrder = approvalRow.documentType === "sales_order"
        || order.salesOrderStatus === "pending_client_approval";
      const docLabel = isSalesOrder ? "Sales Order" : "Quote";

      // Per-project toggle: auto-approve SO when quote is approved (default: true)
      const stageData = typeof order.stageData === "string" ? JSON.parse(order.stageData) : (order.stageData || {});
      const autoApproveSo = stageData?.quoteAutoApproveSo !== false;

      if (isSalesOrder) {
        // SO approval: update salesOrderStatus to client_approved
        await db
          .update(orders)
          .set({
            salesOrderStatus: "client_approved",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      } else {
        // Quote approval: convert to sales order and move to production
        await db
          .update(orders)
          .set({
            orderType: "sales_order",
            status: "approved",
            currentStage: "po-sent",
            stagesCompleted: JSON.stringify([...JSON.parse(JSON.stringify(order.stagesCompleted || '["created"]')), "submitted"]),
            ...(autoApproveSo ? { salesOrderStatus: "client_approved" } : {}),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }

      // Log activity — use order's assigned user or CSR as the activity userId (public endpoint has no req.user)
      try {
        const { projectActivities } = await import("@shared/schema");
        const systemUserId = order.assignedUserId || order.csrUserId;
        if (systemUserId) {
          await db.insert(projectActivities).values({
            orderId: order.id,
            userId: systemUserId,
            activityType: "system_action",
            content: isSalesOrder
              ? `Sales Order approved by ${clientName || approval.clientName || approval.clientEmail}.${notes ? ` Client notes: ${notes}` : ''}`
              : `Quote approved by ${clientName || approval.clientName || approval.clientEmail}. Order converted to Sales Order${autoApproveSo ? ' (SO auto-approved)' : ''}.${notes ? ` Client notes: ${notes}` : ''}`,
            metadata: { action: isSalesOrder ? 'sales_order_approved' : 'quote_approved', approvalId: updated.id, clientName: clientName || approval.clientName, autoApproveSo: !isSalesOrder ? autoApproveSo : undefined },
            isSystemGenerated: true,
          });
        }
      } catch (activityError) {
        console.error("Failed to log approval activity:", activityError);
      }

      // Collect users to notify: sales rep and CSR
      const usersToNotify: string[] = [];
      if (order.assignedUserId) usersToNotify.push(order.assignedUserId);
      if (order.csrUserId && !usersToNotify.includes(order.csrUserId)) {
        usersToNotify.push(order.csrUserId);
      }

      // Create in-app notifications
      if (usersToNotify.length > 0) {
        await notificationRepository.createForMultipleUsers(usersToNotify, {
          type: isSalesOrder ? 'sales_order_approved' : 'quote_approved',
          title: isSalesOrder ? 'Sales Order Approved by Client' : 'Quote Approved - Ready for Production',
          message: `Client ${clientName || approval.clientName || approval.clientEmail} has approved ${docLabel.toLowerCase()} #${order.orderNumber}.${isSalesOrder ? '' : ' Order is now ready for production.'}`,
          orderId: order.id,
        });
      }

      // Send email notifications
      try {
        const { emailService } = await import("../services/email.service");

        for (const userId of usersToNotify) {
          const user = await userRepository.getUser(userId);
          if (user?.email) {
            await emailService.sendEmail({
              to: user.email,
              subject: isSalesOrder
                ? `\u2705 Sales Order Approved - Order #${order.orderNumber}`
                : `\u2705 Quote Approved - Order #${order.orderNumber} Ready for Production`,
              html: `
                <h2>${docLabel} Approved!</h2>
                <p>Great news! The client has approved the ${docLabel.toLowerCase()}${isSalesOrder ? '.' : ' and it\'s ready to be converted to a sales order.'}</p>
                <h3>Order Details:</h3>
                <ul>
                  <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                  <li><strong>Approved By:</strong> ${clientName || approval.clientName || approval.clientEmail}</li>
                  <li><strong>Approved At:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>Total:</strong> $${parseFloat(order.total || "0").toFixed(2)}</li>
                </ul>
                ${notes ? `<p><strong>Client Notes:</strong> ${notes}</p>` : ''}
                <p>${isSalesOrder ? 'The sales order has been marked as client approved.' : 'The order is now on the production kanban board waiting for PO processing.'}</p>
              `,
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send approval emails:", emailError);
      }
    }

    res.json({ success: true, approval: updated });
  }

  /** POST /api/client-approvals/:token/decline — Decline quote or sales order (PUBLIC) */
  static async declineClientApproval(req: Request, res: Response) {
    const { token } = req.params;
    const { reason, clientName } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Please provide a reason for declining" });
    }

    const { db } = await import("../db");
    const { quoteApprovals, orders, generatedDocuments } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    // Get approval with document type
    const [approvalRow] = await db
      .select({
        approval: quoteApprovals,
        documentType: generatedDocuments.documentType,
      })
      .from(quoteApprovals)
      .leftJoin(generatedDocuments, eq(quoteApprovals.documentId, generatedDocuments.id))
      .where(eq(quoteApprovals.approvalToken, token));

    if (!approvalRow) {
      return res.status(404).json({ message: "Approval not found" });
    }

    const approval = approvalRow.approval;

    if (approval.status !== "pending") {
      return res.status(400).json({ message: "This has already been processed" });
    }

    // Update approval status
    const [updated] = await db
      .update(quoteApprovals)
      .set({
        status: "declined",
        declinedAt: new Date(),
        declineReason: reason,
        clientName: clientName || approval.clientName,
        updatedAt: new Date(),
      })
      .where(eq(quoteApprovals.approvalToken, token))
      .returning();

    // Get order and notify sales rep
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, approval.orderId));

    if (order) {
      // Determine if SO: check document type OR fallback to order's salesOrderStatus
      const isSalesOrder = approvalRow.documentType === "sales_order"
        || order.salesOrderStatus === "pending_client_approval";
      const docLabel = isSalesOrder ? "Sales Order" : "Quote";

      // Update order status based on document type
      if (isSalesOrder) {
        await db
          .update(orders)
          .set({
            salesOrderStatus: "draft",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      } else {
        await db
          .update(orders)
          .set({
            status: "pending_approval",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }

      // Log activity — use order's assigned user (public endpoint has no req.user)
      try {
        const { projectActivities } = await import("@shared/schema");
        const systemUserId = order.assignedUserId || order.csrUserId;
        if (systemUserId) {
          await db.insert(projectActivities).values({
            orderId: order.id,
            userId: systemUserId,
            activityType: "system_action",
            content: `${docLabel} declined by ${clientName || approval.clientName || approval.clientEmail}. Reason: ${reason}`,
            metadata: { action: isSalesOrder ? 'sales_order_declined' : 'quote_declined', approvalId: updated.id, reason },
            isSystemGenerated: true,
          });
        }
      } catch (activityError) {
        console.error("Failed to log decline activity:", activityError);
      }

      // Notify sales rep
      const usersToNotify: string[] = [];
      if (order.assignedUserId) usersToNotify.push(order.assignedUserId);

      if (usersToNotify.length > 0) {
        await notificationRepository.createForMultipleUsers(usersToNotify, {
          type: isSalesOrder ? 'sales_order_declined' : 'quote_declined',
          title: `${docLabel} Declined`,
          message: `Client ${clientName || approval.clientName || approval.clientEmail} has declined ${docLabel.toLowerCase()} #${order.orderNumber}. Reason: ${reason}`,
          orderId: order.id,
        });
      }

      // Send email notification
      try {
        const { emailService } = await import("../services/email.service");

        for (const userId of usersToNotify) {
          const user = await userRepository.getUser(userId);
          if (user?.email) {
            await emailService.sendEmail({
              to: user.email,
              subject: `\u274c ${docLabel} Declined - Order #${order.orderNumber}`,
              html: `
                <h2>${docLabel} Declined</h2>
                <p>Unfortunately, the client has declined the ${docLabel.toLowerCase()}.</p>
                <h3>Order Details:</h3>
                <ul>
                  <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                  <li><strong>Declined By:</strong> ${clientName || approval.clientName || approval.clientEmail}</li>
                  <li><strong>Declined At:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>Please review and follow up with the client.</p>
              `,
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send decline emails:", emailError);
      }
    }

    res.json({ success: true, approval: updated });
  }

  /** GET /api/pdf-proxy — Proxy PDF for inline viewing (PUBLIC) */
  static async pdfProxy(req: Request, res: Response) {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Missing url parameter" });
    }
    // Only allow Cloudinary URLs for security
    if (!url.includes("cloudinary.com")) {
      return res.status(403).json({ message: "Only Cloudinary URLs are allowed" });
    }
    console.log("PDF proxy fetching:", url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error("PDF proxy upstream error:", response.status, response.statusText, "for URL:", url);
      return res.status(response.status).json({ message: "Failed to fetch PDF" });
    }
    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buffer));
  }

  // =====================================================
  // GROUP 3: QUOTE APPROVALS (authenticated, order-scoped)
  // =====================================================

  /** POST /api/projects/:projectId/quote-approvals — Create quote approval (AUTHENTICATED) */
  static async createQuoteApproval(req: Request, res: Response) {
    const { projectId } = req.params;
    const { clientEmail, clientName, documentId, pdfPath, quoteTotal } = req.body;

    const { db } = await import("../db");
    const { quoteApprovals, orders } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const crypto = await import("crypto");

    // Verify order exists
    const [order] = await db.select().from(orders).where(eq(orders.id, projectId));
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Generate unique token
    const approvalToken = crypto.randomBytes(32).toString('hex');

    // Create quote approval record
    const [approval] = await db.insert(quoteApprovals).values({
      orderId: projectId,
      documentId: documentId || null,
      approvalToken,
      status: "pending",
      clientEmail,
      clientName,
      quoteTotal: quoteTotal || order.total,
      pdfPath: pdfPath || null,
      sentAt: new Date(),
    }).returning();

    // NOTE: Status is NOT auto-updated here. It will be updated to 'pending_approval'
    // only after the email with the approval link is actually sent by the user.

    res.json({
      ...approval,
      approvalUrl: `/client-approval/${approvalToken}`,
    });
  }

  /** GET /api/projects/:projectId/quote-approvals — List quote approvals for an order (AUTHENTICATED) */
  static async listQuoteApprovals(req: Request, res: Response) {
    const { projectId } = req.params;
    const { db } = await import("../db");
    const { quoteApprovals } = await import("@shared/schema");
    const { eq, desc } = await import("drizzle-orm");

    const approvals = await db
      .select()
      .from(quoteApprovals)
      .where(eq(quoteApprovals.orderId, projectId))
      .orderBy(desc(quoteApprovals.createdAt));

    res.json(approvals);
  }

  /** PATCH /api/projects/:projectId/quote-approvals/:approvalId — Update a quote approval (AUTHENTICATED) */
  static async updateQuoteApproval(req: Request, res: Response) {
    const { approvalId } = req.params;
    const { documentId, pdfPath, quoteTotal } = req.body;

    const { db } = await import("../db");
    const { quoteApprovals } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (documentId !== undefined) updateData.documentId = documentId;
    if (pdfPath !== undefined) updateData.pdfPath = pdfPath;
    if (quoteTotal !== undefined) updateData.quoteTotal = String(quoteTotal);

    const [updated] = await db
      .update(quoteApprovals)
      .set(updateData)
      .where(eq(quoteApprovals.id, String(approvalId)))
      .returning();

    res.json(updated);
  }

  // =====================================================
  // GROUP 4: PO CONFIRMATIONS
  // =====================================================

  /** POST /api/projects/:projectId/po-confirmations — Create PO confirmation (AUTHENTICATED) */
  static async createPoConfirmation(req: Request, res: Response) {
    const { projectId } = req.params;
    const { documentId, vendorEmail, vendorName, vendorId, poTotal, pdfPath } = req.body;
    const { db } = await import("../db");
    const { poConfirmations } = await import("@shared/schema");
    const crypto = await import("crypto");

    const token = crypto.randomBytes(32).toString("hex");
    const [confirmation] = await db.insert(poConfirmations).values({
      orderId: projectId,
      documentId,
      confirmationToken: token,
      vendorEmail,
      vendorName,
      vendorId,
      poTotal: poTotal || null,
      pdfPath: pdfPath || null,
      sentAt: new Date(),
    } as any).returning();

    res.json({ success: true, confirmation, confirmationUrl: `/po-confirmation/${token}` });
  }

  /** GET /api/po-confirmations/:token — Get PO confirmation details (PUBLIC) */
  static async getPoConfirmation(req: Request, res: Response) {
    const { token } = req.params;
    const { db } = await import("../db");
    const { poConfirmations, orders, companies, generatedDocuments, orderItems, products } = await import("@shared/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    const result = await db.execute(sql.raw(`
      SELECT
        pc.*,
        o.order_number, o.in_hands_date, o.supplier_in_hands_date, o.event_date,
        o.is_firm, o.is_rush, o.supplier_notes, o.shipping_method,
        o.shipping_address,
        c.name as company_name,
        gd.document_number, gd.file_url as pdf_url, gd.vendor_name as doc_vendor_name
      FROM po_confirmations pc
      INNER JOIN orders o ON pc.order_id = o.id
      LEFT JOIN companies c ON o.company_id = c.id
      LEFT JOIN generated_documents gd ON pc.document_id = gd.id
      WHERE pc.confirmation_token = '${token}'
    `));

    const rows = (result as any).rows ?? result;
    if (rows.length === 0) return res.status(404).json({ message: "PO confirmation not found" });

    const confirmation = rows[0];

    // Mark as viewed on first access
    if (!confirmation.viewed_at) {
      await db.execute(sql.raw(`
        UPDATE po_confirmations SET viewed_at = NOW() WHERE confirmation_token = '${token}'
      `));
    }

    // Get PO items
    const itemsResult = await db.execute(sql.raw(`
      SELECT
        oi.quantity, oi.unit_price, oi.total_price, oi.color, oi.size,
        oi.imprint_location, oi.imprint_method, oi.notes,
        p.name as product_name, p.sku as product_sku, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN generated_documents gd ON gd.order_id = oi.order_id
      WHERE gd.id = '${confirmation.document_id}'
        AND oi.supplier_id = gd.vendor_id
    `));
    const items = (itemsResult as any).rows ?? itemsResult;

    res.json({
      ...confirmation,
      items,
    });
  }

  /** POST /api/po-confirmations/:token/confirm — Vendor confirms PO (PUBLIC) */
  static async confirmPo(req: Request, res: Response) {
    const { token } = req.params;
    const { notes } = req.body;
    const { db } = await import("../db");
    const { poConfirmations, generatedDocuments } = await import("@shared/schema");
    const { eq, sql } = await import("drizzle-orm");

    // Get confirmation
    const result = await db.execute(sql.raw(`
      SELECT * FROM po_confirmations WHERE confirmation_token = '${token}'
    `));
    const rows = (result as any).rows ?? result;
    if (rows.length === 0) return res.status(404).json({ message: "Not found" });

    const confirmation = rows[0];
    if (confirmation.status !== "pending") {
      return res.status(400).json({ message: "PO already " + confirmation.status });
    }

    // Update confirmation
    await db.execute(sql.raw(`
      UPDATE po_confirmations
      SET status = 'confirmed', confirmed_at = NOW(), confirmation_notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, updated_at = NOW()
      WHERE confirmation_token = '${token}'
    `));

    // Auto-transition PO stage to "confirmed"
    if (confirmation.document_id) {
      const docResult = await db.execute(sql.raw(`
        SELECT metadata FROM generated_documents WHERE id = '${confirmation.document_id}'
      `));
      const docRows = (docResult as any).rows ?? docResult;
      if (docRows.length > 0) {
        const metadata = typeof docRows[0].metadata === 'string' ? JSON.parse(docRows[0].metadata) : (docRows[0].metadata || {});
        metadata.poStage = "confirmed";
        await db.execute(sql.raw(`
          UPDATE generated_documents SET metadata = '${JSON.stringify(metadata).replace(/'/g, "''")}' WHERE id = '${confirmation.document_id}'
        `));
      }
    }

    // Log activity
    const { projectActivities } = await import("@shared/schema");
    await db.insert(projectActivities).values({
      orderId: confirmation.order_id,
      activityType: "system_action",
      content: `Vendor ${confirmation.vendor_name || confirmation.vendor_email} confirmed PO`,
      metadata: { action: "po_vendor_confirmed", vendorName: confirmation.vendor_name, vendorEmail: confirmation.vendor_email, notes },
    } as any);

    // Notify order rep
    const { orders: ordersTable } = await import("@shared/schema");
    const orderResult = await db.execute(sql.raw(`SELECT assigned_user_id, order_number FROM orders WHERE id = '${confirmation.order_id}'`));
    const orderRows = (orderResult as any).rows ?? orderResult;
    if (orderRows.length > 0 && orderRows[0].assigned_user_id) {
      await notificationRepository.createForMultipleUsers([orderRows[0].assigned_user_id], {
        type: 'po_confirmed',
        title: 'PO Confirmed by Vendor',
        message: `${confirmation.vendor_name || 'Vendor'} has confirmed PO for order #${orderRows[0].order_number}`,
        orderId: confirmation.order_id,
      });
    }

    res.json({ success: true });
  }

  /** POST /api/po-confirmations/:token/decline — Vendor declines PO (PUBLIC) */
  static async declinePo(req: Request, res: Response) {
    const { token } = req.params;
    const { reason } = req.body;
    const { db } = await import("../db");
    const { sql } = await import("drizzle-orm");

    const result = await db.execute(sql.raw(`
      SELECT * FROM po_confirmations WHERE confirmation_token = '${token}'
    `));
    const rows = (result as any).rows ?? result;
    if (rows.length === 0) return res.status(404).json({ message: "Not found" });

    const confirmation = rows[0];
    if (confirmation.status !== "pending") {
      return res.status(400).json({ message: "PO already " + confirmation.status });
    }

    await db.execute(sql.raw(`
      UPDATE po_confirmations
      SET status = 'declined', declined_at = NOW(), decline_reason = ${reason ? `'${reason.replace(/'/g, "''")}'` : 'NULL'}, updated_at = NOW()
      WHERE confirmation_token = '${token}'
    `));

    // Log activity
    const { projectActivities } = await import("@shared/schema");
    await db.insert(projectActivities).values({
      orderId: confirmation.order_id,
      activityType: "system_action",
      content: `Vendor ${confirmation.vendor_name || confirmation.vendor_email} declined PO. Reason: ${reason || 'No reason given'}`,
      metadata: { action: "po_vendor_declined", vendorName: confirmation.vendor_name, reason },
    } as any);

    // Notify order rep
    const orderResult = await db.execute(sql.raw(`SELECT assigned_user_id, order_number FROM orders WHERE id = '${confirmation.order_id}'`));
    const orderRows = (orderResult as any).rows ?? orderResult;
    if (orderRows.length > 0 && orderRows[0].assigned_user_id) {
      await notificationRepository.createForMultipleUsers([orderRows[0].assigned_user_id], {
        type: 'po_declined',
        title: 'PO Declined by Vendor',
        message: `${confirmation.vendor_name || 'Vendor'} declined PO for order #${orderRows[0].order_number}. Reason: ${reason || 'Not specified'}`,
        orderId: confirmation.order_id,
      });
    }

    res.json({ success: true });
  }
}
