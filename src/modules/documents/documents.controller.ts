import { Request, Response } from "express";
import { DocumentService } from "./documents.service.js";

const documentService = new DocumentService();
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    console.log(req.file);

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }
    console.log(req.file, "sdgkfjsdfj");
    const result = await documentService.uploadPDF(file);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
