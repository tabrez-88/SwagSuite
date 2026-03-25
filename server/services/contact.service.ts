import type { InsertContact } from "@shared/schema";
import { contactRepository } from "../repositories/contact.repository";

export class ContactService {
  async getAll(companyId?: string, supplierId?: string, includeInactive = false) {
    const contacts = await contactRepository.getAll(companyId, supplierId, includeInactive);

    const companyMap = await contactRepository.getAllCompanyNames();
    const supplierMap = await contactRepository.getAllSupplierNames();

    return contacts.map(contact => ({
      ...contact,
      companyName: contact.companyId ? companyMap.get(contact.companyId) || null : null,
      supplierName: contact.supplierId ? supplierMap.get(contact.supplierId) || null : null,
    }));
  }

  async getById(id: string) {
    const contact = await contactRepository.getById(id);
    if (!contact) return null;

    let companyName = null;
    let supplierName = null;

    if (contact.companyId) {
      companyName = await contactRepository.getCompanyName(contact.companyId);
    }
    if (contact.supplierId) {
      supplierName = await contactRepository.getSupplierName(contact.supplierId);
    }

    return { ...contact, companyName, supplierName };
  }

  async create(data: InsertContact) {
    return contactRepository.create(data);
  }

  async update(id: string, data: Partial<InsertContact>) {
    return contactRepository.update(id, data);
  }

  async delete(id: string) {
    return contactRepository.delete(id);
  }
}

export const contactService = new ContactService();
