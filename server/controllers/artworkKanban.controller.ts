import type { Request, Response } from "express";
import { artworkKanbanRepository } from "../repositories/artworkKanban.repository";

export class ArtworkKanbanController {
  static async getColumns(_req: Request, res: Response) {
    const columns = await artworkKanbanRepository.getArtworkColumns();
    res.json(columns);
  }

  static async initializeColumns(_req: Request, res: Response) {
    const defaultColumns = [
      { id: "pms-colors", name: "PMS Colors", position: 1, color: "#EF4444", isDefault: true },
      { id: "artist-schedule", name: "Artist Schedule", position: 2, color: "#F97316", isDefault: true },
      { id: "artwork-todo", name: "Artwork to Do", position: 3, color: "#EAB308", isDefault: true },
      { id: "in-progress", name: "In Progress", position: 4, color: "#3B82F6", isDefault: true },
      { id: "questions", name: "Questions and clarifications", position: 5, color: "#8B5CF6", isDefault: true },
      { id: "for-review", name: "For Review", position: 6, color: "#EC4899", isDefault: true },
      { id: "sent-to-client", name: "Sent to Client", position: 7, color: "#10B981", isDefault: true },
      { id: "completed", name: "Completed", position: 8, color: "#22C55E", isDefault: true },
    ];

    const columns = await artworkKanbanRepository.initializeArtworkColumns(defaultColumns);
    res.json(columns);
  }

  static async createColumn(req: Request, res: Response) {
    const column = await artworkKanbanRepository.createArtworkColumn(req.body);
    res.status(201).json(column);
  }

  static async getCards(_req: Request, res: Response) {
    const cards = await artworkKanbanRepository.getArtworkCards();
    res.json(cards);
  }

  static async moveCard(req: Request, res: Response) {
    const { id } = req.params;
    const { columnId, position } = req.body;
    const card = await artworkKanbanRepository.moveArtworkCard(id, columnId, position);
    res.json(card);
  }
}
