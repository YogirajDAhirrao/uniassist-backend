import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { uploadDocument, downloadDocument, listDocuments, getDocumentStatus, deleteDocument, } from "./documents.controller.js";
const router = Router();
// ── Admin-only routes ─────────────────────────────────────────────────────────
// Upload a document (admin only)
router.post("/upload", authenticate, authorize(["admin"]), upload.single("file"), uploadDocument);
// List all documents (admin only)
router.get("/", authenticate, authorize(["admin"]), listDocuments);
// Get single document + ingestion status (admin only)
router.get("/:id", authenticate, authorize(["admin"]), getDocumentStatus);
// Delete document + purge vectors (admin only)
router.delete("/:id", authenticate, authorize(["admin"]), deleteDocument);
// ── Authenticated routes ──────────────────────────────────────────────────────
// Download document (all authenticated users)
router.get("/:id/download", authenticate, downloadDocument);
export default router;
//# sourceMappingURL=documentts.router.js.map