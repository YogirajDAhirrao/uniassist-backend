import { DocumentService } from "../documents/documents.service.js";
import { UnstructuredService } from "./unstructures.service.js";
export class IngestionService {
    async processDocument(documentId) {
        try {
            const documentService = new DocumentService();
            const unstructuredService = new UnstructuredService();
            // 1. download file from cloudinary URL
            const fileBuffer = await documentService.fetchDocumentBuffer(documentId);
            console.log("Buffer size:", fileBuffer.length);
            // 2. call unstructured API
            const extractedData = await unstructuredService.extractText(fileBuffer);
            console.log("Extracted Data:", extractedData);
            // 3. filter + extract chunks
            // 4. store chunks in Postgres
            // 5. generate embeddings
            // 6. store in vector DB
        }
        catch (error) { }
    }
}
//# sourceMappingURL=ingestion.service.js.map