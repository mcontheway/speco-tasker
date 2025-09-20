// Mock for import.meta.url in ESM
import path from "node:path";
import { fileURLToPath } from "node:url";

// Mock import.meta.url for testing
const mockImportMetaUrl = `file://${path.resolve(process.cwd(), "src/index.js")}`;

export default mockImportMetaUrl;
