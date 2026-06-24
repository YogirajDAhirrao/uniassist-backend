import https from "https";
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
      req.user.userId,
    );

    return res.status(201).json({
      message: "Document uploaded",
      document,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const downloadDocument = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { url, fileName, contentType } =
      await documentService.getDocumentStream(id);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    https
      .get(url, (fileRes) => {
        fileRes.pipe(res);
      })
      .on("error", (err) => {
        res.status(500).json({ message: "Download failed" });
      });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// GET /api/document — list all documents (admin)
export const listDocuments = async (req: any, res: Response) => {
  try {
    const documents = await documentService.listDocuments();
    return res.json(documents);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// GET /api/document/:id — get document + status
export const getDocumentStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentStatus(id);
    return res.json(document);
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

// DELETE /api/document/:id — delete document, purge vectors + Cloudinary
export const deleteDocument = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const result = await documentService.deleteDocument(id);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
