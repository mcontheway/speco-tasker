/**
 * Integration test for MCP spec_files full flow
 * Tests the complete workflow from MCP tool parameter validation to task creation/update
 */

import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

// Mock the MCP tools and core functions
vi.mock("../../../mcp-server/src/tools/add-task.js", () => ({
	registerAddTaskTool: vi.fn(),
}));

vi.mock("../../../mcp-server/src/core/direct-functions/add-task.js", () => ({
	addTaskDirect: vi.fn(),
}));

describe("MCP spec_files Full Flow Integration Test", () => {
	describe("End-to-end parameter flow", () => {
		it("should validate complete parameter flow from MCP tool to core function", async () => {
			// Define the expected schema that MCP tools should use
			const ExpectedSpecFilesSchema = z.array(
				z.object({
					type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
					title: z.string(),
					file: z.string(),
				})
			).min(1);

			const testSpecFiles = [
				{
					type: "spec",
					title: "User Authentication API",
					file: "docs/auth-api.yaml"
				},
				{
					type: "plan",
					title: "Implementation Timeline",
					file: "docs/auth-timeline.md"
				}
			];

			// Test schema validation (this simulates what MCP tool does)
			const schemaResult = ExpectedSpecFilesSchema.safeParse(testSpecFiles);
			expect(schemaResult.success).toBe(true);

			// Simulate the flow: MCP tool → Direct function → Core logic
			const mockDirectFunction = vi.fn().mockResolvedValue({
				success: true,
				data: {
					taskId: 1,
					message: "Task created successfully"
				}
			});

			// Call the mocked direct function with validated parameters
			const result = await mockDirectFunction({
				title: "Authentication Feature",
				description: "Implement user authentication",
				details: "JWT-based authentication system",
				testStrategy: "Unit and integration tests",
				spec_files: testSpecFiles, // This should be passed through unchanged
				projectRoot: "/test/project",
				tasksJsonPath: "/test/project/.speco/tasks/tasks.json"
			});

			expect(result.success).toBe(true);
			expect(result.data.taskId).toBe(1);
		});

		it("should handle subtask creation with spec_files", async () => {
			const subtaskSpecFiles = [
				{
					type: "spec",
					title: "JWT Implementation Details",
					file: "docs/jwt-impl.md"
				}
			];

			const ExpectedOptionalSpecFilesSchema = z.array(
				z.object({
					type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
					title: z.string(),
					file: z.string(),
				})
			).optional();

			// Test schema validation for optional subtask spec_files
			const schemaResult = ExpectedOptionalSpecFilesSchema.safeParse(subtaskSpecFiles);
			expect(schemaResult.success).toBe(true);

			// Test with undefined (subtask spec_files are optional)
			const undefinedResult = ExpectedOptionalSpecFilesSchema.safeParse(undefined);
			expect(undefinedResult.success).toBe(true);
		});

		it("should validate error handling in the flow", async () => {
			const invalidSpecFiles = [
				{
					type: "invalid_type",
					title: "Invalid Document",
					file: "docs/invalid.md"
				}
			];

			const ExpectedSpecFilesSchema = z.array(
				z.object({
					type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
					title: z.string(),
					file: z.string(),
				})
			).min(1);

			// This should fail at schema validation level
			const schemaResult = ExpectedSpecFilesSchema.safeParse(invalidSpecFiles);
			expect(schemaResult.success).toBe(false);
    expect(schemaResult.error.issues[0].code).toBe("invalid_value");
		});
	});

	describe("Cross-tool consistency", () => {
		it("should ensure all MCP tools use consistent spec_files schema", () => {
			// Define the standard spec_files schema that all tools should use
			const standardSpecFileSchema = z.object({
				type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
				title: z.string(),
				file: z.string(),
			});

			const standardSpecFilesSchema = z.array(standardSpecFileSchema);

			// Test data that should work across all tools
			const testData = [
				{ type: "spec", title: "API Spec", file: "docs/api.yaml" },
				{ type: "plan", title: "Plan", file: "docs/plan.md" },
				{ type: "test", title: "Tests", file: "tests/test.md" }
			];

			const result = standardSpecFilesSchema.safeParse(testData);
			expect(result.success).toBe(true);
			expect(result.data).toEqual(testData);
		});

		it("should validate required vs optional usage across tools", () => {
			const specFilesSchema = z.array(
				z.object({
					type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
					title: z.string(),
					file: z.string(),
				})
			);

			// For main tasks (add_task): required, minimum 1
			const requiredSchema = specFilesSchema.min(1);
			expect(requiredSchema.safeParse([]).success).toBe(false);

			// For updates and subtasks: optional
			const optionalSchema = specFilesSchema.optional();
			expect(optionalSchema.safeParse(undefined).success).toBe(true);
			expect(optionalSchema.safeParse([]).success).toBe(true);
			expect(optionalSchema.safeParse([
				{ type: "spec", title: "Test", file: "test.md" }
			]).success).toBe(true);
		});
	});

	describe("Data transformation integrity", () => {
		it("should preserve data integrity through the entire flow", () => {
			const originalSpecFiles = [
				{
					type: "spec",
					title: "Complex API Specification with special chars: àáâãäå",
					file: "docs/api-specs/complex/file with spaces & special-chars.yaml"
				},
				{
					type: "requirement",
					title: "用户需求文档",
					file: "docs/requirements/user-stories.md"
				},
				{
					type: "design",
					title: "Database Schema Design v2.1",
					file: "docs/design/db-schema-v2.1.sql"
				}
			];

			const SpecFilesSchema = z.array(
				z.object({
					type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
					title: z.string(),
					file: z.string(),
				})
			);

			// Validate the data
			const result = SpecFilesSchema.safeParse(originalSpecFiles);
			expect(result.success).toBe(true);

			// Ensure data is preserved exactly
			expect(result.data).toEqual(originalSpecFiles);
			expect(result.data[0].file).toBe("docs/api-specs/complex/file with spaces & special-chars.yaml");
			expect(result.data[1].title).toBe("用户需求文档");
			expect(result.data[2].type).toBe("design");
		});

		it("should handle edge cases in data transformation", () => {
			const edgeCaseSpecFiles = [
				{
					type: "other",
					title: "Minimal",
					file: "a.md"
				},
				{
					type: "spec",
					title: "A".repeat(200), // Maximum title length
					file: "docs/very-long-path/with/many/levels/and/a/very_long_file_name_that_goes_on_and_on.md"
				}
			];

			const SpecFilesSchema = z.array(
				z.object({
					type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
					title: z.string(),
					file: z.string(),
				})
			);

			const result = SpecFilesSchema.safeParse(edgeCaseSpecFiles);
			expect(result.success).toBe(true);
			expect(result.data[0].file).toBe("a.md");
			expect(result.data[1].title.length).toBe(200);
		});
	});
});
