/**
 * Contract test for MCP update_task tool spec_files parameter validation
 * Tests the spec_files parameter validation according to MCP tool contract
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Define the expected schema for update_task spec_files
const SpecFileSchema = z.object({
	type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
	title: z.string(),
	file: z.string(),
});

const UpdateTaskSpecFilesSchema = z.object({
	spec_files: z
		.array(SpecFileSchema)
		.optional()
		.describe("更新规范文档列表，每个文档包含类型、标题和文件路径"),
});

describe("MCP update_task Tool spec_files Parameter Contract Test", () => {
	describe("Valid spec_files parameter formats", () => {
		it("should accept valid spec_files JSON object array for updates", () => {
			const validSpecFiles = [
				{
					type: "spec",
					title: "Updated API Technical Specification",
					file: "docs/api-spec-v2.yaml"
				},
				{
					type: "test",
					title: "API Test Cases",
					file: "tests/api-tests.md"
				}
			];

			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: validSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toEqual(validSpecFiles);
		});

		it("should accept undefined spec_files (no update)", () => {
			const result = UpdateTaskSpecFilesSchema.safeParse({});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toBeUndefined();
		});

		it("should accept single document array", () => {
			const singleSpecFile = [
				{
					type: "plan",
					title: "Implementation Roadmap",
					file: "docs/roadmap.md"
				}
			];

			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: singleSpecFile
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toHaveLength(1);
		});
	});

	describe("Invalid spec_files parameter formats", () => {
		it("should reject invalid document type", () => {
			const invalidTypeSpecFiles = [
				{
					type: "invalid_type",
					title: "Invalid Type Doc",
					file: "docs/invalid.md"
				}
			];

			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: invalidTypeSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].message).toContain("Invalid enum value");
		});

		it("should reject missing required fields in spec_files objects", () => {
			const invalidSpecFiles = [
				{
					type: "spec",
					// Missing title and file
				}
			];

			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: invalidSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["spec_files", 0, "title"],
						message: expect.stringContaining("Required")
					}),
					expect.objectContaining({
						path: ["spec_files", 0, "file"],
						message: expect.stringContaining("Required")
					})
				])
			);
		});

		it("should reject non-array spec_files parameter", () => {
			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: "not-an-array"
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].message).toContain("Expected array");
		});
	});

	describe("Update-specific validation", () => {
		it("should handle empty array for clearing spec_files", () => {
			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: []
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toEqual([]);
		});

		it("should validate complex update scenarios", () => {
			const complexSpecFiles = [
				{ type: "plan", title: "Q1 Roadmap", file: "docs/q1-plan.md" },
				{ type: "spec", title: "API v2 Spec", file: "docs/api-v2.yaml" },
				{ type: "design", title: "UI Mockups", file: "docs/ui-design.pdf" },
				{ type: "test", title: "Integration Tests", file: "tests/integration.md" },
				{ type: "requirement", title: "User Requirements", file: "docs/requirements.md" }
			];

			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: complexSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toHaveLength(5);
		});
	});

	describe("Error message quality", () => {
		it("should include field index in error messages for arrays", () => {
			const invalidSpecFiles = [
				{ type: "spec", title: "Valid", file: "valid.md" },
				{ type: "invalid", title: "Invalid", file: "invalid.md" },
				{ type: "spec", title: "Valid2", file: "valid2.md" }
			];

			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: invalidSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].path).toEqual(["spec_files", 1, "type"]);
		});

		it("should provide clear error messages", () => {
			const result = UpdateTaskSpecFilesSchema.safeParse({
				spec_files: [{ type: "unknown", title: "Test", file: "test.md" }]
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].code).toBe("invalid_enum_value");
		});
	});
});
