/**
 * BrandInfo 单元测试
 * 测试品牌信息实体的所有功能
 */

// SCOPE: 测试 BrandInfo 实体的完整功能，包括品牌信息管理、验证、显示和版本控制

const { BrandInfo } = require("../../src/models/BrandInfo");

describe("BrandInfo", () => {
	describe("构造函数", () => {
		test("应该使用默认配置创建实例", () => {
			const brand = new BrandInfo();

			expect(brand.name).toBeUndefined();
			expect(brand.command).toBeUndefined();
			expect(brand.version).toBeUndefined();
			expect(brand.shortName).toBeUndefined();
			expect(brand.author).toBeUndefined();
		});

		test("应该使用自定义配置覆盖默认值", () => {
			const customConfig = {
				name: "Custom Tasker",
				command: "custom-tasker",
				version: "2.0.0",
				shortName: "Custom",
			};

			const brand = new BrandInfo(customConfig);

			expect(brand.name).toBe("Custom Tasker");
			expect(brand.command).toBe("custom-tasker");
			expect(brand.version).toBe("2.0.0");
			expect(brand.shortName).toBe("Custom");
			// 未覆盖的保持默认值
			expect(brand.author).toBe("Speco Team");
		});

		test("应该处理空的配置对象", () => {
			const brand = new BrandInfo({});

			expect(brand.name).toBeUndefined();
			expect(brand.command).toBeUndefined();
		});

		test("应该正确设置元数据时间戳", () => {
			const brand = new BrandInfo();

			expect(brand.metadata.created).toBeDefined();
			expect(brand.metadata.updated).toBeDefined();
			expect(new Date(brand.metadata.created).getTime()).toBeGreaterThan(0);
		});

		test("应该处理null和undefined配置", () => {
			const brand1 = new BrandInfo(null);
			const brand2 = new BrandInfo(undefined);

			expect(brand1.name).toBe("Speco Tasker");
			expect(brand2.command).toBe("speco-tasker");
		});
	});

	describe("validate()", () => {
		test("应该验证有效的默认配置", () => {
			const brand = new BrandInfo();
			const result = brand.validate();

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		test("应该拒绝空的name", () => {
			const brand = new BrandInfo({ name: "" });
			const result = brand.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("name 必须是非空字符串");
		});

		test("应该拒绝null的name", () => {
			const brand = new BrandInfo({ name: null });
			const result = brand.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("name 必须是非空字符串");
		});

		test("应该拒绝非字符串的name", () => {
			const brand = new BrandInfo({ name: 123 });
			const result = brand.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("name 必须是非空字符串");
		});

		test("应该拒绝空的command", () => {
			const brand = new BrandInfo({ command: "" });
			const result = brand.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("command 必须是非空字符串");
		});

		test("应该拒绝过长的name", () => {
			const longName = "a".repeat(51);
			const brand = new BrandInfo({ name: longName });
			const result = brand.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("name 长度不能超过50字符");
		});

		test("应该拒绝无效的command格式", () => {
			const invalidCommands = [
				"Speco-Tasker",
				"speco_tasker",
				"SpecoTasker",
				"speco-tasker-",
			];

			invalidCommands.forEach((invalidCommand) => {
				const brand = new BrandInfo({ command: invalidCommand });
				const result = brand.validate();

				expect(result.valid).toBe(false);
				expect(result.errors).toContain(
					"command 只能包含小写字母、数字和中划线",
				);
			});
		});

		test("应该接受有效的command格式", () => {
			const validCommands = ["speco-tasker", "my-command", "test123", "a-b-c"];

			validCommands.forEach((validCommand) => {
				const brand = new BrandInfo({ command: validCommand });
				const result = brand.validate();

				expect(result.valid).toBe(true);
			});
		});

		test("应该拒绝无效的版本格式", () => {
			const invalidVersions = ["1.0", "1.0.0.0", "v1.0.0", "1.0.0-beta"];

			invalidVersions.forEach((invalidVersion) => {
				const brand = new BrandInfo({ version: invalidVersion });
				const result = brand.validate();

				expect(result.valid).toBe(false);
				expect(result.errors).toContain(
					"version 必须符合语义化版本格式 (MAJOR.MINOR.PATCH)",
				);
			});
		});

		test("应该接受有效的版本格式", () => {
			const validVersions = ["1.0.0", "2.1.3", "10.5.0", "0.0.1"];

			validVersions.forEach((validVersion) => {
				const brand = new BrandInfo({ version: validVersion });
				const result = brand.validate();

				expect(result.valid).toBe(true);
			});
		});

		test("应该拒绝无效的URL格式", () => {
			const invalidUrls = [
				"not-a-url",
				"http://",
				"https://",
				"ftp://example.com",
			];

			const urlFields = ["website", "repository", "documentation"];

			urlFields.forEach((field) => {
				invalidUrls.forEach((invalidUrl) => {
					const config = {};
					config[field] = invalidUrl;
					const brand = new BrandInfo(config);
					const result = brand.validate();

					expect(result.valid).toBe(false);
					expect(
						result.errors.some((error) =>
							error.includes(`${field} 必须是有效的URL格式`),
						),
					).toBe(true);
				});
			});
		});

		test("应该接受有效的URL格式", () => {
			const validUrls = [
				"https://example.com",
				"http://test.org",
				"https://github.com/user/repo",
			];

			const urlFields = ["website", "repository", "documentation"];

			urlFields.forEach((field) => {
				validUrls.forEach((validUrl) => {
					const config = {};
					config[field] = validUrl;
					const brand = new BrandInfo(config);
					const result = brand.validate();

					expect(result.valid).toBe(true);
				});
			});
		});

		test("应该接受空的URL字段", () => {
			const config = {
				website: "",
				repository: "",
				documentation: "",
			};
			const brand = new BrandInfo(config);
			const result = brand.validate();

			expect(result.valid).toBe(true);
		});

		test("应该累积多个验证错误", () => {
			const brand = new BrandInfo({
				name: "",
				command: "Invalid_Command",
				version: "invalid",
				website: "not-a-url",
			});
			const result = brand.validate();

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(1);
		});
	});

	describe("信息获取方法", () => {
		let brand;

		beforeEach(() => {
			brand = new BrandInfo({
				name: "Test App",
				command: "test-app",
				version: "1.0.0",
				shortName: "Test",
				tagline: "Test tagline",
				description: "Test description",
				author: "Test Author",
				license: "MIT",
				website: "https://example.com",
				repository: "https://github.com/test/repo",
			});
		});

		test("getDisplayInfo应该返回正确的显示信息", () => {
			const displayInfo = brand.getDisplayInfo();

			expect(displayInfo).toEqual({
				name: "Test App",
				shortName: "Test",
				tagline: "Test tagline",
				description: "Test description",
				version: "1.0.0",
				command: "test-app",
				author: "Test Author",
			});
		});

		test("getTechInfo应该返回正确的技术信息", () => {
			const techInfo = brand.getTechInfo();

			expect(techInfo).toEqual({
				version: "1.0.0",
				license: "MIT",
				author: "Test Author",
				website: "https://example.com",
				repository: "https://github.com/test/repo",
				documentation: "",
			});
		});

		test("getCLIInfo应该返回正确的CLI信息", () => {
			const cliInfo = brand.getCLIInfo();

			expect(cliInfo).toEqual({
				command: "test-app",
				name: "Test App",
				description: "Test description",
				version: "1.0.0",
			});
		});

		test("getSummary应该返回完整的品牌摘要", () => {
			const summary = brand.getSummary();

			expect(summary).toHaveProperty("display");
			expect(summary).toHaveProperty("tech");
			expect(summary).toHaveProperty("cli");
			expect(summary).toHaveProperty("metadata");

			expect(summary.display.name).toBe("Test App");
			expect(summary.tech.version).toBe("1.0.0");
			expect(summary.cli.command).toBe("test-app");
		});
	});

	describe("toJSON() 和 fromJSON()", () => {
		test("应该正确序列化为JSON", () => {
			const brand = new BrandInfo({
				name: "Test App",
				command: "test-app",
				version: "1.0.0",
			});
			const json = brand.toJSON();

			expect(json).toHaveProperty("name", "Test App");
			expect(json).toHaveProperty("command", "test-app");
			expect(json).toHaveProperty("version", "1.0.0");
			expect(json).toHaveProperty("metadata");
		});

		test("应该从JSON正确反序列化", () => {
			const originalBrand = new BrandInfo({
				name: "Test App",
				command: "test-app",
				version: "1.0.0",
			});

			const json = originalBrand.toJSON();
			const restoredBrand = BrandInfo.fromJSON(json);

			expect(restoredBrand.name).toBe("Test App");
			expect(restoredBrand.command).toBe("test-app");
			expect(restoredBrand.version).toBe("1.0.0");
			expect(restoredBrand instanceof BrandInfo).toBe(true);
		});

		test("应该保持对象相等性", () => {
			const brand1 = new BrandInfo({ name: "Test" });
			const json = brand1.toJSON();
			const brand2 = BrandInfo.fromJSON(json);

			expect(brand2.toJSON()).toEqual(brand1.toJSON());
		});
	});

	describe("静态方法", () => {
		test("getDefaultBrand应该返回默认品牌信息实例", () => {
			const defaultBrand = BrandInfo.getDefaultBrand();

			expect(defaultBrand).toBeInstanceOf(BrandInfo);
			expect(defaultBrand.name).toBeUndefined();
			expect(defaultBrand.command).toBeUndefined();
		});

		test("getDefaultBrand应该每次返回新的实例", () => {
			const brand1 = BrandInfo.getDefaultBrand();
			const brand2 = BrandInfo.getDefaultBrand();

			expect(brand1).not.toBe(brand2);
			expect(brand1.toJSON()).toEqual(brand2.toJSON());
		});

		test("createRebrand应该创建品牌重塑配置", () => {
			const oldBrand = {
				name: "Old Tasker",
				command: "old-tasker",
			};

			const newBrand = {
				name: "New Tasker",
				command: "new-tasker",
				version: "2.0.0",
			};

			const rebrandBrand = BrandInfo.createRebrand(oldBrand, newBrand);

			expect(rebrandBrand.name).toBe("New Tasker");
			expect(rebrandBrand.command).toBe("new-tasker");
			expect(rebrandBrand.version).toBe("2.0.0");
			expect(rebrandBrand.metadata.rebrand.from).toEqual(oldBrand);
			expect(rebrandBrand.metadata.rebrand.to).toEqual(newBrand);
		});
	});

	describe("update()", () => {
		let brand;

		beforeEach(() => {
			brand = new BrandInfo({
				name: "Original App",
				command: "original-app",
				version: "1.0.0",
			});
		});

		test("应该更新品牌信息", () => {
			brand.update({
				name: "Updated App",
				command: "updated-app",
			});

			expect(brand.name).toBe("Updated App");
			expect(brand.command).toBe("updated-app");
		});

		test("应该更新元数据时间戳", () => {
			const originalTimestamp = brand.metadata.updated;
			brand.update({ name: "Test" });

			expect(brand.metadata.updated).toBeDefined();
			expect(new Date(brand.metadata.updated).getTime()).toBeGreaterThanOrEqual(
				new Date(originalTimestamp).getTime(),
			);
		});

		test("应该忽略metadata字段的更新", () => {
			const originalMetadata = { ...brand.metadata };
			brand.update({
				name: "Test",
				metadata: { version: "9.9.9" },
			});

			expect(brand.name).toBe("Test");
			expect(brand.metadata.version).toBe(originalMetadata.version);
		});

		test("应该忽略不存在的字段", () => {
			const originalName = brand.name;
			brand.update({ nonexistentField: "value" });

			expect(brand.name).toBe(originalName);
		});

		test("应该处理空更新", () => {
			const originalJson = brand.toJSON();
			brand.update({});

			expect(brand.toJSON()).toEqual(originalJson);
		});
	});

	describe("版本管理方法", () => {
		test("isVersionCompatible应该正确检查版本兼容性", () => {
			const brand = new BrandInfo({ version: "1.2.3" });

			expect(brand.isVersionCompatible("1.0.0")).toBe(true);
			expect(brand.isVersionCompatible("1.3.0")).toBe(true);
			expect(brand.isVersionCompatible("2.0.0")).toBe(false);
			expect(brand.isVersionCompatible("")).toBe(false);
		});

		test("isVersionCompatible应该处理无效版本", () => {
			const brand = new BrandInfo({ version: "1.0.0" });

			expect(brand.isVersionCompatible(null)).toBe(false);
			expect(brand.isVersionCompatible(undefined)).toBe(false);
			expect(brand.isVersionCompatible("invalid")).toBe(false);
		});

		test("getVersionInfo应该返回正确的版本信息", () => {
			const brand = new BrandInfo({ version: "2.1.3" });
			const versionInfo = brand.getVersionInfo();

			expect(versionInfo).toEqual({
				major: 2,
				minor: 1,
				patch: 3,
				full: "2.1.3",
			});
		});

		test("getVersionInfo应该处理不完整的版本号", () => {
			const brand1 = new BrandInfo({ version: "1.0" });
			const brand2 = new BrandInfo({ version: "1" });
			const brand3 = new BrandInfo({ version: "" });

			expect(brand1.getVersionInfo()).toEqual({
				major: 1,
				minor: 0,
				patch: 0,
				full: "1.0",
			});

			expect(brand2.getVersionInfo()).toEqual({
				major: 1,
				minor: 0,
				patch: 0,
				full: "1",
			});

			expect(brand3.getVersionInfo()).toEqual({
				major: 0,
				minor: 0,
				patch: 0,
				full: "",
			});
		});
	});

	describe("clone()", () => {
		test("应该创建完整的克隆", () => {
			const original = new BrandInfo({
				name: "Test App",
				command: "test-app",
				version: "1.0.0",
			});

			const clone = original.clone();

			expect(clone).toBeInstanceOf(BrandInfo);
			expect(clone.name).toBe("Test App");
			expect(clone.command).toBe("test-app");
			expect(clone.version).toBe("1.0.0");
			expect(clone).not.toBe(original); // 不同的实例
		});

		test("应该独立于原始实例", () => {
			const original = new BrandInfo({ name: "Original" });
			const clone = original.clone();

			clone.update({ name: "Modified" });

			expect(original.name).toBe("Original");
			expect(clone.name).toBe("Modified");
		});
	});

	describe("边界情况和错误处理", () => {
		test("应该处理包含null值的配置", () => {
			const brand = new BrandInfo({
				name: null,
				command: null,
				version: null,
			});

			expect(brand.name).toBeNull(); // 保留原始值
			expect(brand.command).toBeNull(); // 保留原始值
			expect(brand.version).toBeNull(); // 保留原始值
		});

		test("应该处理不完整的配置对象", () => {
			const brand = new BrandInfo({ name: "Test" });

			expect(brand.name).toBe("Test");
			expect(brand.command).toBe("speco-tasker"); // 使用默认值
		});

		test("应该处理URL字段的null值", () => {
			const brand = new BrandInfo({
				website: null,
				repository: null,
				documentation: null,
			});

			expect(brand.website).toBeNull(); // 保留原始值
			expect(brand.repository).toBeNull(); // 保留原始值
			expect(brand.documentation).toBeNull(); // 保留原始值
		});
	});

	describe("性能和稳定性", () => {
		test("应该在多次调用中保持一致性", () => {
			const brand = new BrandInfo();

			const result1 = brand.validate();
			const result2 = brand.validate();

			expect(result1).toEqual(result2);
		});

		test("应该处理大量更新操作", () => {
			const brand = new BrandInfo();

			for (let i = 0; i < 100; i++) {
				brand.update({ tagline: `Tagline ${i}` });
			}

			expect(brand.tagline).toBe("Tagline 99");
		});

		test("应该正确处理深层克隆", () => {
			const original = new BrandInfo();
			const clone = original.clone();

			expect(original.toJSON()).toEqual(clone.toJSON());
		});
	});
});
