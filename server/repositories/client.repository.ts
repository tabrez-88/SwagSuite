import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db";
import {
  clients,
  type Client,
  type InsertClient,
} from "@shared/schema";

export class ClientRepository {
  async getClients(): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id));
    return client;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return newClient;
  }

  async updateClient(
    id: string,
    clientData: Partial<InsertClient>
  ): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        or(
          ilike(clients.firstName, `%${query}%`),
          ilike(clients.lastName, `%${query}%`),
          ilike(clients.email, `%${query}%`),
          ilike(clients.company, `%${query}%`)
        )
      )
      .orderBy(desc(clients.createdAt));
  }
}

export const clientRepository = new ClientRepository();
