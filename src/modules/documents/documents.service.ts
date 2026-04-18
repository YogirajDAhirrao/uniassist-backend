import cloudinary from "../../utils/cloudinary.js";
import streamifier from "streamifier";

export class DocumentService {
  async uploadPDF(file: Express.Multer.File): Promise<{
    url: string;
    public_id: string;
  }> {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.mimetype !== "application/pdf") {
      throw new Error("Only PDF files are allowed");
    }

    return new Promise((resolve, reject) => {
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

      uploadStream.on("error", reject);

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
