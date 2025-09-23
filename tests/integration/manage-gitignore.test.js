/**
 * Integration tests for manage-gitignore.js module
 * Tests actual file system operations in a temporary directory
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { manageGitignoreFile } from "../../src/utils/manage-gitignore.js";

describe("manage-gitignore.js Integration Tests", () => {
	let tempDir;
	let testGitignorePath;

	beforeEach(() => {
		// Create a temporary directory for each test
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitignore-test-"));
		testGitignorePath = path.join(tempDir, ".gitignore");
	});

	afterEach(() => {
		// Clean up temporary directory after each test
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	describe("New File Creation", () => {
		const templateContent = `# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules/
jspm_packages/

# Environment variables
.env
.env.local

# Task files
tasks.json
tasks/ `;

		test("should create new .gitignore file with commented task lines (storeTasksInGit = true)", () => {
			const logs = [];
			const mockLog = (level, message) => logs.push({ level, message });

			manageGitignoreFile(testGitignorePath, templateContent, true, mockLog);

			// Verify file was created
			expect(fs.existsSync(testGitignorePath)).toBe(true);

			// Verify content
			const content = fs.readFileSync(testGitignorePath, "utf8");
			expect(content).toContain("# Logs");
			expect(content).toContain("logs");
			expect(content).toContain("# Dependencies");
			expect(content).toContain("node_modules/");
			expect(content).toContain("# Task files");
			expect(content).toContain("tasks.json");
			expect(content).toContain("tasks/");

			// Verify task lines are commented (storeTasksInGit = true)
			expect(content).toMatch(
				/# Task files\s*[\r\n]+# tasks\.json\s*[\r\n]+# tasks\/ /,
			);

			// Verify log message
			expect(logs).toContainEqual({
				level: "success",
				message: expect.stringContaining("Created"),
			});
		});

		test("should work without log function", () => {
			expect(() => {
				manageGitignoreFile(testGitignorePath, templateContent, false);
			}).not.toThrow();

			expect(fs.existsSync(testGitignorePath)).toBe(true);
		});
	});
});
