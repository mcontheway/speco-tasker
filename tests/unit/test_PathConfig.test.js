/**
 * PathConfig 单元测试
 * 测试路径配置实体的所有功能
 */

// SCOPE: 测试 PathConfig 实体的完整功能，包括配置验证、路径生成、序列化等核心业务逻辑

const { PathConfig } = require("../../src/models/PathConfig");

describe("PathConfig", () => {
	describe("构造函数", () => {
		test("应该使用默认配置创建实例", () => {
			const config = new PathConfig();

			expect(config.root.speco).toBe(".speco");
			expect(config.root.legacy).toBe(".taskmaster");
			expect(config.dirs.tasks).toBe("tasks");
			expect(config.files.tasks).toBe("tasks.json");
			expect(config.metadata.version).toBe("1.0.0");
		});

		test("应该使用自定义配置覆盖默认值", () => {
			const customConfig = {
				root: { speco: ".custom" },
				dirs: { tasks: "my-tasks" },
				files: { tasks: "my-tasks.json" },
			};

			const config = new PathConfig(customConfig);

			expect(config.root.speco).toBe(".custom");
			expect(config.root.legacy).toBe(".taskmaster"); // 未覆盖的保持默认值
			expect(config.dirs.tasks).toBe("my-tasks");
			expect(config.dirs.docs).toBe("docs"); // 未覆盖的保持默认值
			expect(config.files.tasks).toBe("my-tasks.json");
		});

		test("应该处理空的配置对象", () => {
			const config = new PathConfig({});

			expect(config.root.speco).toBe(".speco");
			expect(config.dirs.tasks).toBe("tasks");
		});

		test("应该正确设置元数据时间戳", () => {
			const config = new PathConfig();

			expect(config.metadata.created).toBeDefined();
			expect(config.metadata.updated).toBeDefined();
			expect(new Date(config.metadata.created).getTime()).toBeGreaterThan(0);
		});
	});

	describe("validate()", () => {
		test("应该验证有效的默认配置", () => {
			const config = new PathConfig();
			const result = config.validate();

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		test("应该拒绝空的root.speco", () => {
			const config = new PathConfig({ root: { speco: "" } });
			const result = config.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("root.speco 必须是非空字符串");
		});

		test("应该正确处理非字符串的root.speco", () => {
			const config = new PathConfig({ root: { speco: 123 } });

			// 构造函数应该将非字符串值转换为默认字符串值
			expect(typeof config.root.speco).toBe("string");
			expect(config.root.speco).toBe(".speco");

			// 验证应该通过，因为值已被转换为有效字符串
			const result = config.validate();
			expect(result.valid).toBe(true);
		});

		test("应该拒绝过长的路径", () => {
			const longPath = "a".repeat(256);
			const config = new PathConfig({ root: { speco: longPath } });
			const result = config.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("root.speco 路径长度不能超过255字符");
		});

		test("应该拒绝包含特殊字符的路径", () => {
			const invalidPaths = [
				".speco<",
				".speco>",
				".speco:",
				'.speco"',
				".speco|",
				".speco?",
				".speco*",
			];

			for (const invalidPath of invalidPaths) {
				const config = new PathConfig({ root: { speco: invalidPath } });
				const result = config.validate();

				expect(result.valid).toBe(false);
				expect(result.errors).toContain(
					'root.speco 不能包含特殊字符 < > : " | ? *',
				);
			}
		});

		test("应该验证目录配置的有效性", () => {
			const config = new PathConfig({ dirs: { tasks: "" } });
			const result = config.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("dirs.tasks 必须是非空字符串");
		});

		test("应该拒绝目录名包含特殊字符", () => {
			const config = new PathConfig({ dirs: { tasks: "my tasks" } });
			const result = config.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("dirs.tasks 只能包含字母、数字、下划线");
		});

		test("应该验证文件配置的有效性", () => {
			const config = new PathConfig({ files: { tasks: "" } });
			const result = config.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("files.tasks 必须是非空字符串");
		});

		test("应该拒绝文件名包含路径分隔符", () => {
			const config = new PathConfig({ files: { tasks: "path/to/file.json" } });
			const result = config.validate();

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("files.tasks 不能包含路径分隔符");
		});

		test("应该累积多个验证错误", () => {
			const config = new PathConfig({
				root: { speco: "" },
				dirs: { tasks: "invalid dir" },
				files: { tasks: "path/file.json" },
			});
			const result = config.validate();

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(1);
		});
	});

	describe("getPath()", () => {
		let config;

		beforeEach(() => {
			config = new PathConfig();
		});

		test("应该获取根路径", async () => {
			expect(await config.getPath("root", "speco")).toBe(".speco");
			expect(await config.getPath("root", "legacy")).toBe(".taskmaster");
		});

		test("应该获取目录路径", async () => {
			expect(await config.getPath("dir", "tasks")).toBe(".speco/tasks");
			expect(await config.getPath("dir", "docs")).toBe(".speco/docs");
		});

		test("应该获取文件路径", async () => {
			expect(await config.getPath("file", "tasks")).toBe(
				".speco/tasks/tasks.json",
			);
			expect(await config.getPath("file", "config")).toBe(
				".speco/config/config.json",
			);
		});

		test("应该处理未知的路径类型", async () => {
			await expect(config.getPath("unknown", "test")).rejects.toThrow(
				"未知的路径类型: unknown",
			);
		});

		test("应该处理不存在的路径键", async () => {
			expect(await config.getPath("root", "nonexistent")).toBe(".speco");
			expect(await config.getPath("dir", "nonexistent")).toBe(
				".speco/nonexistent",
			);
		});

		test("应该支持标签功能", async () => {
			expect(await config.getPath("root", "speco", "feature")).toBe(
				".speco_feature",
			);
			expect(await config.getPath("dir", "tasks", "feature")).toBe(
				".speco_feature/tasks",
			);
			expect(await config.getPath("file", "tasks", "feature")).toBe(
				".speco_feature/tasks/tasks.json",
			);
		});

		test("应该正确处理自定义配置的路径", async () => {
			const customConfig = new PathConfig({
				root: { speco: ".custom" },
				dirs: { tasks: "my-tasks" },
				files: { tasks: "my-tasks.json" },
			});

			expect(await customConfig.getPath("root", "speco")).toBe(".custom");
			expect(await customConfig.getPath("dir", "tasks")).toBe(
				".custom/my-tasks",
			);
			expect(await customConfig.getPath("file", "tasks")).toBe(
				".custom/my-tasks/my-tasks.json",
			);
		});
	});

	describe("getDirKeyForFile()", () => {
		let config;

		beforeEach(() => {
			config = new PathConfig();
		});

		test("应该返回文件对应的目录键", () => {
			expect(config.getDirKeyForFile("tasks")).toBe("tasks");
			expect(config.getDirKeyForFile("config")).toBe("config");
			expect(config.getDirKeyForFile("changelog")).toBe("docs");
			expect(config.getDirKeyForFile("brand")).toBe("config");
		});

		test("应该为未知文件返回默认目录", () => {
			expect(config.getDirKeyForFile("unknown")).toBe("config");
		});
	});

	describe("toJSON() 和 fromJSON()", () => {
		test("应该正确序列化为JSON", () => {
			const config = new PathConfig();
			const json = config.toJSON();

			expect(json).toHaveProperty("root");
			expect(json).toHaveProperty("dirs");
			expect(json).toHaveProperty("files");
			expect(json).toHaveProperty("tags");
			expect(json).toHaveProperty("metadata");

			expect(json.root.speco).toBe(".speco");
			expect(json.dirs.tasks).toBe("tasks");
			expect(json.files.tasks).toBe("tasks.json");
		});

		test("应该从JSON正确反序列化", () => {
			const originalConfig = new PathConfig({
				root: { speco: ".custom" },
				dirs: { tasks: "my-tasks" },
			});

			const json = originalConfig.toJSON();
			const restoredConfig = PathConfig.fromJSON(json);

			expect(restoredConfig.root.speco).toBe(".custom");
			expect(restoredConfig.dirs.tasks).toBe("my-tasks");
			expect(restoredConfig instanceof PathConfig).toBe(true);
		});

		test("应该保持对象相等性", () => {
			const config1 = new PathConfig();
			const json = config1.toJSON();
			const config2 = PathConfig.fromJSON(json);

			expect(config2.toJSON()).toEqual(config1.toJSON());
		});
	});

	describe("getDefaultConfig()", () => {
		test("应该返回默认配置实例", () => {
			const defaultConfig = PathConfig.getDefaultConfig();

			expect(defaultConfig).toBeInstanceOf(PathConfig);
			expect(defaultConfig.root.speco).toBe(".speco");
			expect(defaultConfig.dirs.tasks).toBe("tasks");
		});

		test("应该每次返回新的实例", () => {
			const config1 = PathConfig.getDefaultConfig();
			const config2 = PathConfig.getDefaultConfig();

			expect(config1).not.toBe(config2);
			expect(config1.toJSON()).toEqual(config2.toJSON());
		});
	});

	describe("update()", () => {
		let config;

		beforeEach(() => {
			config = new PathConfig();
		});

		test("应该更新根配置", () => {
			config.update({ root: { speco: ".updated" } });

			expect(config.root.speco).toBe(".updated");
			expect(config.root.legacy).toBe(".taskmaster"); // 未更新的保持原值
		});

		test("应该更新目录配置", () => {
			config.update({ dirs: { tasks: "updated-tasks" } });

			expect(config.dirs.tasks).toBe("updated-tasks");
			expect(config.dirs.docs).toBe("docs"); // 未更新的保持原值
		});

		test("应该递归更新嵌套对象", () => {
			config.update({
				root: { speco: ".updated" },
				dirs: { tasks: "updated-tasks" },
			});

			expect(config.root.speco).toBe(".updated");
			expect(config.dirs.tasks).toBe("updated-tasks");
		});

		test("应该更新元数据时间戳", () => {
			const originalTimestamp = config.metadata.updated;
			config.update({ dirs: { tasks: "test" } });

			// 时间戳应该被更新（至少在同一毫秒内）
			expect(config.metadata.updated).toBeDefined();
			expect(
				new Date(config.metadata.updated).getTime(),
			).toBeGreaterThanOrEqual(new Date(originalTimestamp).getTime());
		});

		test("应该处理空更新", () => {
			const originalJson = config.toJSON();
			config.update({});

			expect(config.toJSON()).toEqual(originalJson);
		});

		test("应该处理部分更新", () => {
			config.update({ root: { speco: ".partial" } });

			expect(config.root.speco).toBe(".partial");
			expect(config.dirs.tasks).toBe("tasks"); // 未更新的保持原值
		});
	});

	describe("getPathSnapshot()", () => {
		let config;

		beforeEach(() => {
			config = new PathConfig();
		});

		test("应该返回完整的路径快照", async () => {
			const snapshot = await config.getPathSnapshot();

			expect(snapshot).toHaveProperty("root");
			expect(snapshot).toHaveProperty("dirs");
			expect(snapshot).toHaveProperty("files");

			expect(snapshot.root.speco).toBe(".speco");
			expect(snapshot.dirs.tasks).toBe(".speco/tasks");
			expect(snapshot.files.tasks).toBe(".speco/tasks/tasks.json");
		});

		test("应该为所有目录生成路径", async () => {
			const snapshot = await config.getPathSnapshot();

			expect(snapshot.dirs.tasks).toBe(".speco/tasks");
			expect(snapshot.dirs.docs).toBe(".speco/docs");
			expect(snapshot.dirs.reports).toBe(".speco/reports");
			expect(snapshot.dirs.templates).toBe(".speco/templates");
		});

		test("应该为所有文件生成路径", async () => {
			const snapshot = await config.getPathSnapshot();

			expect(snapshot.files.tasks).toBe(".speco/tasks/tasks.json");
			expect(snapshot.files.config).toBe(".speco/config/config.json");
			expect(snapshot.files.state).toBe(".speco/config/state.json");
		});

		test("应该返回快照的副本而不是引用", async () => {
			const snapshot = await config.getPathSnapshot();

			snapshot.root.speco = ".modified";
			expect(config.root.speco).toBe(".speco"); // 原对象不受影响
		});
	});

	describe("边界情况和错误处理", () => {
		test("应该处理null和undefined配置", () => {
			const config1 = new PathConfig(null);
			const config2 = new PathConfig(undefined);

			expect(config1.root.speco).toBe(".speco");
			expect(config2.root.speco).toBe(".speco");
		});

		test("应该处理不完整的配置对象", () => {
			const config = new PathConfig({ root: {} });

			expect(config.root.speco).toBe(".speco");
			expect(config.root.legacy).toBe(".taskmaster");
		});

		test("应该处理包含null值的配置", () => {
			const config = new PathConfig({
				root: { speco: null },
				dirs: { tasks: null },
			});

			expect(config.root.speco).toBe(".speco"); // 使用默认值
			expect(config.dirs.tasks).toBe("tasks"); // 使用默认值
		});
	});

	describe("性能和稳定性", () => {
		test("应该在多次调用中保持一致性", () => {
			const config = new PathConfig();

			const result1 = config.validate();
			const result2 = config.validate();

			expect(result1).toEqual(result2);
		});

		test("应该处理大量配置更新", () => {
			const config = new PathConfig();

			for (let i = 0; i < 100; i++) {
				config.update({ dirs: { tasks: `tasks_${i}` } });
			}

			expect(config.dirs.tasks).toBe("tasks_99");
		});

		test("应该正确处理深层嵌套更新", () => {
			const config = new PathConfig();
			const originalTasksValue = config.dirs.tasks;

			config.update({ nonexistent: { deep: { value: "test" } } });

			expect(config.dirs.tasks).toBe(originalTasksValue); // 原有值不受影响
			expect(config.nonexistent.deep.value).toBe("test");
		});
	});
});
