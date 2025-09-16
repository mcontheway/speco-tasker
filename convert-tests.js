const fs = require('fs')
const path = require('path')

// Find all .cjs test files
const testDirs = ['tests/contract', 'tests/integration']
const files = []

testDirs.forEach((dir) => {
	if (fs.existsSync(dir)) {
		const dirFiles = fs
			.readdirSync(dir)
			.filter((file) => file.endsWith('.cjs'))
			.map((file) => path.join(dir, file))
		files.push(...dirFiles)
	}
})

// Convert each file
files.forEach((filePath) => {
	console.log(`Converting ${filePath}...`)

	let content = fs.readFileSync(filePath, 'utf8')

	// Convert ES modules imports to CommonJS
	content = content.replace(
		/import\s*\{\s*jest\s*\}\s*from\s*['"]@jest\/globals['"]/g,
		"const { jest } = require('@jest/globals')"
	)
	content = content.replace(
		/import\s*jest\s*from\s*['"]@jest\/globals['"]/g,
		"const jest = require('@jest/globals')"
	)

	// Convert other imports (simplified for this example)
	content = content.replace(
		/import\s+([\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g,
		(match, imports, module) => {
			// Skip jest imports as we already handled them
			if (module === '@jest/globals') return match

			// Convert to require
			return `const ${imports} = require('${module}')`
		}
	)

	// Write back
	fs.writeFileSync(filePath, content, 'utf8')
})

console.log(`Converted ${files.length} files`)
