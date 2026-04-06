import type { Request, Response } from "express";
import { shipmentService } from "../services/shipment.service";
import { notificationScheduler } from "../services/notificationScheduler.service";

export class ShipmentController {
  static async list(req: Request, res: Response) {
    const shipments = await shipmentService.getByOrderId(req.params.projectId);
    res.json(shipments);
  }

  static async getById(req: Request, res: Response) {
    const shipment = await shipmentService.getById(req.params.shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }
    res.json(shipment);
  }

  static async create(req: Request, res: Response) {
    const { insertOrderShipmentSchema } = await import("@shared/schema");
    const body = { ...req.body, orderId: req.params.projectId };

    // Coerce date strings to Date objects for timestamp fields
    if (body.shipDate) body.shipDate = new Date(body.shipDate);
    if (body.estimatedDelivery) body.estimatedDelivery = new Date(body.estimatedDelivery);
    if (body.actualDelivery) body.actualDelivery = new Date(body.actualDelivery);

    const validatedData = insertOrderShipmentSchema.parse(body);
    const shipment = await shipmentService.create(validatedData);

    // Auto-transition SO when shipment is created with shipped/delivered status
    if (body.status) {
      await shipmentService.checkShipmentAutoTransition(req.params.projectId, body.status);
    }

    // Send client shipping notifications based on status
    if (body.status === 'shipped') {
      notificationScheduler.sendShippingNotificationToClient(req.params.projectId, shipment.id, 'shipped').catch(() => {});
    } else if (body.shipDate && body.status === 'pending') {
      notificationScheduler.sendShippingNotificationToClient(req.params.projectId, shipment.id, 'scheduled').catch(() => {});
    }

    res.status(201).json(shipment);
  }

  static async update(req: Request, res: Response) {
    // Get current shipment to detect status changes
    const currentShipment = await shipmentService.getById(req.params.shipmentId);
    const shipment = await shipmentService.update(req.params.shipmentId, req.body);

    // Auto-transition SO when shipment status changes to shipped/delivered
    if (req.body.status) {
      await shipmentService.checkShipmentAutoTransition(req.params.projectId, req.body.status);
    }

    // Send client shipping notifications on status transitions
    if (currentShipment && req.body.status && req.body.status !== currentShipment.status) {
      if (req.body.status === 'shipped') {
        notificationScheduler.sendShippingNotificationToClient(req.params.projectId, shipment.id, 'shipped').catch(() => {});
      } else if (req.body.status === 'delivered') {
        notificationScheduler.sendShippingNotificationToClient(req.params.projectId, shipment.id, 'delivered').catch(() => {});
      }
    }

    // Notify client when ship date is set/updated (and shipment is still pending)
    if (req.body.shipDate && !currentShipment?.shipDate && shipment.status === 'pending') {
      notificationScheduler.sendShippingNotificationToClient(req.params.projectId, shipment.id, 'scheduled').catch(() => {});
    }

    res.json(shipment);
  }

  static async delete(req: Request, res: Response) {
    await shipmentService.delete(req.params.shipmentId);
    res.status(204).send();
  }
}
