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
			speco: config.root?.speco || ".speco",
			legacy: config.root?.legacy || ".taskmaster",
		};

		// 子目录映射
		this.dirs = {
			tasks: config.dirs?.tasks || "tasks",
			docs: config.dirs?.docs || "docs",
			reports: config.dirs?.reports || "reports",
			templates: config.dirs?.templates || "templates",
			backups: config.dirs?.backups || "backups",
			logs: config.dirs?.logs || "logs",
			config: config.dirs?.config || "config",
		};

		// 文件映射
		this.files = {
			tasks: config.files?.tasks || "tasks.json",
			config: config.files?.config || "config.json",
			state: config.files?.state || "state.json",
			changelog: config.files?.changelog || "changelog.md",
			brand: config.files?.brand || "brand.json",
			paths: config.files?.paths || "paths.json",
			cleanup: config.files?.cleanup || "cleanup-rules.json",
		};

		// 标签配置（用于多任务上下文）
		this.tags = config.tags || {};

		// 元数据
		this.metadata = {
			created: config.metadata?.created || new Date().toISOString(),
			updated: config.metadata?.updated || new Date().toISOString(),
			version: config.metadata?.version || "1.0.0",
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
		Object.entries(this.dirs).forEach(([key, value]) => {
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
		});

		// 验证文件配置
		Object.entries(this.files).forEach(([key, value]) => {
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
		});

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
	getPath(type, key, tag = null) {
		let basePath = "";

		switch (type) {
			case "root":
				basePath = this.root[key] || this.root.speco;
				break;
			case "dir":
				basePath = `${this.root.speco}/${this.dirs[key] || key}`;
				break;
			case "file":
				const dirKey = this.getDirKeyForFile(key);
				basePath = `${this.root.speco}/${this.dirs[dirKey]}/${this.files[key]}`;
				break;
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
			Object.keys(source).forEach((key) => {
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
			});
		};

		updateObject(this, updates);
		this.metadata.updated = new Date().toISOString();
	}

	/**
	 * 获取所有路径的快照
	 * @returns {Object} 路径快照
	 */
	getPathSnapshot() {
		return {
			root: { ...this.root },
			dirs: Object.keys(this.dirs).reduce((acc, key) => {
				acc[key] = this.getPath("dir", key);
				return acc;
			}, {}),
			files: Object.keys(this.files).reduce((acc, key) => {
				acc[key] = this.getPath("file", key);
				return acc;
			}, {}),
		};
	}
}

export { PathConfig };
