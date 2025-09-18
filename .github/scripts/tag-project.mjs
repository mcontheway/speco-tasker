#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAndPushTag, findRootDir } from "./utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = findRootDir(__dirname);

// Read the project's package.json
const pkgPath = join(rootDir, "package.json");

let pkg;
try {
	const pkgContent = readFileSync(pkgPath, "utf8");
	pkg = JSON.parse(pkgContent);
} catch (error) {
	console.error("Failed to read package.json:", error.message);
	process.exit(1);
}

// Ensure we have required fields
assert(pkg.name, "package.json must have a name field");
assert(pkg.version, "package.json must have a version field");

const tag = `${pkg.name}@${pkg.version}`;

// Create and push the tag if it doesn't exist
createAndPushTag(tag);
