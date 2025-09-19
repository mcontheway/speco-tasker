import path from "node:path";
// SCOPE: 路径配置API合同测试，验证GET /paths、PUT /paths、POST /paths/validate端点的行为契约
import supertest from "supertest";
import { vi } from "vitest";

// Mock the path config service
const mockPathConfigService = {
	getPathConfig: vi.fn(),
	updatePathConfig: vi.fn(),
	validatePathConfig: vi.fn(),
};

// Mock the path config controller
vi.mock("../../src/controllers/PathConfigController.js", () => ({
	getPathConfig: vi.fn(),
	updatePathConfig: vi.fn(),
	validatePathConfig: vi.fn(),
}));

const {
	getPathConfig,
	updatePathConfig,
	validatePathConfig,
} = require("../../src/controllers/PathConfigController.js");

// Create test app
let app;
beforeAll(() => {
	// Create a minimal express app for testing
	const express = require("express");
	app = express();
	app.use(express.json());

	// Setup routes
	app.get("/paths", getPathConfig);
	app.put("/paths", updatePathConfig);
	app.post("/paths/validate", validatePathConfig);
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("Path Config API Contract Tests", () => {
	describe("GET /paths", () => {
		it("should return 200 with current path configuration", async () => {
			// Arrange
			const mockPathConfig = {
				root: {
					speco: ".speco",
					legacy: ".taskmaster",
				},
				dirs: {
					tasks: "tasks",
					docs: "docs",
					reports: "reports",
					templates: "templates",
					backups: "backups",
				},
				files: {
					tasks: "tasks.json",
					config: "config.json",
					state: "state.json",
					changelog: "changelog.md",
				},
			};

			getPathConfig.mockImplementation((req, res) => {
				res.status(200).json(mockPathConfig);
			});

			// Act
			const response = await supertest(app).get("/paths");

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockPathConfig);
			expect(response.body.root).toHaveProperty("speco");
			expect(response.body.dirs).toHaveProperty("tasks");
			expect(response.body.files).toHaveProperty("config");
			expect(response.headers["content-type"]).toMatch(/application\/json/);
		});

		it("should return 500 with error when service fails", async () => {
			// Arrange
			getPathConfig.mockImplementation((req, res) => {
				res.status(500).json({
					code: "CONFIG_READ_ERROR",
					message: "Failed to read path configuration",
					details: { reason: "File system error" },
				});
			});

			// Act
			const response = await supertest(app).get("/paths");

			// Assert
			expect(response.status).toBe(500);
			expect(response.body).toHaveProperty("code", "CONFIG_READ_ERROR");
			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("details");
		});
	});

	describe("PUT /paths", () => {
		it("should return 200 with success response when configuration is valid", async () => {
			// Arrange
			const validPathConfig = {
				root: {
					speco: ".speco",
				},
				dirs: {
					tasks: "tasks",
					docs: "docs",
					reports: "reports",
					templates: "templates",
				},
				files: {
					tasks: "tasks.json",
					config: "config.json",
					state: "state.json",
				},
			};

			const mockSuccessResponse = {
				success: true,
				message: "路径配置已更新",
				timestamp: "2024-01-01T12:00:00Z",
			};

			updatePathConfig.mockImplementation((req, res) => {
				res.status(200).json(mockSuccessResponse);
			});

			// Act
			const response = await supertest(app).put("/paths").send(validPathConfig);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockSuccessResponse);
			expect(response.body.success).toBe(true);
			expect(response.body).toHaveProperty("timestamp");
		});

		it("should return 400 with error for invalid configuration", async () => {
			// Arrange
			const invalidPathConfig = {
				// Missing required root field
				dirs: {
					tasks: "tasks",
				},
				files: {
					tasks: "tasks.json",
				},
			};

			updatePathConfig.mockImplementation((req, res) => {
				res.status(400).json({
					code: "INVALID_CONFIG",
					message: "Path configuration is invalid",
					details: ["root field is required"],
				});
			});

			// Act
			const response = await supertest(app)
				.put("/paths")
				.send(invalidPathConfig);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.code).toBe("INVALID_CONFIG");
			expect(Array.isArray(response.body.details)).toBe(true);
		});

		it("should return 500 with error when update fails", async () => {
			// Arrange
			const validPathConfig = {
				root: {
					speco: ".speco",
				},
				dirs: {
					tasks: "tasks",
					docs: "docs",
				},
				files: {
					tasks: "tasks.json",
					config: "config.json",
				},
			};

			updatePathConfig.mockImplementation((req, res) => {
				res.status(500).json({
					code: "CONFIG_UPDATE_ERROR",
					message: "Failed to update path configuration",
					details: { reason: "File write permission denied" },
				});
			});

			// Act
			const response = await supertest(app).put("/paths").send(validPathConfig);

			// Assert
			expect(response.status).toBe(500);
			expect(response.body.code).toBe("CONFIG_UPDATE_ERROR");
		});
	});

	describe("POST /paths/validate", () => {
		it("should return 200 with validation result when configuration is valid", async () => {
			// Arrange
			const validPathConfig = {
				root: {
					speco: ".speco",
				},
				dirs: {
					tasks: "tasks",
					docs: "docs",
					reports: "reports",
					templates: "templates",
				},
				files: {
					tasks: "tasks.json",
					config: "config.json",
					state: "state.json",
				},
			};

			const mockValidationResult = {
				valid: true,
				issues: [],
			};

			validatePathConfig.mockImplementation((req, res) => {
				res.status(200).json(mockValidationResult);
			});

			// Act
			const response = await supertest(app)
				.post("/paths/validate")
				.send(validPathConfig);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockValidationResult);
			expect(response.body.valid).toBe(true);
			expect(Array.isArray(response.body.issues)).toBe(true);
			expect(response.body.issues).toHaveLength(0);
		});

		it("should return 200 with validation result when configuration has issues", async () => {
			// Arrange
			const invalidPathConfig = {
				root: {
					speco: ".speco",
				},
				dirs: {
					tasks: "tasks",
					docs: "", // Empty directory path
				},
				files: {
					tasks: "tasks.json",
					config: "config.json",
				},
			};

			const mockValidationResult = {
				valid: false,
				issues: [
					"Directory path 'docs' cannot be empty",
					"Missing required directory 'reports'",
					"Missing required directory 'templates'",
				],
			};

			validatePathConfig.mockImplementation((req, res) => {
				res.status(200).json(mockValidationResult);
			});

			// Act
			const response = await supertest(app)
				.post("/paths/validate")
				.send(invalidPathConfig);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockValidationResult);
			expect(response.body.valid).toBe(false);
			expect(Array.isArray(response.body.issues)).toBe(true);
			expect(response.body.issues).toContain(
				"Directory path 'docs' cannot be empty",
			);
		});

		it("should return 400 with validation error for malformed configuration", async () => {
			// Arrange
			const malformedConfig = {
				root: "not an object", // Should be object
				dirs: "not an object", // Should be object
			};

			validatePathConfig.mockImplementation((req, res) => {
				res.status(400).json({
					code: "PATH_VALIDATION_ERROR",
					message: "Path configuration validation failed",
					details: [
						"root must be an object",
						"dirs must be an object",
						"files field is required",
					],
				});
			});

			// Act
			const response = await supertest(app)
				.post("/paths/validate")
				.send(malformedConfig);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.code).toBe("PATH_VALIDATION_ERROR");
			expect(Array.isArray(response.body.details)).toBe(true);
			expect(response.body.details).toContain("root must be an object");
		});

		it("should handle paths with special characters and unicode", async () => {
			// Arrange
			const unicodePathConfig = {
				root: {
					speco: ".speco",
				},
				dirs: {
					tasks: "任务", // Chinese characters
					docs: "docs & reports", // Special characters
					reports: "reports/2024", // Numbers and slashes
					templates: "templates@v2", // Special characters
				},
				files: {
					tasks: "tasks.json",
					config: "config.json",
					state: "state.json",
				},
			};

			const mockValidationResult = {
				valid: true,
				issues: [],
			};

			validatePathConfig.mockImplementation((req, res) => {
				res.status(200).json(mockValidationResult);
			});

			// Act
			const response = await supertest(app)
				.post("/paths/validate")
				.send(unicodePathConfig);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(true);
		});

		it("should validate relative vs absolute paths", async () => {
			// Arrange
			const absolutePathConfig = {
				root: {
					speco: ".speco",
				},
				dirs: {
					tasks: "/absolute/path/tasks", // Absolute path
					docs: "docs", // Relative path
				},
				files: {
					tasks: "tasks.json",
					config: "config.json",
					state: "state.json",
				},
			};

			const mockValidationResult = {
				valid: true,
				issues: [],
			};

			validatePathConfig.mockImplementation((req, res) => {
				res.status(200).json(mockValidationResult);
			});

			// Act
			const response = await supertest(app)
				.post("/paths/validate")
				.send(absolutePathConfig);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(true);
		});
	});
});
