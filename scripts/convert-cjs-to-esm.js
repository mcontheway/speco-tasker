#!/usr/bin/env node

/**
 * Script to convert .cjs test files to ESM format
 * Usage: node scripts/convert-cjs-to-esm.js
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Find all .test.cjs files
async function findCjsTestFiles() {
	const pattern = 'tests/**/*.test.cjs';
	const files = await glob(pattern, { cwd: process.cwd() });
	return files;
}

// Convert CommonJS to ESM syntax
function convertToESM(content, filePath) {
	let esmContent = content;

	// Convert require() statements to import statements
	esmContent = esmContent.replace(
		/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
		(match, varName, modulePath) => {
			// Handle relative paths - add .js extension for ESM
			let esmPath = modulePath;
			if (esmPath.startsWith('./') || esmPath.startsWith('../')) {
				esmPath = esmPath.replace(/\.js$/, '') + '.js';
			}
			return `import ${varName} from '${esmPath}'`;
		}
	);

	// Convert destructured require() statements
	esmContent = esmContent.replace(
		/const\s+\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\)/g,
		(match, destructured, modulePath) => {
			// Handle relative paths - add .js extension for ESM
			let esmPath = modulePath;
			if (esmPath.startsWith('./') || esmPath.startsWith('../')) {
				esmPath = esmPath.replace(/\.js$/, '') + '.js';
			}
			return `import { ${destructured} } from '${esmPath}'`;
		}
	);

	// Convert module.exports to export default
	esmContent = esmContent.replace(
		/module\.exports\s*=\s*/g,
		'export default '
	);

	return esmContent;
}

// Convert a single file
async function convertFile(filePath) {
	const fullPath = path.resolve(process.cwd(), filePath);
	const newPath = fullPath.replace(/\.cjs$/, '.js');

	try {
		const content = fs.readFileSync(fullPath, 'utf8');
		const esmContent = convertToESM(content, filePath);

		// Write the converted file
		fs.writeFileSync(newPath, esmContent, 'utf8');

		// Remove the original .cjs file
		fs.unlinkSync(fullPath);

		console.log(`✅ Converted: ${filePath} -> ${filePath.replace(/\.cjs$/, '.js')}`);
		return true;
	} catch (error) {
		console.error(`❌ Failed to convert ${filePath}:`, error.message);
		return false;
	}
}

// Main conversion process
async function main() {
	console.log('🔄 Starting CJS to ESM conversion for test files...\n');

	const cjsFiles = await findCjsTestFiles();
	console.log(`Found ${cjsFiles.length} .cjs test files to convert:\n`);

	for (const file of cjsFiles) {
		console.log(`  - ${file}`);
	}
	console.log('\n');

	let successCount = 0;
	let failCount = 0;

	for (const file of cjsFiles) {
		const success = await convertFile(file);
		if (success) {
			successCount++;
		} else {
			failCount++;
		}
	}

	console.log(`\n🎉 Conversion completed!`);
	console.log(`✅ Successfully converted: ${successCount} files`);
	console.log(`❌ Failed to convert: ${failCount} files`);

	if (failCount === 0) {
		console.log('\n🚀 All test files have been converted to ESM format!');
		console.log('   Make sure to update your Jest configuration if needed.');
	}
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { convertToESM, convertFile };
