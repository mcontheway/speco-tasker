/**
 * 服务集成器
 * 提供PathService的统一集成和管理
 * Speco Tasker - 纯手动任务管理系统
 */

import { PathService } from "./PathService.js";

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
	 * 初始化服务
	 * @param {Object} config - 配置对象
	 * @returns {Promise<Object>} 初始化结果
	 */
	async initialize(config = {}) {
		try {
			// 初始化路径服务
			this.services.pathService = new PathService(null, this.projectRoot);
			const pathResult = await this.services.pathService.initialize({
				root: config.root || { speco: ".speco" },
				dirs: config.dirs || {},
				files: config.files || {},
			});

			if (!pathResult.success) {
				throw new Error(`路径服务初始化失败: ${pathResult.error}`);
			}

			this.initialized = true;

			return {
				success: true,
				services: {
					pathService: pathResult.config,
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
	 * 获取路径配置
	 * @returns {Object} 路径配置
	 */
	getPathConfig() {
		return this.services.pathService?.getPathSnapshot();
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
	}

	/**
	 * 销毁服务集成器
	 */
	destroy() {
		this.clearCache();

		if (this.services.pathService) {
			this.services.pathService.destroy();
		}

		this.services = {};
		this.initialized = false;
	}
}

// ServicesIntegrator is already exported via class declaration
