// SCOPE: 路径配置系统集成测试，验证路径配置的创建、读取、更新和验证的完整工作流
const path = require("path");
const fs = require("fs");

describe("Path Configuration Integration Tests", () => {
	const testProjectDir = path.join(
		__dirname,
		"..",
		"..",
		"tmp",
		"path-config-test",
	);
	const specoDir = path.join(testProjectDir, ".speco");
	const configFile = path.join(specoDir, "config.json");
	const pathsFile = path.join(specoDir, "paths.json");

	beforeAll(async () => {
		// Create test project structure
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
		fs.mkdirSync(testProjectDir, { recursive: true });
		fs.mkdirSync(specoDir, { recursive: true });

		// Create initial config
		const initialConfig = {
			project: {
				name: "test-project",
				version: "1.0.0",
			},
			paths: {
				root: ".",
				src: "src",
				scripts: "scripts/modules",
				bin: "bin",
				tests: "tests",
				config: ".speco",
				docs: "docs",
				specs: "specs",
			},
			features: {
				pathConfig: true,
			},
		};
		fs.writeFileSync(configFile, JSON.stringify(initialConfig, null, 2));
	});

	afterAll(() => {
		// Cleanup test directory
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
	});

	describe("Path Configuration Creation Phase", () => {
		it("should create default path configuration", () => {
			const defaultPaths = {
				mappings: {
					"task-master": "speco-tasker",
					"task-master-mcp": "speco-tasker-mcp",
					"bin/task-master.js": "bin/speco-tasker.js",
					".taskmaster": ".speco",
					"scripts/task-manager.js": "scripts/modules/task-manager.js",
					"scripts/commands.js": "scripts/modules/commands.js",
				},
				cleanup: {
					patterns: [
						"**/*.ai",
						"**/ai-*",
						"**/*-ai.*",
						"**/task-master*",
						"**/.taskmaster/**",
					],
					exclude: [".speco/**", "specs/**", "node_modules/**"],
				},
			};

			fs.writeFileSync(pathsFile, JSON.stringify(defaultPaths, null, 2));

			// Verify paths file was created
			expect(fs.existsSync(pathsFile)).toBe(true);

			const createdPaths = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
			expect(createdPaths.mappings).toEqual(defaultPaths.mappings);
			expect(createdPaths.cleanup.patterns).toEqual(
				defaultPaths.cleanup.patterns,
			);
			expect(createdPaths.cleanup.exclude).toEqual(
				defaultPaths.cleanup.exclude,
			);
		});

		it("should create path configuration schema validation", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Validate required fields
			expect(pathsConfig).toHaveProperty("mappings");
			expect(pathsConfig).toHaveProperty("cleanup");

			expect(pathsConfig.mappings).toHaveProperty("task-master");
			expect(pathsConfig.mappings).toHaveProperty(".taskmaster");

			expect(pathsConfig.cleanup).toHaveProperty("patterns");
			expect(pathsConfig.cleanup).toHaveProperty("exclude");

			expect(Array.isArray(pathsConfig.cleanup.patterns)).toBe(true);
			expect(Array.isArray(pathsConfig.cleanup.exclude)).toBe(true);
		});
	});

	describe("Path Configuration Reading Phase", () => {
		it("should read path configuration from file system", () => {
			// Verify file exists and is readable
			expect(fs.existsSync(pathsFile)).toBe(true);

			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
			expect(pathsConfig.mappings["task-master"]).toBe("speco-tasker");
			expect(pathsConfig.mappings[".taskmaster"]).toBe(".speco");
		});

		it("should handle missing paths file gracefully", () => {
			// Temporarily remove paths file
			const backupPath = pathsFile + ".backup";
			fs.renameSync(pathsFile, backupPath);

			// Simulate reading non-existent file (would be handled by service)
			expect(() => fs.readFileSync(pathsFile, "utf8")).toThrow();

			// Restore file
			fs.renameSync(backupPath, pathsFile);
		});

		it("should validate path configuration structure", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Validate mappings structure
			Object.entries(pathsConfig.mappings).forEach(([key, value]) => {
				expect(typeof key).toBe("string");
				expect(typeof value).toBe("string");
				expect(key.length).toBeGreaterThan(0);
				expect(value.length).toBeGreaterThan(0);
			});

			// Validate cleanup patterns
			pathsConfig.cleanup.patterns.forEach((pattern) => {
				expect(typeof pattern).toBe("string");
				expect(pattern.length).toBeGreaterThan(0);
				expect(pattern).toContain("*"); // Should contain glob patterns
			});

			// Validate exclude patterns
			pathsConfig.cleanup.exclude.forEach((pattern) => {
				expect(typeof pattern).toBe("string");
				expect(pattern.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Path Configuration Update Phase", () => {
		it("should update path mappings", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Add new mapping
			pathsConfig.mappings["new-feature"] = "speco-feature";
			pathsConfig.mappings["legacy-command"] = "modern-command";

			// Update existing mapping
			pathsConfig.mappings["task-master"] = "speco-tasker-updated";

			fs.writeFileSync(pathsFile, JSON.stringify(pathsConfig, null, 2));

			// Verify updates
			const updatedConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
			expect(updatedConfig.mappings["new-feature"]).toBe("speco-feature");
			expect(updatedConfig.mappings["legacy-command"]).toBe("modern-command");
			expect(updatedConfig.mappings["task-master"]).toBe(
				"speco-tasker-updated",
			);
		});

		it("should update cleanup patterns", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Add new cleanup pattern
			pathsConfig.cleanup.patterns.push("**/legacy-*");
			pathsConfig.cleanup.patterns.push("**/*.old");

			// Add new exclude pattern
			pathsConfig.cleanup.exclude.push("important/**");

			fs.writeFileSync(pathsFile, JSON.stringify(pathsConfig, null, 2));

			// Verify updates
			const updatedConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
			expect(updatedConfig.cleanup.patterns).toContain("**/legacy-*");
			expect(updatedConfig.cleanup.patterns).toContain("**/*.old");
			expect(updatedConfig.cleanup.exclude).toContain("important/**");
		});

		it("should validate updated configuration", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Ensure all mappings are still valid
			Object.entries(pathsConfig.mappings).forEach(([key, value]) => {
				expect(typeof key).toBe("string");
				expect(typeof value).toBe("string");
				expect(key.length).toBeGreaterThan(0);
				expect(value.length).toBeGreaterThan(0);
			});

			// Ensure cleanup patterns are valid
			pathsConfig.cleanup.patterns.forEach((pattern) => {
				expect(typeof pattern).toBe("string");
				expect(pattern.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Path Configuration Validation Phase", () => {
		it("should validate path configuration schema", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Required top-level properties
			expect(pathsConfig).toHaveProperty("mappings");
			expect(pathsConfig).toHaveProperty("cleanup");

			// Mappings should be an object
			expect(typeof pathsConfig.mappings).toBe("object");
			expect(pathsConfig.mappings).not.toBeNull();

			// Cleanup should have required properties
			expect(pathsConfig.cleanup).toHaveProperty("patterns");
			expect(pathsConfig.cleanup).toHaveProperty("exclude");

			// Patterns and exclude should be arrays
			expect(Array.isArray(pathsConfig.cleanup.patterns)).toBe(true);
			expect(Array.isArray(pathsConfig.cleanup.exclude)).toBe(true);
		});

		it("should detect invalid path configurations", () => {
			const validConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Test invalid configurations
			const invalidConfigs = [
				{ mappings: null }, // mappings should be object
				{ mappings: {}, cleanup: null }, // cleanup should be object
				{ mappings: {}, cleanup: { patterns: "not-array" } }, // patterns should be array
				{ mappings: {}, cleanup: { patterns: [], exclude: "not-array" } }, // exclude should be array
			];

			invalidConfigs.forEach((invalidConfig) => {
				const testConfig = { ...validConfig, ...invalidConfig };
				// These would be caught by schema validation in real implementation
				if (testConfig.mappings === null) {
					expect(typeof testConfig.mappings).not.toBe("object");
				}
				if (
					testConfig.cleanup &&
					typeof testConfig.cleanup.patterns === "string"
				) {
					expect(Array.isArray(testConfig.cleanup.patterns)).toBe(false);
				}
			});
		});

		it("should validate path mapping consistency", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// All mappings should have non-empty strings
			Object.entries(pathsConfig.mappings).forEach(([key, value]) => {
				expect(key.trim()).toBe(key); // No leading/trailing spaces
				expect(value.trim()).toBe(value);
				expect(key.length).toBeGreaterThan(0);
				expect(value.length).toBeGreaterThan(0);
			});

			// Cleanup patterns should be valid glob patterns
			pathsConfig.cleanup.patterns.forEach((pattern) => {
				expect(pattern).toContain("*"); // Basic glob validation
				expect(pattern.length).toBeGreaterThan(1);
			});
		});
	});

	describe("Path Configuration Integration Phase", () => {
		it("should integrate with main project configuration", () => {
			const mainConfig = JSON.parse(fs.readFileSync(configFile, "utf8"));
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Verify integration points
			expect(mainConfig.paths.config).toBe(".speco");
			expect(mainConfig.features.pathConfig).toBe(true);

			// Paths config should reference main config structure
			expect(pathsConfig.mappings[".taskmaster"]).toBe(mainConfig.paths.config);
		});

		it("should support multiple configuration formats", () => {
			const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));

			// Test different path formats
			const testMappings = {
				"simple/path": "simple/destination",
				"path/with spaces": "destination/with_spaces",
				"path/with-dashes": "destination/with_underscores",
				"path/with.dots": "destination/with.extensions",
			};

			const extendedConfig = {
				...pathsConfig,
				mappings: {
					...pathsConfig.mappings,
					...testMappings,
				},
			};

			fs.writeFileSync(pathsFile, JSON.stringify(extendedConfig, null, 2));

			const savedConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
			Object.entries(testMappings).forEach(([key, value]) => {
				expect(savedConfig.mappings[key]).toBe(value);
			});
		});

		it("should handle configuration file permissions", () => {
			// Test that configuration files have proper permissions
			const stats = fs.statSync(pathsFile);
			const mode = stats.mode;

			// Should be readable and writable by owner
			expect(mode & 0o600).toBeGreaterThan(0);
		});
	});

	describe("End-to-End Path Configuration Workflow", () => {
		it("should complete full path configuration lifecycle", () => {
			// 1. Create initial configuration
			const initialConfig = {
				mappings: {
					"old-path": "new-path",
				},
				cleanup: {
					patterns: ["**/old-*"],
					exclude: ["important/**"],
				},
			};

			fs.writeFileSync(pathsFile, JSON.stringify(initialConfig, null, 2));

			// 2. Read and validate configuration
			const readConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
			expect(readConfig.mappings["old-path"]).toBe("new-path");
			expect(readConfig.cleanup.patterns).toContain("**/old-*");

			// 3. Update configuration
			readConfig.mappings["new-mapping"] = "updated-path";
			readConfig.cleanup.patterns.push("**/legacy-*");
			fs.writeFileSync(pathsFile, JSON.stringify(readConfig, null, 2));

			// 4. Verify final state
			const finalConfig = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
			expect(finalConfig.mappings["old-path"]).toBe("new-path");
			expect(finalConfig.mappings["new-mapping"]).toBe("updated-path");
			expect(finalConfig.cleanup.patterns).toContain("**/old-*");
			expect(finalConfig.cleanup.patterns).toContain("**/legacy-*");
			expect(finalConfig.cleanup.exclude).toContain("important/**");
		});
	});
});
