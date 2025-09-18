/**
 * 品牌信息实体
 * 统一管理产品品牌相关信息，确保所有用户界面显示一致性
 */

/**
 * BrandInfo 类
 * 负责管理品牌信息的实体类
 */
class BrandInfo {
	/**
	 * 构造函数
	 * @param {Object} config - 配置对象
	 */
	constructor(config = {}) {
		// 基础品牌信息
		this.name = config.name;
		this.command = config.command;
		this.description = config.description;
		this.version = config.version;

		// 显示相关
		this.shortName = config.shortName;
		this.tagline = config.tagline;

		// 技术信息
		this.author = config.author;
		this.license = config.license;

		// 扩展信息
		this.website = config.website;
		this.repository = config.repository;
		this.documentation = config.documentation;

		// 元数据
		this.metadata = config.metadata || {};
	}

	/**
	 * 验证品牌信息的有效性
	 * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
	 */
	validate() {
		const errors = [];

		// 验证必填字段
		if (
			!this.name ||
			typeof this.name !== "string" ||
			this.name.trim().length === 0
		) {
			errors.push("name 必须是非空字符串");
		}

		if (
			!this.command ||
			typeof this.command !== "string" ||
			this.command.trim().length === 0
		) {
			errors.push("command 必须是非空字符串");
		}

		// 验证名称长度
		if (this.name && this.name.length > 50) {
			errors.push("name 长度不能超过50字符");
		}

		// 验证命令格式
		if (this.command && !/^[a-z0-9-]+$/.test(this.command)) {
			errors.push("command 只能包含小写字母、数字和中划线");
		}

		// 验证版本格式
		if (this.version && !/^\d+\.\d+\.\d+/.test(this.version)) {
			errors.push("version 必须符合语义化版本格式 (MAJOR.MINOR.PATCH)");
		}

		// 验证URL格式
		const urlFields = ["website", "repository", "documentation"];
		urlFields.forEach((field) => {
			if (this[field] && this[field].trim() !== "") {
				try {
					new URL(this[field]);
				} catch {
					errors.push(`${field} 必须是有效的URL格式`);
				}
			}
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 获取品牌显示信息
	 * @returns {Object} 显示信息
	 */
	getDisplayInfo() {
		const config = this.getConfigWithDefaults();
		return {
			name: config.name,
			shortName: config.shortName,
			tagline: config.tagline,
			description: config.description,
			version: config.version,
			command: config.command,
			author: config.author,
		};
	}

	/**
	 * 获取技术信息
	 * @returns {Object} 技术信息
	 */
	getTechInfo() {
		const config = this.getConfigWithDefaults();
		return {
			version: config.version,
			license: config.license,
			author: config.author,
			website: config.website,
			repository: config.repository,
			documentation: config.documentation,
		};
	}

	/**
	 * 获取CLI相关信息
	 * @returns {Object} CLI信息
	 */
	getCLIInfo() {
		const config = this.getConfigWithDefaults();
		return {
			command: config.command,
			name: config.name,
			description: config.description,
			version: config.version,
		};
	}

	/**
	 * 获取完整的品牌信息摘要
	 * @returns {Object} 品牌摘要
	 */
	getSummary() {
		return {
			display: this.getDisplayInfo(),
			tech: this.getTechInfo(),
			cli: this.getCLIInfo(),
			metadata: this.metadata,
		};
	}

	/**
	 * 获取默认配置
	 * @returns {Object} 默认配置
	 */
	getDefaults() {
		return {
			name: "Speco Tasker",
			command: "speco-tasker",
			description:
				"A pure manual task management system for efficient development workflows",
			version: "1.2.0",
			shortName: "Speco",
			tagline: "纯净的任务管理系统",
			author: "Speco Team",
			license: "MIT WITH Commons-Clause",
			website: "",
			repository: "",
			documentation: "",
		};
	}

	/**
	 * 获取带默认值的配置
	 * @returns {Object} 带默认值的配置
	 */
	getConfigWithDefaults() {
		const defaults = this.getDefaults();
		return {
			name:
				this.name !== undefined && this.name !== null
					? this.name
					: defaults.name,
			command:
				this.command !== undefined && this.command !== null
					? this.command
					: defaults.command,
			description:
				this.description !== undefined && this.description !== null
					? this.description
					: defaults.description,
			version:
				this.version !== undefined && this.version !== null
					? this.version
					: defaults.version,
			shortName:
				this.shortName !== undefined && this.shortName !== null
					? this.shortName
					: defaults.shortName,
			tagline:
				this.tagline !== undefined && this.tagline !== null
					? this.tagline
					: defaults.tagline,
			author:
				this.author !== undefined && this.author !== null
					? this.author
					: defaults.author,
			license:
				this.license !== undefined && this.license !== null
					? this.license
					: defaults.license,
			website:
				this.website !== undefined && this.website !== null
					? this.website
					: defaults.website,
			repository:
				this.repository !== undefined && this.repository !== null
					? this.repository
					: defaults.repository,
			documentation:
				this.documentation !== undefined && this.documentation !== null
					? this.documentation
					: defaults.documentation,
			metadata: {
				created: this.metadata.created || new Date().toISOString(),
				updated: this.metadata.updated || new Date().toISOString(),
				version: this.metadata.version || "1.0.0",
			},
		};
	}

	/**
	 * 转换为JSON格式
	 * @returns {Object} JSON对象
	 */
	toJSON() {
		return this.getConfigWithDefaults();
	}

	/**
	 * 从JSON创建实例
	 * @param {Object} json - JSON对象
	 * @returns {BrandInfo} BrandInfo实例
	 */
	static fromJSON(json) {
		return new BrandInfo(json);
	}

	/**
	 * 获取默认品牌信息
	 * @returns {BrandInfo} 默认品牌信息实例
	 */
	static getDefaultBrand() {
		return new BrandInfo({});
	}

	/**
	 * 创建品牌重塑配置
	 * @param {Object} oldBrand - 旧品牌信息
	 * @param {Object} newBrand - 新品牌信息
	 * @returns {BrandInfo} 品牌重塑实例
	 */
	static createRebrand(oldBrand, newBrand) {
		const rebrandConfig = {
			...newBrand,
			metadata: {
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				version: "1.0.0",
				rebrand: {
					from: oldBrand,
					to: newBrand,
					timestamp: new Date().toISOString(),
				},
			},
		};

		const brand = new BrandInfo(rebrandConfig);
		// 确保metadata.rebrand被正确设置
		brand.metadata = rebrandConfig.metadata;
		return brand;
	}

	/**
	 * 更新品牌信息
	 * @param {Object} updates - 更新对象
	 */
	update(updates) {
		Object.keys(updates).forEach((key) => {
			if (key !== "metadata" && this.hasOwnProperty(key)) {
				this[key] = updates[key];
			}
		});

		this.metadata.updated = new Date().toISOString();
	}

	/**
	 * 验证版本兼容性
	 * @param {string} targetVersion - 目标版本
	 * @returns {boolean} 是否兼容
	 */
	isVersionCompatible(targetVersion) {
		if (!targetVersion || !this.version) return false;

		const current = this.version.split(".").map(Number);
		const target = targetVersion.split(".").map(Number);

		// 主要版本必须相同
		return current[0] === target[0];
	}

	/**
	 * 获取版本信息
	 * @returns {Object} 版本详情
	 */
	getVersionInfo() {
		const parts = this.version.split(".");
		return {
			major: parseInt(parts[0]) || 0,
			minor: parseInt(parts[1]) || 0,
			patch: parseInt(parts[2]) || 0,
			full: this.version,
		};
	}

	/**
	 * 克隆品牌信息
	 * @returns {BrandInfo} 克隆实例
	 */
	clone() {
		return new BrandInfo(this.toJSON());
	}
}

export { BrandInfo };
