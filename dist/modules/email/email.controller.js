import { EmailService } from "./email.service.js";
const emailService = new EmailService();
export const sendToCourse = async (req, res) => {
    try {
        const { subject, body, courseId } = req.body;
        const senderId = req.user.userId;
        const result = await emailService.sendToCourse(senderId, subject, body, courseId);
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const getCampaignHistory = async (req, res) => {
    try {
        const campaigns = await emailService.getCampaignHistory();
        return res.json(campaigns);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const getCampaignById = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await emailService.getCampaignById(campaignId);
        return res.json(campaign);
    }
    catch (error) {
        return res.status(404).json({
            message: error.message,
        });
    }
};
export const getRecipients = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const recipients = await emailService.getRecipients(campaignId);
        return res.json(recipients);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const retryFailedEmails = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const result = await emailService.retryFailedEmails(campaignId);
        return res.json(result);
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
//# sourceMappingURL=email.controller.js.map