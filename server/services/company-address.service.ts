import { companyAddressRepository } from "../repositories/company-address.repository";
import { NotFoundError } from "../errors/AppError";
import type { CreateCompanyAddressRequest, UpdateCompanyAddressRequest } from "../requests/company-address.request";

export class CompanyAddressService {
  async getByCompanyId(companyId: string) {
    return companyAddressRepository.getByCompanyId(companyId);
  }

  async getById(id: string) {
    const address = await companyAddressRepository.getById(id);
    if (!address) throw new NotFoundError("Address not found");
    return address;
  }

  async create(companyId: string, data: CreateCompanyAddressRequest) {
    if (data.isDefault) {
      await companyAddressRepository.clearDefaults(companyId, data.addressType || "both");
    }
    return companyAddressRepository.create({ ...data, companyId });
  }

  async update(id: string, data: UpdateCompanyAddressRequest) {
    const existing = await this.getById(id);

    if (data.isDefault) {
      await companyAddressRepository.clearDefaults(
        existing.companyId,
        data.addressType || existing.addressType
      );
    }

    return companyAddressRepository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    return companyAddressRepository.delete(id);
  }
}

export const companyAddressService = new CompanyAddressService();
