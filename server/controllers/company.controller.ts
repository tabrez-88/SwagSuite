import type { Request, Response } from "express";
import { companyService } from "../services/company.service";
import { getUserId } from "../utils/getUserId";
import { createCompanyRequest, updateCompanyRequest, searchCompanyRequest } from "../requests/company.request";

export class CompanyController {
  static async list(req: Request, res: Response) {
    const companies = await companyService.getAllWithYtd();
    res.json(companies);
  }

  static async search(req: Request, res: Response) {
    const { q } = searchCompanyRequest.parse(req.query);
    const companies = await companyService.search(q);
    res.json(companies);
  }

  static async getById(req: Request, res: Response) {
    const company = await companyService.getById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  }

  static async create(req: Request, res: Response) {
    const data = createCompanyRequest.parse(req.body);
    const company = await companyService.create(data, getUserId(req));
    res.status(201).json(company);
  }

  static async update(req: Request, res: Response) {
    const data = updateCompanyRequest.parse(req.body);
    const company = await companyService.update(req.params.id, data, getUserId(req));
    res.json(company);
  }

  static async delete(req: Request, res: Response) {
    await companyService.delete(req.params.id, getUserId(req));
    res.status(204).send();
  }

  static async getActivities(req: Request, res: Response) {
    const activities = await companyService.getActivities(req.params.id);
    res.json(activities);
  }

  static async getProjects(req: Request, res: Response) {
    const projects = await companyService.getProjects(req.params.id);
    res.json(projects);
  }
}
