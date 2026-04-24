import { prisma } from "../../lib/prisma.js";
import cloudinary from "../../utils/cloudinary.js";
import streamifier from "streamifier";
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
        return document;
    }
}
//# sourceMappingURL=documents.service.js.map