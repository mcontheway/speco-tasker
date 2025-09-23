/**
 * 服务中间件
 * 提供路径配置验证和安全中间件
 */

import fs from "node:fs/promises";
import path from "node:path";
import { PathConfig } from "../models/PathConfig.js";

/**
 * 中间件验证结果
 */
class ValidationResult {
	/**
	 * 构造函数
	 * @param {boolean} valid - 是否有效
	 * @param {Array} errors - 错误列表
	 * @param {Array} warnings - 警告列表
	 * @param {Object} metadata - 元数据
	 */
	constructor(valid = true, errors = [], warnings = [], metadata = {}) {
		this.valid = valid;
		this.errors = errors;
		this.warnings = warnings;
		this.metadata = metadata;
	}

	/**
	 * 添加错误
	 * @param {string} message - 错误消息
	 * @param {string} code - 错误代码
	 * @param {Object} details - 详细信息
	 */
	addError(message, code, details = {}) {
		this.errors.push({
			message,
			code,
			details,
			timestamp: new Date().toISOString(),
		});
		this.valid = false;
	}

	/**
	 * 添加警告
	 * @param {string} message - 警告消息
	 * @param {string} code - 警告代码
	 * @param {Object} details - 详细信息
	 */
	addWarning(message, code, details = {}) {
		this.warnings.push({
			message,
			code,
			details,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * 获取总结
	 * @returns {Object} 总结信息
	 */
	getSummary() {
		return {
			valid: this.valid,
			errorCount: this.errors.length,
			warningCount: this.warnings.length,
			totalIssues: this.errors.length + this.warnings.length,
		};
	}
}

/**
 * 服务中间件类
 * 提供路径配置验证和安全中间件功能
 */
export class ServiceMiddleware {
	/**
	 * 构造函数
	 * @param {Object} options - 选项
	 */
	constructor(options = {}) {
		this.options = {
			strictMode: options.strictMode || false,
			allowUnsafeOperations: options.allowUnsafeOperations || false,
			maxPathLength: options.maxPathLength || 255,
			allowedFileExtensions: options.allowedFileExtensions || [
				".js",
				".ts",
				".json",
				".md",
				".txt",
			],
		};
	}

	/**
	 * 验证路径配置
	 * @param {Object} pathConfig - 路径配置对象
	 * @param {Object} context - 验证上下文
	 * @returns {ValidationResult} 验证结果
	 */
	validatePathConfig(pathConfig, context = {}) {
		const result = new ValidationResult();

		try {
			// 1. 基本结构验证
			if (!pathConfig || typeof pathConfig !== "object") {
				result.addError("路径配置必须是对象", "INVALID_CONFIG_TYPE");
				return result;
			}

			// 2. 必需字段验证
			const requiredFields = ["root", "dirs", "files"];
			for (const field of requiredFields) {
				if (!pathConfig[field]) {
					result.addError(
						`路径配置缺少必需字段: ${field}`,
						"REQUIRED_FIELD_MISSING",
						{ field },
					);
				}
			}

			// 3. 字段类型验证
			if (pathConfig.root && typeof pathConfig.root !== "object") {
				result.addError("root 字段必须是对象", "INVALID_ROOT_TYPE");
			}

			if (pathConfig.dirs && typeof pathConfig.dirs !== "object") {
				result.addError("dirs 字段必须是对象", "INVALID_DIRS_TYPE");
			}

			if (pathConfig.files && typeof pathConfig.files !== "object") {
				result.addError("files 字段必须是对象", "INVALID_FILES_TYPE");
			}

			// 4. 路径格式验证
			if (pathConfig.root) {
				this._validatePathFormat(pathConfig.root.speco, "root.speco", result);
				this._validatePathFormat(pathConfig.root.legacy, "root.legacy", result);
			}

			if (pathConfig.dirs) {
				for (const [key, value] of Object.entries(pathConfig.dirs)) {
					this._validatePathFormat(value, `dirs.${key}`, result);
				}
			}

			if (pathConfig.files) {
				for (const [key, value] of Object.entries(pathConfig.files)) {
					this._validateFileFormat(value, `files.${key}`, result);
				}
			}

			// 5. 安全检查
			this._validatePathSecurity(pathConfig, result);

			// 6. 权限检查（如果启用）
			if (context.checkPermissions) {
				this._validatePathPermissions(pathConfig, result);
			}

			// 7. 冲突检查
			if (context.checkConflicts) {
				this._validatePathConflicts(pathConfig, result);
			}
		} catch (error) {
			result.addError(
				`路径配置验证失败: ${error.message}`,
				"VALIDATION_ERROR",
				{ error: error.message },
			);
		}

		return result;
	}

	/**
	 * 路径格式验证
	 * @param {*} pathValue - 路径值
	 * @param {string} fieldName - 字段名
	 * @param {ValidationResult} result - 验证结果
	 */
	_validatePathFormat(pathValue, fieldName, result) {
		if (typeof pathValue !== "string") {
			result.addError(`${fieldName} 必须是字符串`, "INVALID_PATH_TYPE", {
				field: fieldName,
			});
			return;
		}

		if (pathValue.length === 0) {
			result.addError(`${fieldName} 不能为空`, "EMPTY_PATH", {
				field: fieldName,
			});
			return;
		}

		if (pathValue.length > this.options.maxPathLength) {
			result.addError(
				`${fieldName} 路径过长: ${pathValue.length} 字符`,
				"PATH_TOO_LONG",
				{
					field: fieldName,
					length: pathValue.length,
					maxLength: this.options.maxPathLength,
				},
			);
		}
	}

	/**
	 * 文件格式验证
	 * @param {*} fileValue - 文件值
	 * @param {string} fieldName - 字段名
	 * @param {ValidationResult} result - 验证结果
	 */
	_validateFileFormat(fileValue, fieldName, result) {
		this._validatePathFormat(fileValue, fieldName, result);

		// 检查是否是有效的文件名
		const fileName = path.basename(fileValue);
		if (fileName !== fileValue) {
			result.addWarning(
				`${fieldName} 应该只包含文件名，不包含路径`,
				"PATH_IN_FILENAME",
				{ field: fieldName, value: fileValue },
			);
		}

		// 检查文件扩展名
		const ext = path.extname(fileValue);
		if (!ext) {
			result.addWarning(`${fieldName} 缺少文件扩展名`, "MISSING_EXTENSION", {
				field: fieldName,
				value: fileValue,
			});
		}
	}

	/**
	 * 路径安全验证
	 * @param {Object} pathConfig - 路径配置
	 * @param {ValidationResult} result - 验证结果
	 */
	_validatePathSecurity(pathConfig, result) {
		// 检查路径是否指向敏感目录
		const sensitivePaths = [
			"/",
			"/root",
			"/etc",
			"/usr",
			"/bin",
			"/sbin",
			"/boot",
			"/sys",
			"/proc",
		];
		const allPaths = [
			pathConfig.root?.speco,
			pathConfig.root?.legacy,
			...Object.values(pathConfig.dirs || {}),
			...Object.values(pathConfig.files || {}),
		].filter(Boolean);

		for (const configPath of allPaths) {
			for (const sensitivePath of sensitivePaths) {
				if (configPath.startsWith(sensitivePath)) {
					result.addError(
						`路径指向敏感目录: ${configPath}`,
						"SENSITIVE_PATH_DETECTED",
						{ path: configPath, sensitivePath },
					);
				}
			}
		}
	}

	/**
	 * 路径权限验证
	 * @param {Object} pathConfig - 路径配置
	 * @param {ValidationResult} result - 验证结果
	 */
	async _validatePathPermissions(pathConfig, result) {
		const pathsToCheck = [
			pathConfig.root?.speco,
			...Object.values(pathConfig.dirs || {}),
		].filter(Boolean);

		for (const configPath of pathsToCheck) {
			try {
				const fullPath = path.resolve(configPath);
				await fs.access(fullPath, fs.constants.W_OK);
			} catch (error) {
				result.addError(
					`路径无写入权限: ${configPath}`,
					"PATH_PERMISSION_DENIED",
					{ path: configPath, error: error.message },
				);
			}
		}
	}

	/**
	 * 路径冲突验证
	 * @param {Object} pathConfig - 路径配置
	 * @param {ValidationResult} result - 验证结果
	 */
	_validatePathConflicts(pathConfig, result) {
		const allPaths = new Map();
		const conflicts = [];

		// 收集所有路径
		if (pathConfig.root?.speco)
			allPaths.set(pathConfig.root.speco, "root.speco");
		if (pathConfig.root?.legacy)
			allPaths.set(pathConfig.root.legacy, "root.legacy");

		for (const [key, value] of Object.entries(pathConfig.dirs || {})) {
			if (allPaths.has(value)) {
				conflicts.push({
					path: value,
					field1: allPaths.get(value),
					field2: `dirs.${key}`,
				});
			} else {
				allPaths.set(value, `dirs.${key}`);
			}
		}

		for (const [key, value] of Object.entries(pathConfig.files || {})) {
			if (allPaths.has(value)) {
				conflicts.push({
					path: value,
					field1: allPaths.get(value),
					field2: `files.${key}`,
				});
			} else {
				allPaths.set(value, `files.${key}`);
			}
		}

		// 报告冲突
		for (const conflict of conflicts) {
			result.addError(
				`路径冲突: ${conflict.path} 被 ${conflict.field1} 和 ${conflict.field2} 使用`,
				"PATH_CONFLICT",
				conflict,
			);
		}
	}
}
