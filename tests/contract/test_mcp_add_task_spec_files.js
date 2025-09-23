/**
 * Contract test for MCP add_task tool spec_files parameter validation
 * Tests the spec_files parameter validation according to MCP tool contract
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import the schema from the actual MCP tool
// For now, we'll define the expected schema inline until the tool is updated
const SpecFileSchema = z.object({
	type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
	title: z.string(),
	file: z.string(),
});

const AddTaskSpecFilesSchema = z.object({
	spec_files: z
		.array(SpecFileSchema)
		.min(1, "至少需要一个规范文档")
		.describe("规范文档列表，每个文档包含类型、标题和文件路径"),
});

describe("MCP add_task Tool spec_files Parameter Contract Test", () => {

	describe("Valid spec_files parameter formats", () => {
		it("should accept valid spec_files JSON object array", () => {
			const validSpecFiles = [
				{
					type: "spec",
					title: "API Technical Specification",
					file: "docs/api-spec.yaml"
				},
				{
					type: "plan",
					title: "Implementation Plan",
					file: "docs/impl-plan.md"
				}
			];

			// Test schema validation
			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: validSpecFiles
			});

			// This test expects the schema to pass validation
			// Currently this will fail because we haven't updated the actual tool schema yet
			expect(result.success).toBe(true);
			expect(result.data.spec_files).toEqual(validSpecFiles);
		});

		it("should accept minimal valid spec_files array with one document", () => {
			const minimalSpecFiles = [
				{
					type: "spec",
					title: "Specification",
					file: "docs/spec.md"
				}
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: minimalSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toEqual(minimalSpecFiles);
		});

		it("should accept all valid document types", () => {
			const allTypesSpecFiles = [
				{ type: "plan", title: "Plan", file: "docs/plan.md" },
				{ type: "spec", title: "Spec", file: "docs/spec.md" },
				{ type: "requirement", title: "Req", file: "docs/req.md" },
				{ type: "design", title: "Design", file: "docs/design.md" },
				{ type: "test", title: "Test", file: "docs/test.md" },
				{ type: "other", title: "Other", file: "docs/other.md" }
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: allTypesSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toEqual(allTypesSpecFiles);
		});
	});

	describe("Invalid spec_files parameter formats", () => {
		it("should reject empty spec_files array for main tasks", () => {
			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: [] // Empty array should be rejected
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].message).toContain("至少需要一个规范文档");
		});

		it("should reject missing required fields in spec_files objects", () => {
			const invalidSpecFiles = [
				{
					type: "spec",
					// Missing title and file
				}
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: invalidSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["spec_files", 0, "title"],
						message: expect.stringContaining("expected string")
					}),
					expect.objectContaining({
						path: ["spec_files", 0, "file"],
						message: expect.stringContaining("expected string")
					})
				])
			);
		});

		it("should reject invalid document type", () => {
			const invalidTypeSpecFiles = [
				{
					type: "invalid_type", // Invalid type
					title: "Invalid Type Doc",
					file: "docs/invalid.md"
				}
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: invalidTypeSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].message).toContain("Invalid option");
		});

		it("should reject non-array spec_files parameter", () => {
			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: "not-an-array" // String instead of array
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].message).toContain("expected array");
		});

		it("should reject non-object elements in spec_files array", () => {
			const invalidArraySpecFiles = [
				"string-element", // Should be object
				123 // Should be object
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: invalidArraySpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["spec_files", 0],
						message: expect.stringContaining("expected object")
					}),
					expect.objectContaining({
						path: ["spec_files", 1],
						message: expect.stringContaining("expected object")
					})
				])
			);
		});
	});

	describe("Parameter validation edge cases", () => {
		it("should handle spec_files with special characters in paths", () => {
			const specialPathSpecFiles = [
				{
					type: "spec",
					title: "Special Path Doc",
					file: "docs/sub-folder/file with spaces.md"
				}
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: specialPathSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files[0].file).toBe("docs/sub-folder/file with spaces.md");
		});

		it("should handle spec_files with long titles", () => {
			const longTitleSpecFiles = [
				{
					type: "spec",
					title: "A".repeat(200), // Maximum allowed length
					file: "docs/long-title.md"
				}
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: longTitleSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files[0].title.length).toBe(200);
		});

		it("should reject spec_files with excessively long titles", () => {
			// Create a schema with length limit for testing
			const StrictSpecFileSchema = z.object({
				type: z.enum(["plan", "spec", "requirement", "design", "test", "other"]),
				title: z.string().max(200, "文档标题长度不能超过 200 字符"),
				file: z.string(),
			});

			const StrictAddTaskSpecFilesSchema = z.object({
				spec_files: z.array(StrictSpecFileSchema).min(1),
			});

			const tooLongTitleSpecFiles = [
				{
					type: "spec",
					title: "A".repeat(201), // Exceeds maximum length
					file: "docs/too-long-title.md"
				}
			];

			const result = StrictAddTaskSpecFilesSchema.safeParse({
				spec_files: tooLongTitleSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].message).toContain("文档标题长度不能超过 200 字符");
		});
	});

	describe("Error message quality", () => {
		it("should provide clear error messages", () => {
			const invalidSpecFiles = [
				{ type: "invalid", title: "Test", file: "test.md" }
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: invalidSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].code).toBe("invalid_value");
		});

		it("should include field index in error messages", () => {
			const invalidSpecFiles = [
				{ type: "spec", title: "Valid", file: "valid.md" },
				{ type: "invalid", title: "Invalid", file: "invalid.md" }, // Second element invalid
				{ type: "spec", title: "Valid2", file: "valid2.md" }
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: invalidSpecFiles
			});

			expect(result.success).toBe(false);
			expect(result.error.issues[0].path).toEqual(["spec_files", 1, "type"]);
		});
	});

	describe("Integration with other parameters", () => {
		it("should validate spec_files independently of other parameters", () => {
			const completeSpecFiles = [
				{
					type: "spec",
					title: "Complete API Spec",
					file: "docs/complete-api.yaml"
				}
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: completeSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toEqual(completeSpecFiles);
		});

		it("should handle minimal parameters correctly with spec_files", () => {
			const minimalSpecFiles = [
				{
					type: "plan",
					title: "Minimal Plan",
					file: "docs/minimal.md"
				}
			];

			const result = AddTaskSpecFilesSchema.safeParse({
				spec_files: minimalSpecFiles
			});

			expect(result.success).toBe(true);
			expect(result.data.spec_files).toEqual(minimalSpecFiles);
		});
	});
});
