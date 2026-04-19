import { Request, Response } from "express";
import { DocumentService } from "./documents.service.js";

const documentService = new DocumentService();
export const uploadDocument = async (req: any, res: Response) => {
  try {
    console.log("BODY:", req.body);

    const title = req.body.title;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const document = await documentService.uploadDocument(
      file,
      title,
      req.user.userId
    );

    return res.status(201).json({
      message: "Document uploaded",
      document,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
