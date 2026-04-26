import type { Request, Response } from "express";
import { searchService } from "../services/search.service";

export class SearchController {
  static async aiSearch(req: Request, res: Response) {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.json({ results: [], answer: undefined });
    }

    const response = await searchService.aiSearch(query);
    res.json(response);
  }
}
