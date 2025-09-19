// Mock for import.meta.url in ESM
const path = require("node:path");
const { fileURLToPath } = require("node:url");

// Mock import.meta.url for testing
const mockImportMetaUrl = `file://${path.resolve(__dirname, "../../src/index.js")}`;

module.exports = mockImportMetaUrl;
