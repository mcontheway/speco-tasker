/**
 * 服务中间件
 * 提供路径配置、品牌信息、清理规则的验证和安全中间件
 */

import fs from "fs/promises";
import path from "path";
import { PathConfig } from "../models/PathConfig.js";
import { BrandInfo } from "../models/BrandInfo.js";
import { CleanupRule } from "../models/CleanupRule.js";

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
	 * @param {string} message - 错误信息
	 * @param {string} code - 错误代码
	 * @param {Object} details - 错误详情
	 */
	addError(message, code = null, details = {}) {
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
	 * @param {string} message - 警告信息
	 * @param {string} code - 警告代码
	 * @param {Object} details - 警告详情
	 */
	addWarning(message, code = null, details = {}) {
		this.warnings.push({
			message,
			code,
			details,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * 合并另一个验证结果
	 * @param {ValidationResult} other - 另一个验证结果
	 */
	merge(other) {
		this.errors.push(...other.errors);
		this.warnings.push(...other.warnings);
		if (!other.valid) {
			this.valid = false;
		}
		Object.assign(this.metadata, other.metadata);
	}
}

/**
 * 服务中间件类
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
			...options,
		};
	}

	/**
	 * 路径配置验证中间件
	 * @param {Object} pathConfig - 路径配置对象
	 * @param {Object} context - 验证上下文
	 * @returns {ValidationResult} 验证结果
	 */
	validatePathConfig(pathConfig, context = {}) {
		const result = new ValidationResult();

		try {
			// 1. 基础结构验证
			if (!pathConfig || typeof pathConfig !== "object") {
				result.addError("路径配置必须是对象", "INVALID_TYPE");
				return result;
			}

			// 2. 根路径验证
			if (!pathConfig.root || !pathConfig.root.speco) {
				result.addError("必须指定speco根路径", "MISSING_ROOT_PATH");
			} else {
				this._validatePathFormat(pathConfig.root.speco, "root.speco", result);
			}

			// 3. 目录验证
			if (!pathConfig.dirs || typeof pathConfig.dirs !== "object") {
				result.addError("目录配置无效", "INVALID_DIRS_CONFIG");
			} else {
				const requiredDirs = ["tasks", "docs", "reports"];
				for (const dir of requiredDirs) {
					if (!pathConfig.dirs[dir]) {
						result.addError(`缺少必需目录: ${dir}`, "MISSING_REQUIRED_DIR", {
							dir,
						});
					} else {
						this._validatePathFormat(
							pathConfig.dirs[dir],
							`dirs.${dir}`,
							result,
						);
					}
				}
			}

			// 4. 文件验证
			if (!pathConfig.files || typeof pathConfig.files !== "object") {
				result.addError("文件配置无效", "INVALID_FILES_CONFIG");
			} else {
				const requiredFiles = ["tasks", "config"];
				for (const file of requiredFiles) {
					if (!pathConfig.files[file]) {
						result.addError(`缺少必需文件: ${file}`, "MISSING_REQUIRED_FILE", {
							file,
						});
					} else {
						this._validateFileFormat(
							pathConfig.files[file],
							`files.${file}`,
							result,
						);
					}
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

					});
				}
			}

			// 3. 字段格式验证
			if (brandInfo.name) {
				if (
					typeof brandInfo.name !== "string" ||
					brandInfo.name.length < 1 ||
					brandInfo.name.length > 50
				) {
					result.addError(
						"品牌名称必须是1-50字符的字符串",
						"INVALID_NAME_FORMAT",
					);
				}
			}

			if (brandInfo.command) {
				const commandRegex = /^[a-z][a-z0-9-]*$/;
				if (!commandRegex.test(brandInfo.command)) {
					result.addError(
						"命令名称只能包含小写字母、数字和连字符，且必须以字母开头",
						"INVALID_COMMAND_FORMAT",
					);
				}
			}

			if (brandInfo.version) {
				const versionRegex = /^\d+\.\d+\.\d+$/;
				if (!versionRegex.test(brandInfo.version)) {
					result.addError(
						"版本号必须符合语义化版本格式 (MAJOR.MINOR.PATCH)",
						"INVALID_VERSION_FORMAT",
					);
				}
			}

			// 4. 一致性检查
			if (brandInfo.name && brandInfo.command) {
				// 检查品牌名和命令名的合理关联
				const nameSlug = brandInfo.name.toLowerCase().replace(/[^a-z0-9]/g, "");
				const commandBase = brandInfo.command.replace(/-/g, "");

				if (nameSlug.length > 0 && commandBase.length > 0) {
					// 如果品牌名和命令名差异过大，给出警告
					const similarity = this._calculateStringSimilarity(
						nameSlug,
						commandBase,
					);
					if (similarity < 0.3) {
						result.addWarning(
							"品牌名称和命令名称关联性较低，建议保持一致",
							"BRAND_COMMAND_MISMATCH",
							{ similarity, nameSlug, commandBase },
						);
					}
				}
			}

			// 5. 敏感内容检查
			this._validateBrandContent(brandInfo, result);
		} catch (error) {
			result.addError(
				`品牌信息验证失败: ${error.message}`,
				"VALIDATION_ERROR",
				{ error: error.message },
			);
		}

		return result;
	}

	/**
	 * 清理规则验证中间件
	 * @param {Array} rules - 清理规则数组
	 * @param {Object} context - 验证上下文
	 * @returns {ValidationResult} 验证结果
	 */
	validateCleanupRules(rules, context = {}) {
		const result = new ValidationResult();

		try {
			// 1. 基础结构验证
			if (!Array.isArray(rules)) {
				result.addError("清理规则必须是数组", "INVALID_TYPE");
				return result;
			}

			// 2. 规则数量检查
			if (rules.length === 0) {
				result.addWarning("没有配置清理规则", "NO_RULES_CONFIGURED");
			}

			// 3. 逐个规则验证
			const ruleIds = new Set();
			for (let i = 0; i < rules.length; i++) {
				const rule = rules[i];
				const ruleResult = this._validateSingleRule(rule, i);
				result.merge(ruleResult);

				// 检查规则ID唯一性
				if (rule.id) {
					if (ruleIds.has(rule.id)) {
						result.addError(`规则ID重复: ${rule.id}`, "DUPLICATE_RULE_ID", {
							ruleId: rule.id,
							index: i,
						});
					}
					ruleIds.add(rule.id);
				}
			}

			// 4. 规则间冲突检查
			this._validateRuleConflicts(rules, result);

			// 5. 安全检查
			this._validateRuleSecurity(rules, result);

			// 6. 覆盖率检查
			this._validateRuleCoverage(rules, result);
		} catch (error) {
			result.addError(
				`清理规则验证失败: ${error.message}`,
				"VALIDATION_ERROR",
				{ error: error.message },
			);
		}

		return result;
	}

	/**
	 * 路径安全验证中间件
	 * @param {string} filePath - 文件路径
	 * @param {string} operation - 操作类型
	 * @param {Object} context - 验证上下文
	 * @returns {ValidationResult} 验证结果
	 */
	async validatePathSecurity(filePath, operation, context = {}) {
		const result = new ValidationResult();

		try {
			// 1. 路径遍历攻击检查
			if (filePath.includes("..") || path.isAbsolute(filePath)) {
				result.addError("检测到潜在的路径遍历攻击", "PATH_TRAVERSAL_DETECTED", {
					filePath,
				});
			}

			// 2. 文件扩展名检查
			const ext = path.extname(filePath).toLowerCase();
			if (!this.options.allowedFileExtensions.includes(ext) && ext !== "") {
				result.addWarning(
					`文件扩展名 ${ext} 不在允许列表中`,
					"UNSAFE_EXTENSION",
					{ extension: ext, allowed: this.options.allowedFileExtensions },
				);
			}

			// 3. 文件大小检查（如果文件存在）
			if (context.checkFileSize) {
				try {
					const stats = await fs.stat(filePath);
					const maxSize = this.options.maxFileSize || 10 * 1024 * 1024; // 10MB默认
					if (stats.size > maxSize) {
						result.addWarning(
							`文件大小过大: ${stats.size} 字节`,
							"FILE_TOO_LARGE",
							{ size: stats.size, maxSize },
						);
					}
				} catch (error) {
					// 文件不存在，跳过大小检查
				}
			}

			// 4. 权限检查
			if (context.checkPermissions) {
				try {
					await fs.access(filePath, fs.constants.R_OK);
					if (["write", "delete", "modify"].includes(operation)) {
						await fs.access(filePath, fs.constants.W_OK);
					}
				} catch (error) {
					result.addError(
						`文件权限不足: ${operation} 操作`,
						"INSUFFICIENT_PERMISSIONS",
						{ filePath, operation, error: error.message },
					);
				}
			}

			// 5. 敏感路径检查
			this._validateSensitivePaths(filePath, operation, result);
		} catch (error) {
			result.addError(
				`路径安全验证失败: ${error.message}`,
				"SECURITY_VALIDATION_ERROR",
				{ error: error.message },
			);
		}

		return result;
	}

	/**
	 * 操作审计中间件
	 * @param {string} operation - 操作名称
	 * @param {Object} params - 操作参数
	 * @param {Object} context - 上下文信息
	 * @returns {Object} 审计日志对象
	 */
	createAuditLog(operation, params, context = {}) {
		return {
			timestamp: new Date().toISOString(),
			operation,
			params: this._sanitizeAuditParams(params),
			context: {
				userId: context.userId || "system",
				sessionId: context.sessionId,
				ip: context.ip,
				userAgent: context.userAgent,
			},
			metadata: {
				serviceVersion: context.serviceVersion || "1.2.0",
				environment: context.environment || "development",
			},
		};
	}

	// 私有验证方法

	/**
	 * 验证路径格式
	 * @private
	 * @param {string} pathValue - 路径值
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

		// 检查非法字符
		const illegalChars = /[<>:"|?*\x00-\x1f]/;
		if (illegalChars.test(pathValue)) {
			result.addError(`${fieldName} 包含非法字符`, "INVALID_PATH_CHARACTERS", {
				field: fieldName,
				path: pathValue,
			});
		}
	}

	/**
	 * 验证文件格式
	 * @private
	 * @param {string} fileValue - 文件值
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
	 * 验证路径安全性
	 * @private
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
			for (const sensitive of sensitivePaths) {
				if (configPath.startsWith(sensitive)) {
					result.addError(
						`路径指向敏感系统目录: ${configPath}`,
						"SENSITIVE_PATH_DETECTED",
						{ path: configPath, sensitivePath: sensitive },
					);
					break;
				}
			}
		}

		// 检查路径冲突
		const pathMap = new Map();
		for (const [key, configPath] of Object.entries(pathConfig.dirs || {})) {
			if (pathMap.has(configPath)) {
				result.addError(
					`目录路径冲突: ${key} 和 ${pathMap.get(configPath)} 使用相同路径`,
					"PATH_CONFLICT",
					{ path: configPath, keys: [key, pathMap.get(configPath)] },
				);
			}
			pathMap.set(configPath, key);
		}
	}

	/**
	 * 验证路径权限
	 * @private
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
	 * 验证路径冲突
	 * @private
	 * @param {Object} pathConfig - 路径配置
	 * @param {ValidationResult} result - 验证结果
	 */
	_validatePathConflicts(pathConfig, result) {
		const allPaths = new Set();
		const conflicts = [];

		// 检查所有路径是否重复
		const paths = [
			pathConfig.root?.speco,
			pathConfig.root?.legacy,
			...Object.values(pathConfig.dirs || {}),
			...Object.values(pathConfig.files || {}),
		].filter(Boolean);

		for (const configPath of paths) {
			if (allPaths.has(configPath)) {
				conflicts.push(configPath);
			}
			allPaths.add(configPath);
		}

		for (const conflictPath of conflicts) {
			result.addError(
				`路径配置冲突: ${conflictPath} 被多次使用`,
				"DUPLICATE_PATH_CONFIG",
				{ path: conflictPath },
			);
		}
	}

	/**
	 * 验证品牌内容
	 * @private
	 * @param {Object} brandInfo - 品牌信息
	 * @param {ValidationResult} result - 验证结果
	 */
	_validateBrandContent(brandInfo, result) {
		const sensitiveWords = ["hack", "exploit", "malware", "virus", "trojan"];
		const contentToCheck = [
			brandInfo.name,
			brandInfo.description,
			brandInfo.tagline,
		].filter(Boolean);

		for (const content of contentToCheck) {
			for (const word of sensitiveWords) {
				if (content.toLowerCase().includes(word)) {
					result.addWarning(
						`品牌内容包含敏感词汇: ${word}`,
						"SENSITIVE_CONTENT_DETECTED",
						{ word, content },
					);
				}
			}
		}
	}

	/**
	 * 验证单个清理规则
	 * @private
	 * @param {Object} rule - 规则对象
	 * @param {number} index - 规则索引
	 * @returns {ValidationResult} 验证结果
	 */
	_validateSingleRule(rule, index) {
		const result = new ValidationResult();

		// 1. 规则结构验证
		if (!rule || typeof rule !== "object") {
			result.addError(`规则 ${index} 必须是对象`, "INVALID_RULE_TYPE", {
				index,
			});
			return result;
		}

		// 2. 必需字段验证
		const requiredFields = ["id", "name", "type", "action"];
		for (const field of requiredFields) {
			if (!rule[field]) {
				result.addError(
					`规则 ${index} 缺少必需字段: ${field}`,
					"MISSING_RULE_FIELD",
					{ index, field },
				);
			}
		}

		// 3. 类型验证
		if (
			rule.type &&
			!["ai_service", "ai_config", "brand_info", "documentation"].includes(
				rule.type,
			)
		) {
			result.addError(
				`规则 ${index} 类型无效: ${rule.type}`,
				"INVALID_RULE_TYPE",
				{ index, type: rule.type },
			);
		}

		// 4. 动作验证
		if (rule.action && !["remove", "replace", "mark"].includes(rule.action)) {
			result.addError(
				`规则 ${index} 动作无效: ${rule.action}`,
				"INVALID_RULE_ACTION",
				{ index, action: rule.action },
			);
		}

		// 5. 模式验证
		if (rule.patterns && !Array.isArray(rule.patterns)) {
			result.addError(
				`规则 ${index} patterns 必须是数组`,
				"INVALID_PATTERNS_TYPE",
				{ index },
			);
		}

		if (rule.contentPatterns) {
			for (let i = 0; i < rule.contentPatterns.length; i++) {
				const pattern = rule.contentPatterns[i];
				if (!(pattern instanceof RegExp) && typeof pattern !== "string") {
					result.addError(
						`规则 ${index} contentPatterns[${i}] 必须是正则表达式或字符串`,
						"INVALID_CONTENT_PATTERN",
						{ index, patternIndex: i, pattern },
					);
				}
			}
		}

		return result;
	}

	/**
	 * 验证规则间冲突
	 * @private
	 * @param {Array} rules - 规则数组
	 * @param {ValidationResult} result - 验证结果
	 */
	_validateRuleConflicts(rules, result) {
		// 检查相同类型的规则是否有冲突的模式
		const typeGroups = {};
		for (const rule of rules) {
			if (!typeGroups[rule.type]) {
				typeGroups[rule.type] = [];
			}
			typeGroups[rule.type].push(rule);
		}

		for (const [type, typeRules] of Object.entries(typeGroups)) {
			// 检查相同模式的规则
			for (let i = 0; i < typeRules.length; i++) {
				for (let j = i + 1; j < typeRules.length; j++) {
					const rule1 = typeRules[i];
					const rule2 = typeRules[j];

					if (this._rulesHaveSimilarPatterns(rule1, rule2)) {
						result.addWarning(
							`规则 ${rule1.id} 和 ${rule2.id} 具有相似的模式，可能存在冲突`,
							"SIMILAR_RULE_PATTERNS",
							{ rule1: rule1.id, rule2: rule2.id, type },
						);
					}
				}
			}
		}
	}

	/**
	 * 验证规则安全性
	 * @private
	 * @param {Array} rules - 规则数组
	 * @param {ValidationResult} result - 验证结果
	 */
	_validateRuleSecurity(rules, result) {
		for (const rule of rules) {
			// 检查危险的正则表达式
			if (rule.contentPatterns) {
				for (const pattern of rule.contentPatterns) {
					if (pattern instanceof RegExp) {
						// 检查潜在的ReDoS攻击模式
						const patternStr = pattern.source;
						if (patternStr.includes(".*.*") || patternStr.includes(".+.+")) {
							result.addWarning(
								`规则 ${rule.id} 包含潜在的ReDoS风险模式`,
								"REDOS_RISK_DETECTED",
								{ ruleId: rule.id, pattern: patternStr },
							);
						}
					}
				}
			}

			// 检查过于宽泛的模式
			if (rule.patterns) {
				for (const pattern of rule.patterns) {
					if (pattern === "*" || pattern === "**/*") {
						result.addWarning(
							`规则 ${rule.id} 使用过于宽泛的模式: ${pattern}`,
							"OVERLY_BROAD_PATTERN",
							{ ruleId: rule.id, pattern },
						);
					}
				}
			}
		}
	}

	/**
	 * 验证规则覆盖率
	 * @private
	 * @param {Array} rules - 规则数组
	 * @param {ValidationResult} result - 验证结果
	 */
	_validateRuleCoverage(rules, result) {
		const coverage = {
			ai_service: false,
			ai_config: false,
			brand_info: false,
			documentation: false,
		};

		for (const rule of rules) {
			if (rule.type && rule.metadata?.enabled !== false) {
				coverage[rule.type] = true;
			}
		}

		const missingTypes = Object.entries(coverage)
			.filter(([type, covered]) => !covered)
			.map(([type]) => type);

		if (missingTypes.length > 0) {
			result.addWarning(
				`缺少以下类型的清理规则: ${missingTypes.join(", ")}`,
				"INCOMPLETE_RULE_COVERAGE",
				{ missingTypes },
			);
		}
	}

	/**
	 * 验证敏感路径
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {string} operation - 操作类型
	 * @param {ValidationResult} result - 验证结果
	 */
	_validateSensitivePaths(filePath, operation, result) {
		const sensitiveDirs = ["node_modules", ".git", ".svn", "tmp", "temp"];
		const normalizedPath = path.normalize(filePath);

		for (const sensitiveDir of sensitiveDirs) {
			if (
				normalizedPath.includes(`/${sensitiveDir}/`) ||
				normalizedPath.startsWith(`${sensitiveDir}/`)
			) {
				if (operation === "delete" || operation === "modify") {
					result.addError(
						`不允许在敏感目录中执行 ${operation} 操作: ${sensitiveDir}`,
						"SENSITIVE_DIRECTORY_OPERATION",
						{ filePath, operation, sensitiveDir },
					);
				} else {
					result.addWarning(
						`在敏感目录中执行 ${operation} 操作: ${sensitiveDir}`,
						"SENSITIVE_DIRECTORY_ACCESS",
						{ filePath, operation, sensitiveDir },
					);
				}
			}
		}
	}

	/**
	 * 计算字符串相似度
	 * @private
	 * @param {string} str1 - 字符串1
	 * @param {string} str2 - 字符串2
	 * @returns {number} 相似度 (0-1)
	 */
	_calculateStringSimilarity(str1, str2) {
		const longer = str1.length > str2.length ? str1 : str2;
		const shorter = str1.length > str2.length ? str2 : str1;

		if (longer.length === 0) return 1.0;

		const distance = this._levenshteinDistance(longer, shorter);
		return (longer.length - distance) / longer.length;
	}

	/**
	 * 计算编辑距离
	 * @private
	 * @param {string} str1 - 字符串1
	 * @param {string} str2 - 字符串2
	 * @returns {number} 编辑距离
	 */
	_levenshteinDistance(str1, str2) {
		const matrix = [];

		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= str1.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1,
					);
				}
			}
		}

		return matrix[str2.length][str1.length];
	}

	/**
	 * 检查规则是否有相似模式
	 * @private
	 * @param {Object} rule1 - 规则1
	 * @param {Object} rule2 - 规则2
	 * @returns {boolean} 是否相似
	 */
	_rulesHaveSimilarPatterns(rule1, rule2) {
		// 简单的相似性检查：比较patterns数组
		if (rule1.patterns && rule2.patterns) {
			for (const pattern1 of rule1.patterns) {
				for (const pattern2 of rule2.patterns) {
					if (pattern1 === pattern2) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/**
	 * 清理审计参数
	 * @private
	 * @param {Object} params - 原始参数
	 * @returns {Object} 清理后的参数
	 */
	_sanitizeAuditParams(params) {
		const sanitized = { ...params };

		// 移除敏感信息
		const sensitiveKeys = ["password", "token", "key", "secret"];
		for (const key of sensitiveKeys) {
			if (sanitized[key]) {
				sanitized[key] = "[REDACTED]";
			}
		}

		// 限制大对象的长度
		const maxLength = 1000;
		for (const [key, value] of Object.entries(sanitized)) {
			if (typeof value === "string" && value.length > maxLength) {
				sanitized[key] = value.substring(0, maxLength) + "...";
			}
		}

		return sanitized;
	}
}

// ServiceMiddleware and ValidationResult are already exported via class declarations
