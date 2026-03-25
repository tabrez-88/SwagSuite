import type { Request, Response } from "express";
import { supplierAddressService } from "../services/supplier-address.service";
import { createSupplierAddressRequest, updateSupplierAddressRequest } from "../requests/supplier-address.request";

export class SupplierAddressController {
  static async list(req: Request, res: Response) {
    const addresses = await supplierAddressService.getBySupplierId(req.params.supplierId);
    res.json(addresses);
  }

  static async getById(req: Request, res: Response) {
    const address = await supplierAddressService.getById(req.params.addressId);
    res.json(address);
  }

  static async create(req: Request, res: Response) {
    const data = createSupplierAddressRequest.parse(req.body);
    const address = await supplierAddressService.create(req.params.supplierId, data);
    res.status(201).json(address);
  }

  static async update(req: Request, res: Response) {
    const data = updateSupplierAddressRequest.parse(req.body);
    const address = await supplierAddressService.update(req.params.addressId, data);
    res.json(address);
  }

  static async delete(req: Request, res: Response) {
    await supplierAddressService.delete(req.params.addressId);
    res.status(204).send();
  }
}
