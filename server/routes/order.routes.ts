import { Router } from "express";
import { isAuthenticated } from "../config/auth";
import { upload } from "../config/cloudinary";
import { OrderController } from "../controllers/order.controller";

const router = Router();

// ── Orders CRUD ──
router.get("/api/orders", isAuthenticated, OrderController.list);
router.get("/api/orders/:id", isAuthenticated, OrderController.getById);
router.post("/api/orders", isAuthenticated, OrderController.create);
router.patch("/api/orders/:id", isAuthenticated, OrderController.update);
router.post("/api/orders/:orderId/duplicate", isAuthenticated, OrderController.duplicate);
router.post("/api/orders/:id/recalculate-total", isAuthenticated, OrderController.recalculateTotal);

// ── Order Items ──
router.get("/api/orders/:orderId/items", isAuthenticated, OrderController.listItems);
router.post("/api/orders/:orderId/items", isAuthenticated, OrderController.createItem);
router.patch("/api/orders/:orderId/items/:itemId", isAuthenticated, OrderController.updateItem);
router.delete("/api/orders/:orderId/items/:itemId", isAuthenticated, OrderController.deleteItem);

// ── Artwork Items (per order item) ──
router.get("/api/order-items/:orderItemId/artworks", isAuthenticated, OrderController.listArtworks);
router.post("/api/order-items/:orderItemId/artworks", isAuthenticated, upload.single('file'), OrderController.createArtwork);
router.put("/api/order-items/:orderItemId/artworks/:artworkId", isAuthenticated, upload.single('file'), OrderController.updateArtwork);
router.delete("/api/order-items/:orderItemId/artworks/:artworkId", isAuthenticated, OrderController.deleteArtwork);

// ── Order Item Lines ──
router.get("/api/order-items/:orderItemId/lines", isAuthenticated, OrderController.listLines);
router.post("/api/order-items/:orderItemId/lines", isAuthenticated, OrderController.createLine);
router.patch("/api/order-items/:orderItemId/lines/:lineId", isAuthenticated, OrderController.updateLine);
router.delete("/api/order-items/:orderItemId/lines/:lineId", isAuthenticated, OrderController.deleteLine);

// ── Order Additional Charges ──
router.get("/api/order-items/:orderItemId/charges", isAuthenticated, OrderController.listCharges);
router.post("/api/order-items/:orderItemId/charges", isAuthenticated, OrderController.createCharge);
router.patch("/api/order-items/:orderItemId/charges/:chargeId", isAuthenticated, OrderController.updateCharge);
router.delete("/api/order-items/:orderItemId/charges/:chargeId", isAuthenticated, OrderController.deleteCharge);

// ── Order Service Charges ──
router.get("/api/orders/:orderId/service-charges", isAuthenticated, OrderController.listServiceCharges);
router.post("/api/orders/:orderId/service-charges", isAuthenticated, OrderController.createServiceCharge);
router.patch("/api/orders/:orderId/service-charges/:chargeId", isAuthenticated, OrderController.updateServiceCharge);
router.delete("/api/orders/:orderId/service-charges/:chargeId", isAuthenticated, OrderController.deleteServiceCharge);

export default router;
