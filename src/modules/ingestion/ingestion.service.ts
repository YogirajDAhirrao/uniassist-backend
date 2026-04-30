import https from "https";
import FormData from "form-data";

import { DocumentService } from "../documents/documents.service.js";
import { UnstructuredService } from "./unstructures.service.js";
import { processText } from "../../utils/processText.js";
import { prisma } from "../../lib/prisma.js";
import { getEmbedding } from "./embedding.service.js";

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
      // and store
      const points = [];
      for (const chunk of createdChunks) {
        const embedding = await getEmbedding(chunk.content);
        points.push({
          id: chunk.id,
          vector: embedding,
          payload: {
            documentId: chunk.documentId,
            chunkIndex: chunk.chunkIndex,
          },
        });
      }

      // 6. store in vector DB
    } catch (error) {}
  }
}
