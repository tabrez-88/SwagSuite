import type { Request, Response } from "express";
import { shipmentService } from "../services/shipment.service";

export class ShipmentController {
  static async list(req: Request, res: Response) {
    const shipments = await shipmentService.getByOrderId(req.params.orderId);
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
    const body = { ...req.body, orderId: req.params.orderId };

    // Coerce date strings to Date objects for timestamp fields
    if (body.shipDate) body.shipDate = new Date(body.shipDate);
    if (body.estimatedDelivery) body.estimatedDelivery = new Date(body.estimatedDelivery);
    if (body.actualDelivery) body.actualDelivery = new Date(body.actualDelivery);

    const validatedData = insertOrderShipmentSchema.parse(body);
    const shipment = await shipmentService.create(validatedData);

    // Auto-transition SO when shipment is created with shipped/delivered status
    if (body.status) {
      await shipmentService.checkShipmentAutoTransition(req.params.orderId, body.status);
    }

    res.status(201).json(shipment);
  }

  static async update(req: Request, res: Response) {
    const shipment = await shipmentService.update(req.params.shipmentId, req.body);

    // Auto-transition SO when shipment status changes to shipped/delivered
    if (req.body.status) {
      await shipmentService.checkShipmentAutoTransition(req.params.orderId, req.body.status);
    }

    res.json(shipment);
  }

  static async delete(req: Request, res: Response) {
    await shipmentService.delete(req.params.shipmentId);
    res.status(204).send();
  }
}
