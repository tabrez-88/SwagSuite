import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";

export class DashboardController {
  static async healthCheck(req: Request, res: Response) {
    try {
      const result = await dashboardService.checkHealth();
      res.status(200).json(result);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async imageProxy(req: Request, res: Response) {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ message: "url parameter required" });

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    const { buffer, contentType } = await dashboardService.proxyImage(url);
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

  static async getStats(req: Request, res: Response) {
    const stats = await dashboardService.getStats();
    res.json(stats);
  }

  static async getRecentOrders(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 10;
    const orders = await dashboardService.getRecentOrders(limit);
    res.json(orders);
  }

  static async getTeamLeaderboard(req: Request, res: Response) {
    const leaderboard = await dashboardService.getTeamLeaderboard();
    res.json(leaderboard);
  }
}
