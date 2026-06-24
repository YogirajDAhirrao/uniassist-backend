import cloudinary from "../../utils/cloudinary.js";
import streamifier from "streamifier";
import https from "https";

import { prisma } from "../../lib/prisma.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { qdrantClient } from "../../lib/qdrant.js";

export class DocumentService {
  async uploadDocument(
    file: Express.Multer.File,
    title: string,
    userId: string,
  ) {
    if (!file) throw new Error("No file provided");
    if (!title) throw new Error("Title is required");

    // 1️⃣ Upload to Cloudinary
    const uploadResult = await new Promise<{ url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "documents",
            resource_type: "raw",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("Upload failed"));

            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      },
    );

    // 2️⃣ Save in DB
    const document = await prisma.document.create({
      data: {
        title,
        fileUrl: uploadResult.url,
        publicId: uploadResult.public_id,
        fileType: file.mimetype,
        uploadedById: userId,
      },
    });

    const ingestionService = new IngestionService();

    ingestionService
      .processDocument(document.id)
      .then(() => {
        console.log("Ingestion Completed:", document.id);
      })
      .catch((err) => {
        console.error("Ingestion Failed", err);
      });

    return document;
  }
  async getDocumentStream(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document Not Found");
    }
    return {
      url: document.fileUrl,
      fileName: document.title + ".pdf",
      contentType: document.fileType || "application/pdf",
    };
  }
  // FOR INGESTION PURPOSES ONLY
  async fetchDocumentBuffer(documentId: string): Promise<Buffer> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new Error("Document Not Found");

    return new Promise((resolve, reject) => {
      https
        .get(document.fileUrl, (res) => {
          const chunks: Uint8Array[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        })
        .on("error", reject);
    });
  }
  async getDcoumentInfo(documentId: string) {
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });
    if (!document) {
      throw new Error("Document Not Found");
    }
    return document;
  }

  // List all documents (admin view)
  async listDocuments() {
    return prisma.document.findMany({
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get single document with status
  async getDocumentStatus(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        _count: { select: { chunks: true } },
      },
    });
    if (!document) throw new Error("Document Not Found");
    return document;
  }

  // Delete document — purges Qdrant vectors, Cloudinary asset, DB records
  async deleteDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new Error("Document Not Found");

    // 1. Delete vectors from Qdrant
    const COLLECTION = "documents";
    try {
      await qdrantClient.delete(COLLECTION, {
        filter: {
          must: [{ key: "documentId", match: { value: documentId } }],
        },
      });
    } catch (err) {
      console.warn("[Delete] Qdrant purge failed (ignored):", err);
    }

    // 2. Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(document.publicId, {
        resource_type: "raw",
      });
    } catch (err) {
      console.warn("[Delete] Cloudinary purge failed (ignored):", err);
    }

    // 3. Delete chunks + document from DB (cascade handles chunks)
    await prisma.document.delete({ where: { id: documentId } });

    return { deleted: true, documentId };
  }
}
