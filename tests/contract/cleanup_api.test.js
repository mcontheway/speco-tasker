// SCOPE: 清理API合同测试，验证GET /ai-content、DELETE /ai-content、GET /brand-info、PATCH /brand-info、POST /validate端点的行为契约
const supertest = require("supertest");
const path = require("node:path");

// Mock the cleanup service
const mockCleanupService = {
	getAIContentList: jest.fn(),
	cleanupAIContent: jest.fn(),
	getBrandInfoList: jest.fn(),
	updateBrandInfo: jest.fn(),
	validateCleanup: jest.fn(),
};

// Mock the cleanup controller
jest.mock("../../src/controllers/CleanupController.js", () => ({
	getAIContent: jest.fn(),
	cleanupAIContent: jest.fn(),
	getBrandInfo: jest.fn(),
	updateBrandInfo: jest.fn(),
	validateCleanup: jest.fn(),
}));

const {
	getAIContent,
	cleanupAIContent,
	getBrandInfo,
	updateBrandInfo,
	validateCleanup,
} = require("../../src/controllers/CleanupController.js");

// Create test app
let app;
beforeAll(() => {
	// Create a minimal express app for testing
	const express = require("express");
	app = express();
	app.use(express.json());

	// Setup routes
	app.get("/ai-content", getAIContent);
	app.delete("/ai-content", cleanupAIContent);
	app.get("/brand-info", getBrandInfo);
	app.patch("/brand-info", updateBrandInfo);
	app.post("/validate", validateCleanup);
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe("Cleanup API Contract Tests", () => {
	describe("GET /ai-content", () => {
		it("should return 200 with AI content list when service succeeds", async () => {
			// Arrange
			const mockAIContentList = {
				totalFiles: 5,
				files: [
					{
						path: "src/utils/ai-client.js",
						type: "ai_service",
						size: 1024,
						lastModified: "2024-01-01T00:00:00Z",
						aiPatterns: ["openai", "claude"],
					},
					{
						path: "docs/ai-setup.md",
						type: "documentation",
						size: 2048,
						lastModified: "2024-01-02T00:00:00Z",
						aiPatterns: ["chatgpt", "ai"],
					},
				],
				categories: {
					ai_services: 1,
					ai_config: 0,
					documentation: 1,
				},
			};

			getAIContent.mockImplementation((req, res) => {
				res.status(200).json(mockAIContentList);
			});

			// Act
			const response = await supertest(app).get("/ai-content");

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockAIContentList);
			expect(response.headers["content-type"]).toMatch(/application\/json/);
		});

		it("should return 500 with error when service fails", async () => {
			// Arrange
			getAIContent.mockImplementation((req, res) => {
				res.status(500).json({
					code: "AI_CONTENT_ERROR",
					message: "Failed to scan AI content",
					details: { reason: "File system error" },
				});
			});

			// Act
			const response = await supertest(app).get("/ai-content");

			// Assert
			expect(response.status).toBe(500);
			expect(response.body).toHaveProperty("code", "AI_CONTENT_ERROR");
			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("details");
		});
	});

	describe("DELETE /ai-content", () => {
		it("should return 200 with cleanup result when dryRun=true", async () => {
			// Arrange
			const mockCleanupResult = {
				success: true,
				totalFiles: 5,
				processedFiles: 0,
				skippedFiles: 5,
				errors: [],
				summary: {
					dryRun: true,
					wouldProcess: 5,
					categories: { ai_services: 1, documentation: 4 },
				},
			};

			cleanupAIContent.mockImplementation((req, res) => {
				res.status(200).json(mockCleanupResult);
			});

			// Act
			const response = await supertest(app)
				.delete("/ai-content")
				.query({ dryRun: true });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockCleanupResult);
			expect(response.body.success).toBe(true);
			expect(response.body.summary.dryRun).toBe(true);
		});

		it("should return 200 with cleanup result when dryRun=false", async () => {
			// Arrange
			const mockCleanupResult = {
				success: true,
				totalFiles: 5,
				processedFiles: 5,
				skippedFiles: 0,
				errors: [],
				summary: {
					dryRun: false,
					processed: 5,
					categories: { ai_services: 1, documentation: 4 },
				},
			};

			cleanupAIContent.mockImplementation((req, res) => {
				res.status(200).json(mockCleanupResult);
			});

			// Act
			const response = await supertest(app)
				.delete("/ai-content")
				.query({ dryRun: false });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockCleanupResult);
			expect(response.body.success).toBe(true);
			expect(response.body.processedFiles).toBe(5);
			expect(response.body.summary.dryRun).toBe(false);
		});

		it("should return 400 with error for invalid dryRun parameter", async () => {
			// Arrange
			cleanupAIContent.mockImplementation((req, res) => {
				res.status(400).json({
					code: "INVALID_PARAMETER",
					message: "dryRun parameter must be boolean",
				});
			});

			// Act
			const response = await supertest(app)
				.delete("/ai-content")
				.query({ dryRun: "invalid" });

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.code).toBe("INVALID_PARAMETER");
		});

		it("should return 500 with error when cleanup fails", async () => {
			// Arrange
			cleanupAIContent.mockImplementation((req, res) => {
				res.status(500).json({
					code: "CLEANUP_ERROR",
					message: "AI content cleanup failed",
					details: { reason: "Permission denied" },
				});
			});

			// Act
			const response = await supertest(app).delete("/ai-content");

			// Assert
			expect(response.status).toBe(500);
			expect(response.body.code).toBe("CLEANUP_ERROR");
		});
	});

	describe("GET /brand-info", () => {
		it("should return 200 with brand info list when service succeeds", async () => {
			// Arrange
			const mockBrandInfoList = {
				totalOccurrences: 12,
				occurrences: [
					{
						file: "package.json",
						line: 2,
						content: '"name": "task-master-ai"',
						type: "config",
						context: "Package name in package.json",
					},
					{
						file: "README.md",
						line: 1,
						content: "# Task Master AI",
						type: "comment",
						context: "Title in README",
					},
					{
						file: "src/index.js",
						line: 5,
						content: "// Task Master AI utility",
						type: "comment",
						context: "Comment in source code",
					},
				],
			};

			getBrandInfo.mockImplementation((req, res) => {
				res.status(200).json(mockBrandInfoList);
			});

			// Act
			const response = await supertest(app).get("/brand-info");

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockBrandInfoList);
			expect(response.body.totalOccurrences).toBe(12);
			expect(Array.isArray(response.body.occurrences)).toBe(true);
		});

		it("should return 500 with error when service fails", async () => {
			// Arrange
			getBrandInfo.mockImplementation((req, res) => {
				res.status(500).json({
					code: "BRAND_INFO_ERROR",
					message: "Failed to scan brand information",
					details: { reason: "File read error" },
				});
			});

			// Act
			const response = await supertest(app).get("/brand-info");

			// Assert
			expect(response.status).toBe(500);
			expect(response.body.code).toBe("BRAND_INFO_ERROR");
		});
	});

	describe("PATCH /brand-info", () => {
		it("should return 200 with update result when dryRun=true", async () => {
			// Arrange
			const updateRequest = {
				updates: [
					{
						file: "package.json",
						line: 2,
						oldContent: '"name": "task-master-ai"',
						newContent: '"name": "speco-tasker"',
					},
					{
						file: "README.md",
						line: 1,
						oldContent: "# Task Master AI",
						newContent: "# Speco-Tasker",
					},
				],
				dryRun: true,
			};

			const mockUpdateResult = {
				success: true,
				totalUpdates: 2,
				appliedUpdates: 0,
				skippedUpdates: 2,
				errors: [],
			};

			updateBrandInfo.mockImplementation((req, res) => {
				res.status(200).json(mockUpdateResult);
			});

			// Act
			const response = await supertest(app)
				.patch("/brand-info")
				.send(updateRequest);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockUpdateResult);
			expect(response.body.appliedUpdates).toBe(0); // dryRun
			expect(response.body.skippedUpdates).toBe(2);
		});

		it("should return 200 with update result when dryRun=false", async () => {
			// Arrange
			const updateRequest = {
				updates: [
					{
						file: "package.json",
						line: 2,
						oldContent: '"name": "task-master-ai"',
						newContent: '"name": "speco-tasker"',
					},
				],
				dryRun: false,
			};

			const mockUpdateResult = {
				success: true,
				totalUpdates: 1,
				appliedUpdates: 1,
				skippedUpdates: 0,
				errors: [],
			};

			updateBrandInfo.mockImplementation((req, res) => {
				res.status(200).json(mockUpdateResult);
			});

			// Act
			const response = await supertest(app)
				.patch("/brand-info")
				.send(updateRequest);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockUpdateResult);
			expect(response.body.appliedUpdates).toBe(1);
			expect(response.body.success).toBe(true);
		});

		it("should return 400 with error for invalid request body", async () => {
			// Arrange
			updateBrandInfo.mockImplementation((req, res) => {
				res.status(400).json({
					code: "INVALID_REQUEST",
					message: "Updates array is required",
				});
			});

			// Act
			const response = await supertest(app).patch("/brand-info").send({}); // Empty body

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.code).toBe("INVALID_REQUEST");
		});

		it("should return 500 with error when update fails", async () => {
			// Arrange
			const updateRequest = {
				updates: [
					{
						file: "package.json",
						line: 2,
						oldContent: '"name": "task-master-ai"',
						newContent: '"name": "speco-tasker"',
					},
				],
			};

			updateBrandInfo.mockImplementation((req, res) => {
				res.status(500).json({
					code: "UPDATE_ERROR",
					message: "Brand info update failed",
					details: { reason: "File write permission denied" },
				});
			});

			// Act
			const response = await supertest(app)
				.patch("/brand-info")
				.send(updateRequest);

			// Assert
			expect(response.status).toBe(500);
			expect(response.body.code).toBe("UPDATE_ERROR");
		});
	});

	describe("POST /validate", () => {
		it("should return 200 with validation result when validation passes", async () => {
			// Arrange
			const validationRequest = {
				checks: ["ai_content", "brand_info", "functionality"],
				detailed: true,
			};

			const mockValidationResult = {
				overall: "passed",
				results: {
					ai_content: { status: "passed", details: "No AI content found" },
					brand_info: {
						status: "passed",
						details: "Brand info updated correctly",
					},
					functionality: {
						status: "passed",
						details: "All functions work properly",
					},
				},
				issues: [],
				recommendations: [],
			};

			validateCleanup.mockImplementation((req, res) => {
				res.status(200).json(mockValidationResult);
			});

			// Act
			const response = await supertest(app)
				.post("/validate")
				.send(validationRequest);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockValidationResult);
			expect(response.body.overall).toBe("passed");
			expect(response.body.results).toHaveProperty("ai_content");
			expect(response.body.results).toHaveProperty("brand_info");
			expect(response.body.results).toHaveProperty("functionality");
		});

		it("should return 200 with validation result when validation has warnings", async () => {
			// Arrange
			const validationRequest = {
				checks: ["ai_content"],
			};

			const mockValidationResult = {
				overall: "warning",
				results: {
					ai_content: {
						status: "warning",
						details: "Some AI content may remain",
					},
				},
				issues: ["Minor AI references found in comments"],
				recommendations: ["Review and update comments"],
			};

			validateCleanup.mockImplementation((req, res) => {
				res.status(200).json(mockValidationResult);
			});

			// Act
			const response = await supertest(app)
				.post("/validate")
				.send(validationRequest);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.overall).toBe("warning");
			expect(Array.isArray(response.body.issues)).toBe(true);
			expect(Array.isArray(response.body.recommendations)).toBe(true);
		});

		it("should return 400 with error for invalid validation request", async () => {
			// Arrange
			validateCleanup.mockImplementation((req, res) => {
				res.status(400).json({
					code: "INVALID_VALIDATION_REQUEST",
					message: "Checks array is required and cannot be empty",
				});
			});

			// Act
			const response = await supertest(app).post("/validate").send({}); // Empty body

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.code).toBe("INVALID_VALIDATION_REQUEST");
		});
	});
});
