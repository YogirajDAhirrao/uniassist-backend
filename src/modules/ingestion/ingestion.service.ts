
import { DocumentService } from "../documents/documents.service.js";
import { UnstructuredService } from "./unstructures.service.js";
import { processText } from "../../utils/processText.js";
import { prisma } from "../../lib/prisma.js";
import { getEmbedding } from "./embedding.service.js";
import { qdrantClient } from "../../lib/qdrant.js";

export class IngestionService {
  async processDocument(documentId: string) {
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
      const chunks = processText(extractedData as any);

      // 4. store chunks in Postgres
      await prisma.documentChunk.deleteMany({
        where: { documentId },
      });

      const createdChunks = await prisma.$transaction(
        chunks.map((chunk, index) =>
          prisma.documentChunk.create({
            data: { documentId, chunkIndex: index, content: chunk },
          }),
        ),
      );

      console.log("Chunks stored:", createdChunks.length);

      // 5. generate embeddings
      const embeddings = await Promise.all(
        createdChunks.map((chunk) => getEmbedding(chunk.content)),
      );
      // build points
      const points = createdChunks.map((chunk, i) => ({
        id: chunk.id,
        vector: embeddings[i],
        payload: {
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
        },
      }));

      // 6. store in vector DB
      const COLLECTION = "documents";
      // ensure collection
      try {
        await qdrantClient.getCollection(COLLECTION);
        await qdrantClient.createPayloadIndex(COLLECTION, {
          field_name: "documentId",
          field_schema: "keyword", // or "uuid"
        });
      } catch {
        await qdrantClient.createCollection(COLLECTION, {
          vectors: {
            size: 3072,
            distance: "Cosine",
          },
        });
      }

      // delete old vectors for this document
      await qdrantClient.delete(COLLECTION, {
        filter: {
          must: [
            {
              key: "documentId",
              match: { value: documentId },
            },
          ],
        },
      });

      // upsert new vectors
      await qdrantClient.upsert(COLLECTION, {
        points,
      });

      console.log("Embeddings stored in Qdrant:", points.length);

      await prisma.document.update({
        where: { id: documentId },
        data: { status: "READY" },
      });
      console.log("Document READY:", documentId);
    } catch (error) {
      console.error("Ingestion error:", error);

      //  MARK AS FAILED
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "FAILED" },
      });
    }
  }
}
