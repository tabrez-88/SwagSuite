import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Team members for @ mentions and assignments
router.get("/api/users/team", asyncHandler(UserController.getTeam));

export default router;
