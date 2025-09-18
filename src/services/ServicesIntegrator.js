/**
 * 服务集成器
 * 提供PathService、BrandService、CleanupService的统一集成和管理
 */

import { PathService } from "./PathService.js";
import { BrandService } from "./BrandService.js";
import { CleanupService } from "./CleanupService.js";

export class ServicesIntegrator {
	/**
	 * 构造函数
	 * @param {string} projectRoot - 项目根目录
	 */
	constructor(projectRoot = process.cwd()) {
		this.projectRoot = projectRoot;
		this.services = {};
		this.initialized = false;
	}

	/**
	 * 初始化所有服务
	 * @param {Object} config - 配置对象
	 * @returns {Promise<Object>} 初始化结果
	 */
	async initialize(config = {}) {
		try {
			// 1. 初始化路径服务（其他服务的基础）
			this.services.pathService = new PathService(null, this.projectRoot);
			const pathResult = await this.services.pathService.initialize({
				root: config.root || { speco: ".speco" },
				dirs: config.dirs || {},
				files: config.files || {},
			});

			if (!pathResult.success) {
				throw new Error(`路径服务初始化失败: ${pathResult.error}`);
			}

			// 2. 初始化品牌服务（依赖路径服务）
			this.services.brandService = new BrandService(this.services.pathService);
			const brandResult = await this.services.brandService.initialize({
				name: config.brand?.name || "Speco Tasker",
				command: config.brand?.command || "speco-tasker",
				version: config.brand?.version || "1.2.0",
			});

			if (!brandResult.success) {
				throw new Error(`品牌服务初始化失败: ${brandResult.error}`);
			}

			// 3. 初始化清理服务（依赖路径服务）
			this.services.cleanupService = new CleanupService(
				this.services.pathService,
			);
			const cleanupResult = await this.services.cleanupService.initialize({
				rules: config.cleanup?.rules || [],
			});

			if (!cleanupResult.success) {
				throw new Error(`清理服务初始化失败: ${cleanupResult.error}`);
			}

			this.initialized = true;

			return {
				success: true,
				services: {
					pathService: pathResult.config,
					brandService: brandResult.brand,
					cleanupService: {
						rulesCount: cleanupResult.rulesCount,
						rules: cleanupResult.rules,
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				services: this.services,
			};
		}
	}

	/**
	 * 获取路径服务实例
	 * @returns {PathService} 路径服务实例
	 */
	getPathService() {
		if (!this.services.pathService) {
			throw new Error("路径服务未初始化");
		}
		return this.services.pathService;
	}

	/**
	 * 获取品牌服务实例
	 * @returns {BrandService} 品牌服务实例
	 */
	getBrandService() {
		if (!this.services.brandService) {
			throw new Error("品牌服务未初始化");
		}
		return this.services.brandService;
	}

	/**
	 * 获取清理服务实例
	 * @returns {CleanupService} 清理服务实例
	 */
	getCleanupService() {
		if (!this.services.cleanupService) {
			throw new Error("清理服务未初始化");
		}
		return this.services.cleanupService;
	}

	/**
	 * 执行品牌重塑操作
	 * @param {Object} newBrand - 新品牌信息
	 * @param {Object} options - 重塑选项
	 * @returns {Promise<Object>} 重塑结果
	 */
	async rebrand(newBrand, options = {}) {
		try {
			if (!this.initialized) {
				throw new Error("服务集成器未初始化");
			}

			const result = await this.services.brandService.rebrand(
				newBrand,
				options,
			);

			if (result.success) {
				// 重新初始化清理规则以适应新品牌
				await this._updateCleanupRulesForBrand(result.newBrand);
			}

			return result;
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 执行AI内容清理
	 * @param {Object} options - 清理选项
	 * @returns {Promise<Object>} 清理结果
	 */
	async cleanupAIContent(options = {}) {
		try {
			if (!this.initialized) {
				throw new Error("服务集成器未初始化");
			}

			return await this.services.cleanupService.cleanup({
				...options,
				aiContent: true,
			});
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 执行品牌信息清理
	 * @param {Object} options - 清理选项
	 * @returns {Promise<Object>} 清理结果
	 */
	async cleanupBrandInfo(options = {}) {
		try {
			if (!this.initialized) {
				throw new Error("服务集成器未初始化");
			}

			return await this.services.cleanupService.cleanup({
				...options,
				brandInfo: true,
			});
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 验证清理结果
	 * @param {Object} options - 验证选项
	 * @returns {Promise<Object>} 验证结果
	 */
	async validateCleanup(options = {}) {
		try {
			if (!this.initialized) {
				throw new Error("服务集成器未初始化");
			}

			return await this.services.cleanupService.validateCleanup(options);
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 获取路径配置
	 * @returns {Object} 路径配置
	 */
	getPathConfig() {
		return this.services.pathService?.getPathSnapshot();
	}

	/**
	 * 获取品牌信息
	 * @returns {Object} 品牌信息
	 */
	getBrandInfo() {
		return this.services.brandService?.getBrandSummary();
	}

	/**
	 * 获取清理统计
	 * @returns {Object} 清理统计
	 */
	getCleanupStats() {
		return this.services.cleanupService?.getStatistics();
	}

	/**
	 * 获取系统状态
	 * @returns {Object} 系统状态
	 */
	getSystemStatus() {
		return {
			initialized: this.initialized,
			projectRoot: this.projectRoot,
			services: {
				pathService: this.services.pathService?.getStatus(),
				brandService: this.services.brandService?.getStatus(),
				cleanupService: this.services.cleanupService?.getStatus(),
			},
		};
	}

	/**
	 * 更新配置
	 * @param {Object} updates - 更新对象
	 * @returns {Promise<boolean>} 成功状态
	 */
	async updateConfiguration(updates) {
		try {
			if (!this.initialized) {
				throw new Error("服务集成器未初始化");
			}

			// 更新路径配置
			if (updates.paths) {
				await this.services.pathService.updateConfiguration(updates.paths);
			}

			// 更新品牌信息
			if (updates.brand) {
				await this.services.brandService.updateBrand(updates.brand);
			}

			// 更新清理规则
			if (updates.cleanup) {
				if (updates.cleanup.addRules) {
					for (const rule of updates.cleanup.addRules) {
						await this.services.cleanupService.addRule(rule);
					}
				}
				if (updates.cleanup.updateRules) {
					for (const [ruleId, updates] of Object.entries(
						updates.cleanup.updateRules,
					)) {
						await this.services.cleanupService.updateRule(ruleId, updates);
					}
				}
			}

			return true;
		} catch (error) {
			throw new Error(`配置更新失败: ${error.message}`);
		}
	}

	/**
	 * 重置为默认配置
	 * @returns {Promise<boolean>} 成功状态
	 */
	async resetToDefaults() {
		try {
			if (!this.initialized) {
				throw new Error("服务集成器未初始化");
			}

			await this.services.pathService.resetToDefault();
			await this.services.brandService.resetToDefault();
			await this.services.cleanupService.resetStatistics();

			return true;
		} catch (error) {
			throw new Error(`重置配置失败: ${error.message}`);
		}
	}

	/**
	 * 清理缓存
	 */
	clearCache() {
		if (this.services.pathService) {
			this.services.pathService.clearCache();
		}
		if (this.services.brandService) {
			this.services.brandService.clearCache();
		}
		if (this.services.cleanupService) {
			this.services.cleanupService.clearCache();
		}
	}

	/**
	 * 销毁服务集成器
	 */
	destroy() {
		this.clearCache();

		if (this.services.pathService) {
			this.services.pathService.destroy();
		}
		if (this.services.brandService) {
			this.services.brandService.destroy();
		}
		if (this.services.cleanupService) {
			this.services.cleanupService.destroy();
		}

		this.services = {};
		this.initialized = false;
	}

	/**
	 * 更新清理规则以适应新品牌
	 * @private
	 * @param {Object} newBrand - 新品牌信息
	 */
	async _updateCleanupRulesForBrand(newBrand) {
		try {
			// 获取当前清理规则
			const rules = this.services.cleanupService.getRules();

			// 更新品牌相关的清理规则
			for (const rule of rules) {
				if (rule.type === "brand_info") {
					// 更新品牌关键词
					const oldBrandName = rule.metadata?.oldBrandName;
					if (oldBrandName && newBrand.name) {
						rule.contentPatterns = rule.contentPatterns.map((pattern) => {
							if (typeof pattern === "string") {
								return pattern.replace(
									new RegExp(oldBrandName, "gi"),
									newBrand.name,
								);
							}
							return pattern;
						});
					}

					// 保存更新后的规则
					await this.services.cleanupService.updateRule(rule.id, {
						contentPatterns: rule.contentPatterns,
						metadata: {
							...rule.metadata,
							lastBrandUpdate: new Date().toISOString(),
						},
					});
				}
			}
		} catch (error) {
			console.warn("更新清理规则失败:", error.message);
		}
	}
}

export { ServicesIntegrator };
