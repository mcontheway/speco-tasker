/**
 * 路径配置实体
 * 管理项目中所有文件和目录的路径映射，支持动态路径生成和管理
 */

/**
 * PathConfig 类
 * 负责管理项目路径配置的实体类
 */
class PathConfig {
	/**
	 * 构造函数
	 * @param {Object} config - 配置对象
	 */
	constructor(config = {}) {
		// 根目录配置
		this.root = {
			speco:
				config?.root && typeof config.root.speco === "string"
					? config.root.speco
					: ".speco",
			legacy:
				config?.root && typeof config.root.legacy === "string"
					? config.root.legacy
					: ".taskmaster",
		};

		// 性能优化：延迟初始化缓存管理器
		this._cacheManager = null;

		// 子目录映射
		this.dirs = {
			tasks:
				config?.dirs && typeof config.dirs.tasks === "string"
					? config.dirs.tasks
					: "tasks",
			docs:
				config?.dirs && typeof config.dirs.docs === "string"
					? config.dirs.docs
					: "docs",
			reports:
				config?.dirs && typeof config.dirs.reports === "string"
					? config.dirs.reports
					: "reports",
			templates:
				config?.dirs && typeof config.dirs.templates === "string"
					? config.dirs.templates
					: "templates",
			backups:
				config?.dirs && typeof config.dirs.backups === "string"
					? config.dirs.backups
					: "backups",
			logs:
				config?.dirs && typeof config.dirs.logs === "string"
					? config.dirs.logs
					: "logs",
			config:
				config?.dirs && typeof config.dirs.config === "string"
					? config.dirs.config
					: "config",
		};

		// 文件映射
		this.files = {
			tasks:
				config?.files && typeof config.files.tasks === "string"
					? config.files.tasks
					: "tasks.json",
			config:
				config?.files && typeof config.files.config === "string"
					? config.files.config
					: "config.json",
			state:
				config?.files && typeof config.files.state === "string"
					? config.files.state
					: "state.json",
			changelog:
				config?.files && typeof config.files.changelog === "string"
					? config.files.changelog
					: "changelog.md",
			brand:
				config?.files && typeof config.files.brand === "string"
					? config.files.brand
					: "brand.json",
			paths:
				config?.files && typeof config.files.paths === "string"
					? config.files.paths
					: "paths.json",
			cleanup:
				config?.files && typeof config.files.cleanup === "string"
					? config.files.cleanup
					: "cleanup-rules.json",
		};

		// 标签配置（用于多任务上下文）
		this.tags = config?.tags || {};

		// 元数据
		this.metadata = {
			created:
				config?.metadata && typeof config.metadata.created === "string"
					? config.metadata.created
					: new Date().toISOString(),
			updated:
				config?.metadata && typeof config.metadata.updated === "string"
					? config.metadata.updated
					: new Date().toISOString(),
			version:
				config?.metadata && typeof config.metadata.version === "string"
					? config.metadata.version
					: "1.0.0",
		};
	}

