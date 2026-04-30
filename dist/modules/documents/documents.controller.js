import https from "https";
import { DocumentService } from "./documents.service.js";
const documentService = new DocumentService();
export const uploadDocument = async (req, res) => {
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
        const document = await documentService.uploadDocument(file, title, req.user.userId);
        return res.status(201).json({
            message: "Document uploaded",
            document,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { url, fileName, contentType } = await documentService.getDocumentStream(id);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        https
            .get(url, (fileRes) => {
            fileRes.pipe(res);
        })
            .on("error", (err) => {
            res.status(500).json({ message: "Download failed" });
        });
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
};
//# sourceMappingURL=documents.controller.js.map