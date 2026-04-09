import { Router } from "express";
import multer from "multer";
import { isAuthenticated } from "../config/auth";
import { asyncHandler } from "../utils/asyncHandler";
import {
  DataImportController,
  IMPORT_FILE_FIELD,
} from "../controllers/dataImport.controller";

const router = Router();

// In-memory multer for CSV uploads — max 10MB. Keeping files in memory
// is fine since imports are short-lived and processed synchronously.
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted"));
    }
  },
});

router.get("/api/import/fields", isAuthenticated, asyncHandler(DataImportController.getFields));
router.post(
  "/api/import/preview",
  isAuthenticated,
  csvUpload.single(IMPORT_FILE_FIELD),
  asyncHandler(DataImportController.preview),
);
router.post(
  "/api/import/companies",
  isAuthenticated,
  csvUpload.single(IMPORT_FILE_FIELD),
  asyncHandler(DataImportController.importCompanies),
);
router.post(
  "/api/import/contacts",
  isAuthenticated,
  csvUpload.single(IMPORT_FILE_FIELD),
  asyncHandler(DataImportController.importContacts),
);

export default router;
