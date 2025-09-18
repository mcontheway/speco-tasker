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
		this.name = config.name || "Speco Tasker";
		this.command = config.command || "speco-tasker";
		this.description =
			config.description ||
			"A pure manual task management system for efficient development workflows";
		this.version = config.version || "1.2.0";

		// 显示相关
		this.shortName = config.shortName || "Speco";
		this.tagline = config.tagline || "纯净的任务管理系统";

		// 技术信息
		this.author = config.author || "Speco Team";
		this.license = config.license || "MIT WITH Commons-Clause";

		// 扩展信息
		this.website = config.website || "";
		this.repository = config.repository || "";
		this.documentation = config.documentation || "";

		// 元数据
		this.metadata = {
			created: config.metadata?.created || new Date().toISOString(),
			updated: config.metadata?.updated || new Date().toISOString(),
			version: config.metadata?.version || "1.0.0",
		};
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
		return {
			name: this.name,
			shortName: this.shortName,
			tagline: this.tagline,
			description: this.description,
			version: this.version,
			command: this.command,
			author: this.author,
		};
	}

	/**
	 * 获取技术信息
	 * @returns {Object} 技术信息
	 */
	getTechInfo() {
		return {
			version: this.version,
			license: this.license,
			author: this.author,
			website: this.website,
			repository: this.repository,
			documentation: this.documentation,
		};
	}

	/**
	 * 获取CLI相关信息
	 * @returns {Object} CLI信息
	 */
	getCLIInfo() {
		return {
			command: this.command,
			name: this.name,
			description: this.description,
			version: this.version,
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
	 * 转换为JSON格式
	 * @returns {Object} JSON对象
	 */
	toJSON() {
		return {
			name: this.name,
			command: this.command,
			description: this.description,
			version: this.version,
			shortName: this.shortName,
			tagline: this.tagline,
			author: this.author,
			license: this.license,
			website: this.website,
			repository: this.repository,
			documentation: this.documentation,
			metadata: this.metadata,
		};
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
		return new BrandInfo();
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

		return new BrandInfo(rebrandConfig);
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
