/**
 * manage-gitignore.js
 * Utility functions for managing .gitignore files
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * Manages .gitignore file content by merging template with existing content
 * @param {string} gitignorePath - Path to the .gitignore file
 * @param {string} templateContent - Template content to merge
 * @param {boolean} storeTasksInGit - Whether to store task files in Git (affects commenting)
 * @param {function} [log] - Optional logging function
 */
function manageGitignoreFile(
	gitignorePath,
	templateContent,
	storeTasksInGit,
	log,
) {
	try {
		// Ensure the directory exists
		const dir = path.dirname(gitignorePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		let existingContent = "";
		let isNewFile = true;

		// Read existing content if file exists
		if (fs.existsSync(gitignorePath)) {
			try {
				existingContent = fs.readFileSync(gitignorePath, "utf8");
				isNewFile = false;
			} catch (readError) {
				// If we can't read the file, treat it as a new file
				if (log) {
					log(
						"warn",
						`Could not read existing .gitignore file: ${readError.message}`,
					);
				}
				isNewFile = true;
			}
		}

		// Process the template content
		let processedTemplate = templateContent;

		// Handle task files section based on storeTasksInGit preference
		if (storeTasksInGit) {
			// Comment out task files if storing in Git
			processedTemplate = processedTemplate.replace(
				/^(tasks\.json|tasks\/)/gm,
				"# $1",
			);
		} else {
			// Uncomment task files if not storing in Git
			processedTemplate = processedTemplate.replace(
				/^# (tasks\.json|tasks\/)/gm,
				"$1",
			);
		}

		let finalContent;

		if (isNewFile) {
			// For new files, just use the processed template
			finalContent = processedTemplate;
		} else {
			// For existing files, merge content intelligently
			finalContent = mergeGitignoreContent(
				existingContent,
				processedTemplate,
				log,
			);
		}

		// Write the final content
		fs.writeFileSync(gitignorePath, finalContent, "utf8");

		// Log success
		if (log) {
			const action = isNewFile ? "Created" : "Updated";
			log("success", `${action} .gitignore file at ${gitignorePath}`);
		}
	} catch (error) {
		if (log) {
			log(
				"error",
				`Failed to ${isNewFile ? "create" : "update"} .gitignore file: ${error.message}`,
			);
		}
		throw error;
	}
}

/**
 * Merges existing .gitignore content with template content
 * @param {string} existingContent - Existing .gitignore content
 * @param {string} templateContent - Template content to merge
 * @param {function} [log] - Optional logging function
 * @returns {string} Merged content
 */
function mergeGitignoreContent(existingContent, templateContent, log) {
	const lines = existingContent.split("\n");
	const templateLines = templateContent.split("\n");

	// Track sections we've processed
	const processedSections = new Set();

	// Process template sections
	for (let i = 0; i < templateLines.length; i++) {
		const line = templateLines[i];

		// Check if this is a section header (starts with # and has content)
		if (line.match(/^#\s+\w/)) {
			const sectionName = line.trim();

			// Skip if we've already processed this section
			if (processedSections.has(sectionName)) {
				continue;
			}

			// Find the section in template
			const sectionStart = i;
			let sectionEnd = sectionStart + 1;

			// Find the end of this section (next section header or end of file)
			while (sectionEnd < templateLines.length) {
				const nextLine = templateLines[sectionEnd];
				if (nextLine.match(/^#\s+\w/) || nextLine.trim() === "") {
					break;
				}
				sectionEnd++;
			}

			const templateSection = templateLines.slice(sectionStart, sectionEnd);
			const sectionContent = templateSection.slice(1); // Skip the header

			// Check if this section already exists in the existing content
			const existingSectionIndex = findSectionInContent(lines, sectionName);

			if (existingSectionIndex >= 0) {
				// Section exists, merge the content
				mergeSectionContent(
					lines,
					existingSectionIndex,
					sectionContent,
					sectionName,
					log,
				);
			} else {
				// Section doesn't exist, add it at the end
				addSectionToContent(lines, templateSection);
			}

			processedSections.add(sectionName);
			i = sectionEnd - 1; // Skip to end of section
		}
	}

	return lines.join("\n");
}

/**
 * Finds a section in existing content
 * @param {string[]} lines - Content lines
 * @param {string} sectionName - Section name to find
 * @returns {number} Index of section start, or -1 if not found
 */
function findSectionInContent(lines, sectionName) {
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim() === sectionName) {
			return i;
		}
	}
	return -1;
}

/**
 * Merges section content into existing section
 * @param {string[]} lines - Content lines to modify
 * @param {number} sectionIndex - Index where section starts
 * @param {string[]} newContent - New content to merge
 * @param {string} sectionName - Section name for logging
 * @param {function} [log] - Optional logging function
 */
function mergeSectionContent(
	lines,
	sectionIndex,
	newContent,
	sectionName,
	log,
) {
	// Find the end of the existing section
	let sectionEnd = sectionIndex + 1;
	while (sectionEnd < lines.length) {
		const line = lines[sectionEnd];
		if (line.match(/^#\s+\w/) || line.trim() === "") {
			break;
		}
		sectionEnd++;
	}

	// Remove the existing section content (keep the header)
	const existingContent = lines.splice(
		sectionIndex + 1,
		sectionEnd - sectionIndex - 1,
	);

	// Create a set of existing entries for deduplication
	const existingEntries = new Set(
		existingContent
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("#")),
	);

	// Add new entries that don't already exist
	const mergedContent = [];
	for (const newLine of newContent) {
		const trimmedLine = newLine.trim();
		if (trimmedLine && !existingEntries.has(trimmedLine)) {
			mergedContent.push(newLine);
		}
	}

	// Insert merged content after the section header
	if (mergedContent.length > 0) {
		lines.splice(sectionIndex + 1, 0, ...mergedContent);
		if (log) {
			log(
				"info",
				`Added ${mergedContent.length} new entries to ${sectionName} section`,
			);
		}
	}
}

/**
 * Adds a new section to content
 * @param {string[]} lines - Content lines to modify
 * @param {string[]} sectionContent - Section content to add
 */
function addSectionToContent(lines, sectionContent) {
	// Add the section at the end, with a blank line before if needed
	if (lines.length > 0 && lines[lines.length - 1].trim() !== "") {
		lines.push("");
	}
	lines.push(...sectionContent);
}

module.exports = {
	manageGitignoreFile,
	mergeGitignoreContent,
	findSectionInContent,
	mergeSectionContent,
	addSectionToContent,
};
