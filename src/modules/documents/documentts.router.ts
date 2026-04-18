import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { uploadDocument } from "./documents.controller.js";

const router = Router();
router.post(
  "/upload",
  (req, res, next) => {
    console.log("STEP 1: route hit");
    next();
  },
  authenticate,
  (req, res, next) => {
    console.log("STEP 2: auth passed");
    next();
  },
  authorize(["admin"]),
  (req, res, next) => {
    console.log("STEP 3: authorize passed");
    next();
  },
  upload.single("file"),
  (req, res, next) => {
    console.log("STEP 4: multer ran", req.file);
    next();
  },
  uploadDocument,
);

export default router;
