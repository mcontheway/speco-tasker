/**
 * 清理服务
 * 提供AI内容清理和品牌信息清理功能
 */

import fs from "fs/promises";
import path from "path";
import {
	CleanupRule,
	CleanupType,
	CleanupAction,
} from "../models/CleanupRule.js";

/**
 * CleanupService 类
 * 负责清理操作的服务层
 */
class CleanupService {
	/**
	 * 构造函数
	 * @param {PathService} pathService - 路径服务实例
	 */
	constructor(pathService) {
		this.pathService = pathService;
		this.rules = [];
		this.cache = new Map();
	}

	/**
	 * 初始化清理服务
	 * @param {Object} config - 配置对象
	 * @returns {Promise<Object>} 初始化结果
	 */
	async initialize(config = {}) {
		try {
			// 尝试加载清理规则配置文件
			let loadedRules = [];
			try {
				const rulesData = await this.pathService.readConfigFile("cleanup");
				loadedRules = rulesData.rules || [];
			} catch (error) {
				// 规则文件不存在，使用默认规则
				console.log("清理规则文件不存在，使用默认规则");
				loadedRules = CleanupRule.getDefaultRules().map((rule) =>
					rule.toJSON(),
				);
			}

			// 加载并验证规则
			this.rules = loadedRules.map((ruleData) => {
				const rule = CleanupRule.fromJSON(ruleData);
				const validation = rule.validate();
				if (!validation.valid) {
					console.warn(
						`清理规则验证失败 (${rule.name}): ${validation.errors.join(", ")}`,
					);
				}
				return rule;
			});

			// 如果没有规则，使用默认规则
			if (this.rules.length === 0) {
				this.rules = CleanupRule.getDefaultRules();
			}

			return {
				success: true,
				rulesCount: this.rules.length,
				rules: this.rules.map((rule) => rule.getSummary()),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 执行清理操作
	 * @param {Object} options - 清理选项
	 * @returns {Promise<Object>} 清理结果
	 */
	async cleanup(options = {}) {
		const results = {
			success: true,
			totalFiles: 0,
			processedFiles: 0,
			changes: [],
			errors: [],
			summary: {},
		};

		try {
			// 获取需要清理的文件列表
			const filesToProcess = await this.scanFiles(options);

			results.totalFiles = filesToProcess.length;

			for (const fileInfo of filesToProcess) {
				try {
					const fileResult = await this.processFile(fileInfo, options);
					if (fileResult.processed) {
						results.processedFiles++;
						results.changes.push(fileResult);
					}
				} catch (error) {
					results.errors.push({
						file: fileInfo.path,
						error: error.message,
					});
				}
			}

			// 生成摘要
			results.summary = this.generateSummary(results);
		} catch (error) {
			results.success = false;
			results.errors.push({
				operation: "cleanup",
				error: error.message,
			});
		}

		return results;
	}

	/**
	 * 扫描需要处理的文件
	 * @param {Object} options - 扫描选项
	 * @returns {Promise<Array>} 文件列表
	 */
	async scanFiles(options = {}) {
		const files = [];
		const scanPath = options.path || this.pathService.projectRoot;
		const excludePatterns = options.exclude || [
			"node_modules",
			".git",
			".speco",
		];

		const scanDirectory = async (dir, relativePath = "") => {
			try {
				const items = await fs.readdir(dir, { withFileTypes: true });

				for (const item of items) {
					const fullPath = path.join(dir, item.name);
					const itemRelativePath = path.join(relativePath, item.name);

					// 检查是否应该排除
					const shouldExclude = excludePatterns.some((pattern) => {
						return (
							itemRelativePath.includes(pattern) ||
							item.name.startsWith(".") ||
							item.name === "node_modules"
						);
					});

					if (shouldExclude) {
						continue;
					}

					if (item.isDirectory()) {
						await scanDirectory(fullPath, itemRelativePath);
					} else if (item.isFile()) {
						// 检查文件扩展名
						const ext = path.extname(item.name).toLowerCase();
						const allowedExts = options.extensions || [
							".js",
							".ts",
							".json",
							".md",
							".txt",
							".yml",
							".yaml",
						];

						if (allowedExts.includes(ext) || allowedExts.includes("*")) {
							try {
								const content = await fs.readFile(fullPath, "utf8");
								files.push({
									path: itemRelativePath,
									fullPath,
									content,
									size: content.length,
									extension: ext,
								});
							} catch (error) {
								// 跳过无法读取的文件
								console.warn(
									`无法读取文件 ${itemRelativePath}: ${error.message}`,
								);
							}
						}
					}
				}
			} catch (error) {
				console.warn(`扫描目录时出错 ${dir}: ${error.message}`);
			}
		};

		await scanDirectory(scanPath);
		return files;
	}

	/**
	 * 处理单个文件
	 * @param {Object} fileInfo - 文件信息
	 * @param {Object} options - 处理选项
	 * @returns {Promise<Object>} 处理结果
	 */
	async processFile(fileInfo, options = {}) {
		const result = {
			file: fileInfo.path,
			processed: false,
			changes: [],
			originalSize: fileInfo.size,
		};

		let content = fileInfo.content;
		let hasChanges = false;

		// 应用每个启用的规则
		for (const rule of this.rules) {
			if (!rule.metadata.enabled) {
				continue;
			}

			// 检查规则是否匹配文件
			const matchResult = rule.matches(fileInfo.path, content);
			if (matchResult.matches) {
				// 执行清理操作
				const executeResult = rule.execute(content);

				if (executeResult.success && executeResult.changes.length > 0) {
					content = executeResult.result;
					hasChanges = true;

					result.changes.push({
						rule: rule.name,
						action: rule.action,
						changes: executeResult.changes.length,
						details: executeResult.details.changes,
					});

					// 更新规则统计
					rule.stats.processed++;
					if (executeResult.details.changes.length > 0) {
						rule.stats.matches++;
					}
				}
			}
		}

		// 如果有变化且不是预览模式，保存文件
		if (hasChanges && !options.preview) {
			try {
				await fs.writeFile(fileInfo.fullPath, content, "utf8");
				result.processed = true;
				result.newSize = content.length;
				result.saved = true;
			} catch (error) {
				throw new Error(`保存文件失败: ${error.message}`);
			}
		} else if (hasChanges && options.preview) {
			result.processed = true;
			result.newSize = content.length;
			result.preview = true;
		}

		return result;
	}

	/**
	 * 验证清理结果
	 * @param {Object} options - 验证选项
	 * @returns {Promise<Object>} 验证结果
	 */
	async validateCleanup(options = {}) {
		const results = {
			success: true,
			validations: [],
			errors: [],
		};

		try {
			// 扫描文件进行验证
			const files = await this.scanFiles(options);

			for (const file of files) {
				const validations = [];

				// 对每个规则进行验证
				for (const rule of this.rules) {
					if (!rule.metadata.enabled) {
						continue;
					}

					const matchResult = rule.matches(file.path, file.content);
					if (matchResult.matches) {
						// 检查验证规则
						const validationResult = rule.validateResult(file.content);
						validations.push({
							rule: rule.name,
							valid: validationResult.valid,
							errors: validationResult.errors,
						});

						if (!validationResult.valid) {
							results.errors.push({
								file: file.path,
								rule: rule.name,
								errors: validationResult.errors,
							});
						}
					}
				}

				if (validations.length > 0) {
					results.validations.push({
						file: file.path,
						validations,
					});
				}
			}

			results.success = results.errors.length === 0;
		} catch (error) {
			results.success = false;
			results.errors.push({
				operation: "validation",
				error: error.message,
			});
		}

		return results;
	}

	/**
	 * 添加清理规则
	 * @param {Object} ruleConfig - 规则配置
	 * @returns {Promise<Object>} 添加结果
	 */
	async addRule(ruleConfig) {
		try {
			const rule = new CleanupRule(ruleConfig);
			const validation = rule.validate();

			if (!validation.valid) {
				throw new Error(`规则验证失败: ${validation.errors.join(", ")}`);
			}

			this.rules.push(rule);
			await this.saveRules();

			return {
				success: true,
				rule: rule.getSummary(),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 更新清理规则
	 * @param {string} ruleId - 规则ID
	 * @param {Object} updates - 更新对象
	 * @returns {Promise<Object>} 更新结果
	 */
	async updateRule(ruleId, updates) {
		try {
			const rule = this.rules.find((r) => r.id === ruleId);
			if (!rule) {
				throw new Error(`规则不存在: ${ruleId}`);
			}

			rule.update(updates);
			const validation = rule.validate();

			if (!validation.valid) {
				throw new Error(`规则更新验证失败: ${validation.errors.join(", ")}`);
			}

			await this.saveRules();

			return {
				success: true,
				rule: rule.getSummary(),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 删除清理规则
	 * @param {string} ruleId - 规则ID
	 * @returns {Promise<Object>} 删除结果
	 */
	async removeRule(ruleId) {
		try {
			const index = this.rules.findIndex((r) => r.id === ruleId);
			if (index === -1) {
				throw new Error(`规则不存在: ${ruleId}`);
			}

			const removedRule = this.rules.splice(index, 1)[0];
			await this.saveRules();

			return {
				success: true,
				removedRule: removedRule.getSummary(),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 获取清理规则列表
	 * @param {Object} filter - 过滤选项
	 * @returns {Array} 规则列表
	 */
	getRules(filter = {}) {
		let filteredRules = this.rules;

		if (filter.type) {
			filteredRules = filteredRules.filter((r) => r.type === filter.type);
		}

		if (filter.enabled !== undefined) {
			filteredRules = filteredRules.filter(
				(r) => r.metadata.enabled === filter.enabled,
			);
		}

		return filteredRules.map((rule) => rule.getSummary());
	}

	/**
	 * 获取清理统计信息
	 * @returns {Object} 统计信息
	 */
	getStatistics() {
		const stats = {
			totalRules: this.rules.length,
			enabledRules: this.rules.filter((r) => r.metadata.enabled).length,
			disabledRules: this.rules.filter((r) => !r.metadata.enabled).length,
			rulesByType: {},
			totalProcessed: 0,
			totalMatches: 0,
			totalErrors: 0,
		};

		// 按类型统计规则
		this.rules.forEach((rule) => {
			stats.rulesByType[rule.type] = (stats.rulesByType[rule.type] || 0) + 1;
			stats.totalProcessed += rule.stats.processed;
			stats.totalMatches += rule.stats.matches;
			stats.totalErrors += rule.stats.errors;
		});

		return stats;
	}

	/**
	 * 保存清理规则到文件
	 * @returns {Promise<boolean>} 成功状态
	 */
	async saveRules() {
		try {
			const rulesData = {
				rules: this.rules.map((rule) => rule.toJSON()),
				metadata: {
					exported: new Date().toISOString(),
					version: "1.0.0",
					count: this.rules.length,
				},
			};

			await this.pathService.writeConfigFile("cleanup", rulesData);
			return true;
		} catch (error) {
			throw new Error(`保存清理规则失败: ${error.message}`);
		}
	}

	/**
	 * 生成清理摘要
	 * @param {Object} results - 清理结果
	 * @returns {Object} 摘要信息
	 */
	generateSummary(results) {
		const summary = {
			totalFiles: results.totalFiles,
			processedFiles: results.processedFiles,
			unchangedFiles: results.totalFiles - results.processedFiles,
			totalChanges: 0,
			changesByRule: {},
			changesByAction: {},
			errors: results.errors.length,
		};

		results.changes.forEach((change) => {
			summary.totalChanges += change.changes;

			// 按规则统计
			summary.changesByRule[change.rule] =
				(summary.changesByRule[change.rule] || 0) + change.changes;

			// 按动作统计
			summary.changesByAction[change.action] =
				(summary.changesByAction[change.action] || 0) + 1;
		});

		return summary;
	}

	/**
	 * 重置清理统计
	 * @returns {Promise<boolean>} 成功状态
	 */
	async resetStatistics() {
		try {
			this.rules.forEach((rule) => {
				rule.stats = {
					matches: 0,
					processed: 0,
					errors: 0,
					lastRun: null,
				};
			});

			await this.saveRules();
			return true;
		} catch (error) {
			throw new Error(`重置统计失败: ${error.message}`);
		}
	}

	/**
	 * 导出清理配置
	 * @param {string} exportPath - 导出路径
	 * @returns {Promise<boolean>} 成功状态
	 */
	async exportConfiguration(exportPath) {
		try {
			const exportData = {
				rules: this.rules.map((rule) => rule.toJSON()),
				statistics: this.getStatistics(),
				exported: new Date().toISOString(),
				version: "1.0.0",
			};

			const fullExportPath = path.resolve(
				this.pathService.projectRoot,
				exportPath,
			);
			await fs.writeFile(
				fullExportPath,
				JSON.stringify(exportData, null, 2),
				"utf8",
			);

			return true;
		} catch (error) {
			throw new Error(`导出配置失败: ${error.message}`);
		}
	}

	/**
	 * 导入清理配置
	 * @param {string} importPath - 导入路径
	 * @returns {Promise<Object>} 导入结果
	 */
	async importConfiguration(importPath) {
		try {
			const fullImportPath = path.resolve(
				this.pathService.projectRoot,
				importPath,
			);
			const importData = JSON.parse(await fs.readFile(fullImportPath, "utf8"));

			if (!importData.rules || !Array.isArray(importData.rules)) {
				throw new Error("无效的配置文件格式");
			}

			// 验证并导入规则
			const importedRules = [];
			for (const ruleData of importData.rules) {
				try {
					const rule = CleanupRule.fromJSON(ruleData);
					const validation = rule.validate();

					if (validation.valid) {
						importedRules.push(rule);
					} else {
						console.warn(
							`跳过无效规则 (${ruleData.name}): ${validation.errors.join(", ")}`,
						);
					}
				} catch (error) {
					console.warn(`跳过无法导入的规则: ${error.message}`);
				}
			}

			this.rules = importedRules;
			await this.saveRules();

			return {
				success: true,
				importedCount: importedRules.length,
				skippedCount: importData.rules.length - importedRules.length,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 获取服务状态
	 * @returns {Object} 服务状态
	 */
	getStatus() {
		return {
			initialized: this.rules.length > 0,
			rulesCount: this.rules.length,
			enabledRules: this.rules.filter((r) => r.metadata.enabled).length,
			cacheSize: this.cache.size,
			statistics: this.getStatistics(),
		};
	}

	/**
	 * 清理缓存
	 */
	clearCache() {
		this.cache.clear();
	}

	/**
	 * 销毁服务
	 */
	destroy() {
		this.clearCache();
		this.rules = [];
		this.pathService = null;
	}
}

export { CleanupService };
