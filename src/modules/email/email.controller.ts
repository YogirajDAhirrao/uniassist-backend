import { Response } from "express";
import { EmailService } from "./email.service.js";

const emailService = new EmailService();

export const sendToCourse = async (req: any, res: Response) => {
  try {
    const { subject, body, courseId } = req.body;

    const senderId = req.user.userId;

    const result = await emailService.sendToCourse(
      senderId,
      subject,
      body,
      courseId
    );

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getCampaignHistory = async (
  req: any,
  res: Response
) => {
  try {
    const campaigns =
      await emailService.getCampaignHistory();

    return res.json(campaigns);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getCampaignById = async (
  req: any,
  res: Response
) => {
  try {
    const { campaignId } = req.params;

    const campaign =
      await emailService.getCampaignById(campaignId);

    return res.json(campaign);
  } catch (error: any) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const getRecipients = async (
  req: any,
  res: Response
) => {
  try {
    const { campaignId } = req.params;

    const recipients =
      await emailService.getRecipients(campaignId);

    return res.json(recipients);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const retryFailedEmails = async (
  req: any,
  res: Response
) => {
  try {
    const { campaignId } = req.params;

    const result =
      await emailService.retryFailedEmails(campaignId);

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};