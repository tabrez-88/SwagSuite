import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  artworkColumns,
  artworkCards,
  orders,
  companies,
  users,
  type ArtworkColumn,
  type InsertArtworkColumn,
  type ArtworkCard,
  type InsertArtworkCard,
} from "@shared/schema";

export class ArtworkKanbanRepository {
  async getArtworkColumns(): Promise<ArtworkColumn[]> {
    return await db
      .select()
      .from(artworkColumns)
      .orderBy(artworkColumns.position);
  }

  async initializeArtworkColumns(columns: any[]): Promise<ArtworkColumn[]> {
    const insertColumns = columns.map((col) => ({
      id: col.id,
      name: col.name,
      position: col.position,
      color: col.color,
      isDefault: col.isDefault,
    }));

    return await db.insert(artworkColumns).values(insertColumns).returning();
  }

  async createArtworkColumn(
    column: InsertArtworkColumn
  ): Promise<ArtworkColumn> {
    const [newColumn] = await db
      .insert(artworkColumns)
      .values(column)
      .returning();
    return newColumn;
  }

  async getArtworkCards(): Promise<any[]> {
    const cards = await db
      .select({
        id: artworkCards.id,
        title: artworkCards.title,
        description: artworkCards.description,
        columnId: artworkCards.columnId,
        orderId: artworkCards.orderId,
        companyId: artworkCards.companyId,
        assignedUserId: artworkCards.assignedUserId,
        position: artworkCards.position,
        priority: artworkCards.priority,
        dueDate: artworkCards.dueDate,
        labels: artworkCards.labels,
        attachments: artworkCards.attachments,
        checklist: artworkCards.checklist,
        comments: artworkCards.comments,
        createdAt: artworkCards.createdAt,
        updatedAt: artworkCards.updatedAt,
        orderNumber: orders.orderNumber,
        companyName: companies.name,
        assignedUserName: users.firstName,
      })
      .from(artworkCards)
      .leftJoin(orders, eq(artworkCards.orderId, orders.id))
      .leftJoin(companies, eq(artworkCards.companyId, companies.id))
      .leftJoin(users, eq(artworkCards.assignedUserId, users.id))
      .orderBy(artworkCards.position);

    return cards;
  }

  async createArtworkCard(card: InsertArtworkCard): Promise<ArtworkCard> {
    const [newCard] = await db.insert(artworkCards).values(card).returning();
    return newCard;
  }

  async moveArtworkCard(
    cardId: string,
    columnId: string,
    position: number
  ): Promise<ArtworkCard> {
    const [updatedCard] = await db
      .update(artworkCards)
      .set({ columnId, position, updatedAt: new Date() })
      .where(eq(artworkCards.id, cardId))
      .returning();
    return updatedCard;
  }

  async updateArtworkCard(
    id: string,
    card: Partial<InsertArtworkCard>
  ): Promise<ArtworkCard> {
    const [updatedCard] = await db
      .update(artworkCards)
      .set({ ...card, updatedAt: new Date() })
      .where(eq(artworkCards.id, id))
      .returning();
    return updatedCard;
  }
}

export const artworkKanbanRepository = new ArtworkKanbanRepository();
