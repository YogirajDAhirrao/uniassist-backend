// utils/processText.ts
/**
 * Extract raw text from Unstructured API response
 */
export function extractText(elements) {
    return elements
        .map((el) => el.text)
        .filter(Boolean)
        .join("\n");
}
/**
 * Clean and normalize text
 */
export function cleanText(text) {
    return text
        .replace(/\n+/g, "\n") // collapse multiple newlines
        .replace(/\s+/g, " ") // collapse spaces
        .trim();
}
/**
 * Chunk text with:
 * - sentence boundary awareness
 * - overlap (for context preservation)
 */
export function chunkText(text, chunkSize = 800, overlap = 150) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        let end = start + chunkSize;
        // 🔥 Try to end at sentence boundary
        const lastPeriod = text.lastIndexOf(".", end);
        if (lastPeriod > start + 100) {
            end = lastPeriod + 1;
        }
        const chunk = text.slice(start, end).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }
        // 🔥 Overlap to preserve context
        start += chunkSize - overlap;
    }
    return chunks;
}
/**
 * Full pipeline (recommended to use in ingestion)
 */
export function processText(elements, options) {
    const rawText = extractText(elements);
    const cleaned = cleanText(rawText);
    const chunks = chunkText(cleaned, options?.chunkSize ?? 800, options?.overlap ?? 150);
    return chunks;
}
//# sourceMappingURL=processText.js.map