	/**
	 * 验证配置的有效性
	 * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
	 */
	validate() {
		const errors = [];

		// 验证根目录配置
		if (!this.root.speco || typeof this.root.speco !== "string") {
			errors.push("root.speco 必须是非空字符串");
		}

		if (this.root.speco && this.root.speco.length > 255) {
			errors.push("root.speco 路径长度不能超过255字符");
		}

		// 验证特殊字符
		const invalidChars = /[<>:"|?*]/;
		if (invalidChars.test(this.root.speco)) {
			errors.push('root.speco 不能包含特殊字符 < > : " | ? *');
		}

		// 验证目录配置
		for (const [key, value] of Object.entries(this.dirs)) {
			if (!value || typeof value !== "string") {
				errors.push(`dirs.${key} 必须是非空字符串`);
			}

			if (value && value.length > 255) {
				errors.push(`dirs.${key} 路径长度不能超过255字符`);
			}

			// 目录名只能包含字母、数字、下划线
			if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
				errors.push(`dirs.${key} 只能包含字母、数字、下划线`);
			}
		}

		// 验证文件配置
		for (const [key, value] of Object.entries(this.files)) {
			if (!value || typeof value !== "string") {
				errors.push(`files.${key} 必须是非空字符串`);
			}

			if (value && value.length > 255) {
				errors.push(`files.${key} 文件名长度不能超过255字符`);
			}

			// 文件名不能包含路径分隔符
			if (value.includes("/") || value.includes("\\")) {
				errors.push(`files.${key} 不能包含路径分隔符`);
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 获取完整路径
	 * @param {string} type - 路径类型 ('root', 'dir', 'file')
	 * @param {string} key - 路径键
	 * @param {string} tag - 可选的标签，用于多上下文支持
	 * @returns {string} 完整路径
	 */
	/**
	 * 获取缓存管理器 (延迟初始化)
	 * @returns {ConfigCache} 缓存管理器实例
	 */
	async _getCacheManager() {
		if (!this._cacheManager) {
			const { ConfigCache } = await import("../utils/ConfigCache.js");
			this._cacheManager = new ConfigCache({
				maxSize: 500, // 路径缓存相对较小
				ttl: 1800000, // 30分钟
			});
		}
		return this._cacheManager;
	}

	async getPath(type, key, tag = null) {
		// 生成缓存键
		const cacheKey = `${type}:${key}:${tag || ""}`;

		// 检查缓存
		const cacheManager = await this._getCacheManager();
		const cached = cacheManager.get(cacheKey);
		if (cached !== null) {
			return cached;
		}

		let basePath = "";

		switch (type) {
			case "root":
				basePath = this.root[key] || this.root.speco;
				break;
			case "dir":
				basePath = `${this.root.speco}/${this.dirs[key] || key}`;
				break;
			case "file": {
				const dirKey = this.getDirKeyForFile(key);
				basePath = `${this.root.speco}/${this.dirs[dirKey]}/${this.files[key]}`;
				break;
			}
			default:
				throw new Error(`未知的路径类型: ${type}`);
		}

		// 如果提供了标签，添加标签前缀
		if (tag) {
			if (type === "root") {
				basePath = `${basePath}_${tag}`;
			} else {
				basePath = basePath.replace(
					this.root.speco,
					`${this.root.speco}_${tag}`,
				);
			}
		}

		// 缓存结果
		cacheManager.set(cacheKey, basePath);
		return basePath;
	}

	/**
	 * 获取文件对应的目录键
	 * @param {string} fileKey - 文件键
	 * @returns {string} 目录键
	 */
	getDirKeyForFile(fileKey) {
		const fileDirMap = {
			tasks: "tasks",
			config: "config",
			state: "config",
			changelog: "docs",
			brand: "config",
			paths: "config",
			cleanup: "config",
		};

		return fileDirMap[fileKey] || "config";
	}

	/**
	 * 清除路径缓存
	 * 当配置发生变化时调用
	 */
	clearCache() {
		if (this._cacheManager) {
			this._cacheManager.clear();
		}
	}

	/**
	 * 获取缓存统计信息
	 * @returns {Object} 缓存统计
	 */
	async getCacheStats() {
		const cacheManager = await this._getCacheManager();
		return cacheManager.getStats();
	}

	/**
	 * 性能测试：测量路径解析性能
	 * @param {number} iterations - 测试迭代次数
	 * @returns {Object} 性能测试结果
	 */
	async benchmarkPathResolution(iterations = 1000) {
		const startTime = Date.now();
		const testPaths = [
			{ type: "root", key: "speco" },
			{ type: "dir", key: "tasks" },
			{ type: "file", key: "tasks" },
			{ type: "dir", key: "config" },
			{ type: "file", key: "config" },
		];

		// 预热缓存
		for (const { type, key } of testPaths) {
			await this.getPath(type, key);
		}

		// 执行性能测试
		for (let i = 0; i < iterations; i++) {
			const pathSpec = testPaths[i % testPaths.length];
			await this.getPath(pathSpec.type, pathSpec.key);
		}

		const endTime = Date.now();
		const totalTime = endTime - startTime;
		const avgTime = totalTime / iterations;

		return {
			totalTime,
			avgTime,
			iterations,
			cacheSize: this._pathCache.size,
			withinLimit: avgTime < 100, // 小于100ms
		};
	}

	/**
	 * 转换为JSON格式
	 * @returns {Object} JSON对象
	 */
	toJSON() {
		return {
			root: this.root,
			dirs: this.dirs,
			files: this.files,
			tags: this.tags,
			metadata: this.metadata,
		};
	}

	/**
	 * 从JSON创建实例
	 * @param {Object} json - JSON对象
	 * @returns {PathConfig} PathConfig实例
	 */
	static fromJSON(json) {
		return new PathConfig(json);
	}

	/**
	 * 获取默认配置
	 * @returns {PathConfig} 默认配置实例
	 */
	static getDefaultConfig() {
		return new PathConfig();
	}

	/**
	 * 更新配置
	 * @param {Object} updates - 更新对象
	 */
	update(updates) {
		// 递归更新配置
		const updateObject = (target, source) => {
			for (const key of Object.keys(source)) {
				if (
					typeof source[key] === "object" &&
					source[key] !== null &&
					!Array.isArray(source[key])
				) {
					if (!target[key]) target[key] = {};
					updateObject(target[key], source[key]);
				} else {
					target[key] = source[key];
				}
			}
		};

		updateObject(this, updates);
		this.metadata.updated = new Date().toISOString();
	}

	/**
	 * 获取所有路径的快照
	 * @returns {Object} 路径快照
	 */
	async getPathSnapshot() {
		const dirs = {};
		for (const key of Object.keys(this.dirs)) {
			dirs[key] = await this.getPath("dir", key);
		}

		const files = {};
		for (const key of Object.keys(this.files)) {
			files[key] = await this.getPath("file", key);
		}

		return {
			root: { ...this.root },
			dirs,
			files,
		};
	}
}

export { PathConfig };
