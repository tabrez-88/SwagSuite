import { supplierAddressRepository } from "../repositories/supplier-address.repository";
import { NotFoundError } from "../errors/AppError";
import type { CreateSupplierAddressRequest, UpdateSupplierAddressRequest } from "../requests/supplier-address.request";

export class SupplierAddressService {
  async getBySupplierId(supplierId: string) {
    return supplierAddressRepository.getBySupplierId(supplierId);
  }

  async getById(id: string) {
    const address = await supplierAddressRepository.getById(id);
    if (!address) throw new NotFoundError("Address not found");
    return address;
  }

  async create(supplierId: string, data: CreateSupplierAddressRequest) {
    if (data.isDefault) {
      await supplierAddressRepository.clearDefaults(supplierId, data.addressType || "both");
    }
    return supplierAddressRepository.create({ ...data, supplierId });
  }

  async update(id: string, data: UpdateSupplierAddressRequest) {
    const existing = await this.getById(id);

    if (data.isDefault) {
      await supplierAddressRepository.clearDefaults(
        existing.supplierId,
        data.addressType || existing.addressType
      );
    }

    return supplierAddressRepository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    return supplierAddressRepository.delete(id);
  }
}

export const supplierAddressService = new SupplierAddressService();
