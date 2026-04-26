import { dashboardRepository } from "../repositories/dashboard.repository";

export class DashboardService {
  async checkHealth() {
    const { pool } = await import("../db");
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    return {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      service: 'swagsuite',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  async proxyImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    return { buffer, contentType };
  }

  async getStats() {
    return dashboardRepository.getStats();
  }

  async getRecentOrders(limit: number) {
    return dashboardRepository.getRecentOrders(limit);
  }

  async getTeamLeaderboard() {
    return dashboardRepository.getTeamLeaderboard();
  }

  async getShippingMarginReport(params: { period: "ytd" | "mtd" | "wtd" | "all" | "custom"; from?: Date; to?: Date }) {
    return dashboardRepository.getShippingMarginReport(params);
  }
}

export const dashboardService = new DashboardService();
