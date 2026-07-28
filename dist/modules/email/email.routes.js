import { Router } from "express";
import { sendToCourse, getCampaignHistory, getCampaignById, getRecipients, retryFailedEmails, } from "./email.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(authenticate, authorize(["admin"]));
router.post("/send", sendToCourse);
router.get("/", getCampaignHistory);
router.get("/:campaignId", getCampaignById);
router.get("/:campaignId/recipients", getRecipients);
router.post("/:campaignId/retry", retryFailedEmails);
export default router;
//# sourceMappingURL=email.routes.js.map