import type { Request, Response } from "express";
import { contactService } from "../services/contact.service";
import { createContactRequest, updateContactRequest } from "../requests/contact.request";

export class ContactController {
  static async list(req: Request, res: Response) {
    const companyId = req.query.companyId as string;
    const supplierId = req.query.supplierId as string;
    const contacts = await contactService.getAll(companyId, supplierId);
    res.json(contacts);
  }

  static async getById(req: Request, res: Response) {
    const contact = await contactService.getById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json(contact);
  }

  static async create(req: Request, res: Response) {
    const data = createContactRequest.parse(req.body);
    const contact = await contactService.create(data);
    res.status(201).json(contact);
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Contact ID is required" });
    }
    const data = updateContactRequest.parse(req.body);
    const contact = await contactService.update(id, data);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json(contact);
  }

  static async delete(req: Request, res: Response) {
    await contactService.delete(req.params.id);
    res.status(204).send();
  }
}
