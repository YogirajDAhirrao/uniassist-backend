import { qdrantClient } from "../lib/qdrant.js";
const COLLECTION = "documents";
export async function initQdrant() {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION);
    if (!exists) {
        console.log("Creating collection...");
        await qdrantClient.createCollection(COLLECTION, {
            vectors: {
                size: 3072,
                distance: "Cosine",
            },
        });
    }
    // ✅ ALWAYS ensure index exists
    try {
        await qdrantClient.createPayloadIndex(COLLECTION, {
            field_name: "documentId",
            field_schema: "keyword",
        });
        await qdrantClient.createPayloadIndex(COLLECTION, {
            field_name: "chunkIndex",
            field_schema: "integer",
        });
        console.log("Indexes ensured");
    }
    catch (err) {
        console.log("Indexes already exist");
    }
}
//# sourceMappingURL=qdrant-init.js.map