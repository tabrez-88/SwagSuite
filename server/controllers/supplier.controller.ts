import type { Request, Response } from "express";
import { supplierService } from "../services/supplier.service";
import { createSupplierRequest, updateSupplierRequest } from "../requests/supplier.request";

export class SupplierController {
  static async list(req: Request, res: Response) {
    const suppliers = await supplierService.getAllWithStats();
    res.json(suppliers);
  }

  static async getById(req: Request, res: Response) {
    const supplier = await supplierService.getById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  }

  static async create(req: Request, res: Response) {
    const data = createSupplierRequest.parse(req.body);
    const supplier = await supplierService.create(data);
    res.status(201).json(supplier);
  }

  static async update(req: Request, res: Response) {
    const data = updateSupplierRequest.parse(req.body);
    const supplier = await supplierService.update(req.params.id, data);
    res.json(supplier);
  }

  static async delete(req: Request, res: Response) {
    await supplierService.delete(req.params.id);
    res.status(204).send();
  }
}
