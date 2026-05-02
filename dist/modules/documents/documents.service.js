import cloudinary from "../../utils/cloudinary.js";
import streamifier from "streamifier";
import https from "https";
import { prisma } from "../../lib/prisma.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
export class DocumentService {
    async uploadDocument(file, title, userId) {
        if (!file)
            throw new Error("No file provided");
        if (!title)
            throw new Error("Title is required");
        // 1️⃣ Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "documents",
                resource_type: "raw",
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (!result)
                    return reject(new Error("Upload failed"));
                resolve({
                    url: result.secure_url,
                    public_id: result.public_id,
                });
            });
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
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
    async getDocumentStream(documentId) {
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
    async fetchDocumentBuffer(documentId) {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document)
            throw new Error("Document Not Found");
        return new Promise((resolve, reject) => {
            https
                .get(document.fileUrl, (res) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(chunk));
                res.on("end", () => resolve(Buffer.concat(chunks)));
                res.on("error", reject);
            })
                .on("error", reject);
        });
    }
}
//# sourceMappingURL=documents.service.js.map