import type { Request, Response } from "express";
import { userRepository } from "../repositories/user.repository";
import { vendorApprovalRepository } from "../repositories/vendorApproval.repository";
import { supplierRepository } from "../repositories/supplier.repository";
import { productRepository } from "../repositories/product.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { getUserId } from "../utils/getUserId";

export class VendorApprovalController {
  static async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const requests = await vendorApprovalRepository.getVendorApprovalRequests(status);

    // Enrich with vendor and user details
    const enrichedRequests = await Promise.all(requests.map(async (request) => {
      const supplier = await supplierRepository.getById(request.supplierId);
      const requestedByUser = await userRepository.getUser(request.requestedBy);
      const reviewedByUser = request.reviewedBy ? await userRepository.getUser(request.reviewedBy) : null;
      const product = request.productId ? await productRepository.getById(request.productId) : null;

      return {
        ...request,
        supplier,
        requestedByUser,
        reviewedByUser,
        product,
      };
    }));

    res.json(enrichedRequests);
  }

  static async create(req: Request, res: Response) {
    const user = req.user as any;
    const userId = getUserId(req);
    const { supplierId, productId, orderId, reason } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }

    // Validate supplier exists and is marked as do not order
    const supplier = await supplierRepository.getById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    if (!supplier.doNotOrder) {
      return res.status(400).json({ message: "This supplier is not marked as Do Not Order" });
    }

    const request = await vendorApprovalRepository.createVendorApprovalRequest({
      supplierId,
      productId: productId || null,
      orderId: orderId || null,
      requestedBy: userId,
      reason,
      status: 'pending',
    });

    // Get all admins and managers for notifications
    const allUsers = await userRepository.getAllUsers();
    const adminManagerIds = allUsers
      .filter(u => u.role === 'admin' || u.role === 'manager')
      .map(u => u.id);

    // Create in-app notifications for admins/managers
    if (adminManagerIds.length > 0) {
      const requestingUser = await userRepository.getUser(userId);
      const userName = requestingUser?.firstName || requestingUser?.username || 'A team member';

      await notificationRepository.createForMultipleUsers(adminManagerIds, {
        senderId: userId,
        type: 'vendor_approval',
        title: 'Vendor Approval Request',
        message: `${userName} has requested approval to order from restricted vendor: ${supplier.name}`,
        orderId: orderId || undefined,
      });
    }

    // Send email notification to admins
    try {
      const { emailService } = await import("../services/email.service");
      const adminEmails = allUsers.filter(u => u.role === 'admin' && u.email).map(u => u.email!);

      // Get full user info for email
      const requestingUser = await userRepository.getUser(userId);
      const userName = requestingUser?.firstName || requestingUser?.username || user.claims?.first_name || 'A team member';
      const userEmail = requestingUser?.email || user.claims?.email || 'Unknown';

      if (adminEmails.length > 0) {
        await emailService.sendEmail({
          to: adminEmails.join(','),
          subject: `[Action Required] Vendor Approval Request - ${supplier.name}`,
          html: `
            <h2>Vendor Approval Request</h2>
            <p><strong>${userName}</strong> has requested approval to order from a restricted vendor.</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Vendor:</strong> ${supplier.name}</li>
              ${productId ? `<li><strong>Product ID:</strong> ${productId}</li>` : ''}
              <li><strong>Reason:</strong> ${reason || 'No reason provided'}</li>
              <li><strong>Requested By:</strong> ${userEmail}</li>
            </ul>
            <p>Please log in to the system to approve or reject this request.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json(request);
  }

  static async update(req: Request, res: Response) {
    const userId = getUserId(req);
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }

    // Get full user to check role
    const fullUser = await userRepository.getUser(userId);

    // Only admins and managers can approve/reject
    if (fullUser?.role !== 'admin' && fullUser?.role !== 'manager') {
      return res.status(403).json({ message: "Only administrators and managers can approve or reject vendor requests" });
    }

    const request = await vendorApprovalRepository.getVendorApprovalRequest(id);
    if (!request) {
      return res.status(404).json({ message: "Approval request not found" });
    }

    const updated = await vendorApprovalRepository.updateVendorApprovalRequest(id, {
      status,
      reviewNotes,
      reviewedBy: userId,
      reviewedAt: new Date(),
    });

    // Notify the requester with in-app notification
    const requester = await userRepository.getUser(request.requestedBy);
    const supplier = await supplierRepository.getById(request.supplierId);

    // Create in-app notification for the requester
    await notificationRepository.create({
      recipientId: request.requestedBy,
      senderId: userId,
      type: status === 'approved' ? 'vendor_approval' : 'vendor_approval',
      title: `Vendor Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your request to order from ${supplier?.name} has been ${status}${reviewNotes ? `. Notes: ${reviewNotes}` : ''}`,
      orderId: request.orderId || undefined,
    });

    // Send email notification
    try {
      if (requester?.email) {
        const { emailService } = await import("../services/email.service");
        await emailService.sendEmail({
          to: requester.email,
          subject: `Vendor Approval Request ${status === 'approved' ? 'Approved' : 'Rejected'} - ${supplier?.name}`,
          html: `
            <h2>Vendor Approval Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
            <p>Your request to order from <strong>${supplier?.name}</strong> has been <strong>${status}</strong>.</p>
            ${reviewNotes ? `<p><strong>Notes:</strong> ${reviewNotes}</p>` : ''}
            ${status === 'approved' ? '<p>You may now proceed with your order.</p>' : '<p>Please contact an administrator if you have questions.</p>'}
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send requester notification email:", emailError);
    }

    res.json(updated);
  }

  static async check(req: Request, res: Response) {
    const userId = getUserId(req);
    const { supplierId } = req.params;
    const { orderId } = req.query;

    const supplier = await supplierRepository.getById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Check if vendor is marked as do not order
    if (!supplier.doNotOrder) {
      return res.json({
        requiresApproval: false,
        supplier
      });
    }

    // Check if there's an approved request for this specific order
    if (orderId && userId) {
      const approvedRequest = await vendorApprovalRepository.getApprovedRequestForOrder(supplierId, orderId as string, userId);
      if (approvedRequest) {
        return res.json({
          requiresApproval: false,
          doNotOrder: true,
          supplier,
          hasApprovedRequest: true,
          approvedRequest,
        });
      }
    }

    // Check for any pending requests for this user and supplier
    const pendingRequests = await vendorApprovalRepository.getPendingApprovalsBySupplier(supplierId);
    const userPendingRequest = pendingRequests.find(r => r.requestedBy === userId);

    res.json({
      requiresApproval: true,
      doNotOrder: true,
      supplier,
      hasPendingRequest: !!userPendingRequest,
      pendingRequest: userPendingRequest || null,
    });
  }
}
