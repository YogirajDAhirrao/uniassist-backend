
import { DocumentService } from "../documents/documents.service.js";
import { UnstructuredService } from "./unstructures.service.js";
import { processText } from "../../utils/processText.js";
import { prisma } from "../../lib/prisma.js";
import { getEmbedding } from "./embedding.service.js";
import { qdrantClient } from "../../lib/qdrant.js";

const COLLECTION = "documents";
const VECTOR_SIZE = 3072;
const EMBEDDING_CONCURRENCY = 3;

// Generate embeddings in small batches
async function generateEmbeddings(contents: string[]) {
  const embeddings: number[][] = [];

  for (
    let i = 0;
    i < contents.length;
    i += EMBEDDING_CONCURRENCY
  ) {
    const batch = contents.slice(
      i,
      i + EMBEDDING_CONCURRENCY
    );

    const batchEmbeddings = await Promise.all(
      batch.map((content) => getEmbedding(content))
    );

    embeddings.push(...batchEmbeddings);

    console.log(
      `[Ingestion] Generated ${embeddings.length}/${contents.length} embeddings`
    );
  }

  return embeddings;
}

export class IngestionService {
  async processDocument(documentId: string) {
    try {
      const documentService = new DocumentService();
      const unstructuredService = new UnstructuredService();

      // 1. Mark document as processing
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "PROCESSING" },
      });

      // 2. Download document
      const fileBuffer =
        await documentService.fetchDocumentBuffer(documentId);

      console.log("Buffer size:", fileBuffer.length);

      // 3. Extract text
      const extractedData =
        await unstructuredService.extractText(fileBuffer);

      console.log("Extracted elements:", extractedData.length);

      // 4. Generate chunks
      const chunks = processText(extractedData as any);

      console.log("Chunks:", chunks.length);

      if (chunks.length === 0) {
        throw new Error("No chunks generated from document");
      }

      // 5. Generate embeddings BEFORE replacing existing chunks
      const embeddings = await generateEmbeddings(chunks);

      // Validate embedding dimensions
      for (const [index, embedding] of embeddings.entries()) {
        if (embedding.length !== VECTOR_SIZE) {
          throw new Error(
            `Invalid embedding dimension at index ${index}: expected ${VECTOR_SIZE}, received ${embedding.length}`
          );
        }
      }

      console.log("Embeddings generated:", embeddings.length);

      // 6. Store chunks using bulk insertion
      console.time("chunk-transaction");

      const createdChunks = await prisma.$transaction(
        async (tx) => {
          await tx.documentChunk.deleteMany({
            where: { documentId },
          });

          await tx.documentChunk.createMany({
            data: chunks.map((content, index) => ({
              documentId,
              chunkIndex: index,
              content,
            })),
          });

          return tx.documentChunk.findMany({
            where: { documentId },
            orderBy: { chunkIndex: "asc" },
          });
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      );

      console.timeEnd("chunk-transaction");

      console.log("Chunks stored:", createdChunks.length);

      if (createdChunks.length !== embeddings.length) {
        throw new Error("Chunk and embedding counts do not match");
      }

      // 7. Ensure Qdrant collection exists
      const { exists } =
        await qdrantClient.collectionExists(COLLECTION);

      if (!exists) {
        console.log("Creating Qdrant collection...");

        await qdrantClient.createCollection(COLLECTION, {
          vectors: {
            size: VECTOR_SIZE,
            distance: "Cosine",
          },
        });
      }

      // 8. Build Qdrant points
      const points = createdChunks.map((chunk, index) => ({
        id: chunk.id,
        vector: embeddings[index],
        payload: {
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
        },
      }));

      // 9. Delete old vectors for this document
      await qdrantClient.delete(COLLECTION, {
        wait: true,
        filter: {
          must: [
            {
              key: "documentId",
              match: { value: documentId },
            },
          ],
        },
      });

      // 10. Upsert new vectors
      await qdrantClient.upsert(COLLECTION, {
        wait: true,
        points,
      });

      console.log("Embeddings stored in Qdrant:", points.length);

      // 11. Mark document as READY
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "READY" },
      });

      console.log("Document READY:", documentId);

    } catch (error) {
      console.error("Ingestion error:", error);

      // Mark document as FAILED
      try {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: "FAILED" },
        });
      } catch (statusError) {
        console.error(
          "Failed to update document status:",
          statusError
        );
      }

      // Important: propagate the error to the caller
      throw error;
    }
  }
}
