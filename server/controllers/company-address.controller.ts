import type { Request, Response } from "express";
import { companyAddressService } from "../services/company-address.service";
import { createCompanyAddressRequest, updateCompanyAddressRequest } from "../requests/company-address.request";

export class CompanyAddressController {
  static async list(req: Request, res: Response) {
    const addresses = await companyAddressService.getByCompanyId(req.params.companyId);
    res.json(addresses);
  }

  static async getById(req: Request, res: Response) {
    const address = await companyAddressService.getById(req.params.addressId);
    res.json(address);
  }

  static async create(req: Request, res: Response) {
    const data = createCompanyAddressRequest.parse(req.body);
    const address = await companyAddressService.create(req.params.companyId, data);
    res.status(201).json(address);
  }

  static async update(req: Request, res: Response) {
    const data = updateCompanyAddressRequest.parse(req.body);
    const address = await companyAddressService.update(req.params.addressId, data);
    res.json(address);
  }

  static async delete(req: Request, res: Response) {
    await companyAddressService.delete(req.params.addressId);
    res.status(204).send();
  }
}
