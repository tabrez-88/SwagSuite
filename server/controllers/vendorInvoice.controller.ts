import type { Request, Response } from "express";
import { vendorInvoiceService } from "../services/vendorInvoice.service";

export class VendorInvoiceController {
  static async list(req: Request, res: Response) {
    const { projectId } = req.params;
    const invoices = await vendorInvoiceService.getByOrderId(projectId);
    res.json(invoices);
  }

  static async create(req: Request, res: Response) {
    const { projectId } = req.params;
    const { supplierId, documentId, invoiceNumber, amount, dueDate, notes } = req.body;

    const invoice = await vendorInvoiceService.create(projectId, {
      supplierId,
      documentId,
      invoiceNumber,
      amount,
      dueDate,
      notes,
    });

    res.status(201).json(invoice);
  }

  static async update(req: Request, res: Response) {
    const { invoiceId } = req.params;
    const { invoiceNumber, amount, dueDate, notes, status } = req.body;

    const invoice = await vendorInvoiceService.update(invoiceId, {
      invoiceNumber,
      amount,
      dueDate,
      notes,
      status,
    });

    res.json(invoice);
  }
}
