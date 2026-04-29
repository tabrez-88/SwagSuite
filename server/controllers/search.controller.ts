import type { Request, Response } from "express";
import { searchService } from "../services/search.service";
import type { EntityType } from "../services/search.service";

export class SearchController {
  static async aiSearch(req: Request, res: Response) {
    const { query, limit } = req.body;

    if (!query || query.trim().length === 0) {
      return res.json({ results: [], answer: undefined });
    }

    const response = await searchService.aiSearch(query, {
      limit: typeof limit === "number" ? limit : undefined,
    });
    res.json(response);
  }

  static async advancedSearch(req: Request, res: Response) {
    const {
      q,
      limit,
      offset,
      entityTypes,
      stage,
      marginMin,
      marginMax,
      dateFrom,
      dateTo,
      industry,
    } = req.query;

    const parsedEntityTypes = entityTypes
      ? (String(entityTypes).split(",") as EntityType[])
      : undefined;

    const response = await searchService.advancedSearch({
      q: String(q || ""),
      limit: limit ? parseInt(String(limit), 10) : undefined,
      offset: offset ? parseInt(String(offset), 10) : undefined,
      entityTypes: parsedEntityTypes,
      stage: stage ? String(stage) : undefined,
      marginMin: marginMin ? parseFloat(String(marginMin)) : undefined,
      marginMax: marginMax ? parseFloat(String(marginMax)) : undefined,
      dateFrom: dateFrom ? String(dateFrom) : undefined,
      dateTo: dateTo ? String(dateTo) : undefined,
      industry: industry ? String(industry) : undefined,
    });

    res.json(response);
  }
}
