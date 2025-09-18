/**
 * 品牌信息服务
 * 提供品牌信息的加载、管理和应用功能
 */

import fs from "fs/promises";
import path from "path";
import { BrandInfo } from "../models/BrandInfo.js";

/**
 * BrandService 类
 * 负责品牌信息的服务层
 */
class BrandService {
	/**
	 * 构造函数
	 * @param {PathService} pathService - 路径服务实例
	 */
	constructor(pathService) {
		this.pathService = pathService;
		this.brandInfo = null;
		this.cache = new Map();
	}

	/**
	 * 初始化品牌服务
	 * @param {Object} config - 配置对象
	 * @returns {Promise<Object>} 初始化结果
	 */
	async initialize(config = {}) {
		try {
			// 尝试加载品牌配置文件
			let loadedBrand = null;
			try {
				loadedBrand = await this.pathService.readConfigFile("brand");
			} catch (error) {
				// 品牌文件不存在，使用默认品牌信息
				console.log("品牌配置文件不存在，使用默认品牌信息");
			}

			// 合并配置
			const mergedConfig = { ...loadedBrand, ...config };
			this.brandInfo = new BrandInfo(mergedConfig);

			// 验证品牌信息
			const validation = this.brandInfo.validate();
			if (!validation.valid) {
				throw new Error(`品牌信息验证失败: ${validation.errors.join(", ")}`);
			}

			return {
				success: true,
				brand: this.brandInfo.getDisplayInfo(),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 获取品牌显示信息
	 * @returns {Object} 显示信息
	 */
	getDisplayInfo() {
		if (!this.brandInfo) {
			throw new Error("品牌服务未初始化");
		}
		return this.brandInfo.getDisplayInfo();
	}

	/**
	 * 获取技术信息
	 * @returns {Object} 技术信息
	 */
	getTechInfo() {
		if (!this.brandInfo) {
			throw new Error("品牌服务未初始化");
		}
		return this.brandInfo.getTechInfo();
	}

	/**
	 * 获取CLI相关信息
	 * @returns {Object} CLI信息
	 */
	getCLIInfo() {
		if (!this.brandInfo) {
			throw new Error("品牌服务未初始化");
		}
		return this.brandInfo.getCLIInfo();
	}

	/**
	 * 获取完整的品牌摘要
	 * @returns {Object} 品牌摘要
	 */
	getBrandSummary() {
		if (!this.brandInfo) {
			throw new Error("品牌服务未初始化");
		}
		return this.brandInfo.getSummary();
	}

	/**
	 * 更新品牌信息
	 * @param {Object} updates - 更新对象
	 * @returns {Promise<boolean>} 成功状态
	 */
	async updateBrand(updates) {
		try {
			if (!this.brandInfo) {
				throw new Error("品牌服务未初始化");
			}

			this.brandInfo.update(updates);

			// 验证更新后的品牌信息
			const validation = this.brandInfo.validate();
			if (!validation.valid) {
				throw new Error(
					`品牌信息更新验证失败: ${validation.errors.join(", ")}`,
				);
			}

			// 保存品牌信息
			await this.pathService.writeConfigFile("brand", this.brandInfo.toJSON());

			// 清空缓存
			this.cache.clear();

			return true;
		} catch (error) {
			throw new Error(`更新品牌信息失败: ${error.message}`);
		}
	}

	/**
	 * 执行品牌重塑
	 * @param {Object} newBrand - 新品牌信息
	 * @param {Object} options - 重塑选项
	 * @returns {Promise<Object>} 重塑结果
	 */
	async rebrand(newBrand, options = {}) {
		try {
			if (!this.brandInfo) {
				throw new Error("品牌服务未初始化");
			}

			const oldBrand = this.brandInfo.toJSON();

			// 创建重塑配置
			this.brandInfo = BrandInfo.createRebrand(oldBrand, newBrand);

			// 验证新品牌信息
			const validation = this.brandInfo.validate();
			if (!validation.valid) {
				throw new Error(`品牌重塑验证失败: ${validation.errors.join(", ")}`);
			}

			// 保存新的品牌信息
			await this.pathService.writeConfigFile("brand", this.brandInfo.toJSON());

			// 如果需要，执行文件重命名
			if (options.renameFiles) {
				await this.renameBrandedFiles(oldBrand, newBrand);
			}

			// 如果需要，更新配置文件中的引用
			if (options.updateReferences) {
				await this.updateBrandReferences(oldBrand, newBrand);
			}

			return {
				success: true,
				oldBrand,
				newBrand: this.brandInfo.toJSON(),
				changes: this.calculateRebrandChanges(oldBrand, newBrand),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 重命名品牌相关文件
	 * @param {Object} oldBrand - 旧品牌信息
	 * @param {Object} newBrand - 新品牌信息
	 * @returns {Promise<Array>} 重命名结果
	 */
	async renameBrandedFiles(oldBrand, newBrand) {
		const results = [];

		try {
			// 获取需要重命名的文件列表
			const filesToRename = await this.findBrandedFiles(oldBrand);

			for (const file of filesToRename) {
				try {
					const newFileName = this.generateNewFileName(
						file,
						oldBrand,
						newBrand,
					);
					if (newFileName !== file) {
						const oldPath = path.join(this.pathService.projectRoot, file);
						const newPath = path.join(
							this.pathService.projectRoot,
							newFileName,
						);

						await fs.rename(oldPath, newPath);
						results.push({
							oldPath: file,
							newPath: newFileName,
							success: true,
						});
					}
				} catch (error) {
					results.push({
						oldPath: file,
						success: false,
						error: error.message,
					});
				}
			}
		} catch (error) {
			console.error("文件重命名过程中出错:", error);
		}

		return results;
	}

	/**
	 * 查找品牌相关文件
	 * @param {Object} brand - 品牌信息
	 * @returns {Promise<Array>} 文件列表
	 */
	async findBrandedFiles(brand) {
		const brandedFiles = [];
		const patterns = [
			brand.command || "task-master",
			brand.name.toLowerCase().replace(/\s+/g, "-"),
			"taskmaster",
			"task-master",
		];

		try {
			// 递归查找文件
			const findFiles = async (dir) => {
				const items = await fs.readdir(dir, { withFileTypes: true });

				for (const item of items) {
					const fullPath = path.join(dir, item.name);
					const relativePath = path.relative(
						this.pathService.projectRoot,
						fullPath,
					);

					// 跳过node_modules和隐藏目录
					if (item.name.startsWith(".") || item.name === "node_modules") {
						continue;
					}

					if (item.isDirectory()) {
						await findFiles(fullPath);
					} else if (item.isFile()) {
						// 检查文件名是否包含品牌关键词
						const fileName = item.name.toLowerCase();
						const matches = patterns.some((pattern) =>
							fileName.includes(pattern.toLowerCase()),
						);

						if (matches) {
							brandedFiles.push(relativePath);
						}
					}
				}
			};

			await findFiles(this.pathService.projectRoot);
		} catch (error) {
			console.error("查找品牌文件时出错:", error);
		}

		return brandedFiles;
	}

	/**
	 * 生成新的文件名
	 * @param {string} oldFileName - 旧文件名
	 * @param {Object} oldBrand - 旧品牌信息
	 * @param {Object} newBrand - 新品牌信息
	 * @returns {string} 新文件名
	 */
	generateNewFileName(oldFileName, oldBrand, newBrand) {
		let newFileName = oldFileName;

		// 替换命令名
		if (oldBrand.command && newBrand.command) {
			newFileName = newFileName.replace(
				new RegExp(oldBrand.command, "gi"),
				newBrand.command,
			);
		}

		// 替换品牌名（转换为文件名格式）
		if (oldBrand.name && newBrand.name) {
			const oldNameSlug = oldBrand.name.toLowerCase().replace(/\s+/g, "-");
			const newNameSlug = newBrand.name.toLowerCase().replace(/\s+/g, "-");

			newFileName = newFileName.replace(
				new RegExp(oldNameSlug, "gi"),
				newNameSlug,
			);
		}

		return newFileName;
	}

	/**
	 * 更新品牌引用
	 * @param {Object} oldBrand - 旧品牌信息
	 * @param {Object} newBrand - 新品牌信息
	 * @returns {Promise<Array>} 更新结果
	 */
	async updateBrandReferences(oldBrand, newBrand) {
		const results = [];

		try {
			// 查找包含品牌引用的文件
			const filesWithReferences =
				await this.findFilesWithBrandReferences(oldBrand);

			for (const file of filesWithReferences) {
				try {
					const filePath = path.join(this.pathService.projectRoot, file);
					let content = await fs.readFile(filePath, "utf8");

					// 更新品牌引用
					content = this.updateBrandContent(content, oldBrand, newBrand);

					// 如果内容有变化，写回文件
					if (content !== (await fs.readFile(filePath, "utf8"))) {
						await fs.writeFile(filePath, content, "utf8");
						results.push({
							file,
							success: true,
							changes: "品牌引用已更新",
						});
					} else {
						results.push({
							file,
							success: true,
							changes: "无需更新",
						});
					}
				} catch (error) {
					results.push({
						file,
						success: false,
						error: error.message,
					});
				}
			}
		} catch (error) {
			console.error("更新品牌引用时出错:", error);
		}

		return results;
	}

	/**
	 * 查找包含品牌引用的文件
	 * @param {Object} brand - 品牌信息
	 * @returns {Promise<Array>} 文件列表
	 */
	async findFilesWithBrandReferences(brand) {
		const filesWithRefs = [];
		const patterns = [
			brand.name,
			brand.command,
			brand.shortName,
			brand.tagline,
		].filter(Boolean);

		try {
			const findFiles = async (dir) => {
				const items = await fs.readdir(dir, { withFileTypes: true });

				for (const item of items) {
					const fullPath = path.join(dir, item.name);

					// 跳过node_modules、隐藏目录和二进制文件
					if (
						item.name.startsWith(".") ||
						item.name === "node_modules" ||
						item.name.endsWith(".png") ||
						item.name.endsWith(".jpg") ||
						item.name.endsWith(".jpeg") ||
						item.name.endsWith(".gif")
					) {
						continue;
					}

					if (item.isDirectory()) {
						await findFiles(fullPath);
					} else if (item.isFile()) {
						try {
							const content = await fs.readFile(fullPath, "utf8");
							const hasRefs = patterns.some((pattern) =>
								content.includes(pattern),
							);

							if (hasRefs) {
								filesWithRefs.push(
									path.relative(this.pathService.projectRoot, fullPath),
								);
							}
						} catch (error) {
							// 跳过无法读取的文件
							continue;
						}
					}
				}
			};

			await findFiles(this.pathService.projectRoot);
		} catch (error) {
			console.error("查找品牌引用文件时出错:", error);
		}

		return filesWithRefs;
	}

	/**
	 * 更新文件内容中的品牌引用
	 * @param {string} content - 文件内容
	 * @param {Object} oldBrand - 旧品牌信息
	 * @param {Object} newBrand - 新品牌信息
	 * @returns {string} 更新后的内容
	 */
	updateBrandContent(content, oldBrand, newBrand) {
		let updatedContent = content;

		// 更新品牌名
		if (oldBrand.name && newBrand.name) {
			updatedContent = updatedContent.replace(
				new RegExp(oldBrand.name, "g"),
				newBrand.name,
			);
		}

		// 更新命令名
		if (oldBrand.command && newBrand.command) {
			updatedContent = updatedContent.replace(
				new RegExp(oldBrand.command, "g"),
				newBrand.command,
			);
		}

		// 更新简称
		if (oldBrand.shortName && newBrand.shortName) {
			updatedContent = updatedContent.replace(
				new RegExp(oldBrand.shortName, "g"),
				newBrand.shortName,
			);
		}

		// 更新标语
		if (oldBrand.tagline && newBrand.tagline) {
			updatedContent = updatedContent.replace(
				new RegExp(oldBrand.tagline, "g"),
				newBrand.tagline,
			);
		}

		return updatedContent;
	}

	/**
	 * 计算重塑变化
	 * @param {Object} oldBrand - 旧品牌信息
	 * @param {Object} newBrand - 新品牌信息
	 * @returns {Object} 变化详情
	 */
	calculateRebrandChanges(oldBrand, newBrand) {
		const changes = {};

		Object.keys(newBrand).forEach((key) => {
			if (oldBrand[key] !== newBrand[key]) {
				changes[key] = {
					from: oldBrand[key],
					to: newBrand[key],
				};
			}
		});

		return changes;
	}

	/**
	 * 验证品牌兼容性
	 * @param {string} version - 目标版本
	 * @returns {boolean} 是否兼容
	 */
	isVersionCompatible(version) {
		if (!this.brandInfo) {
			return false;
		}
		return this.brandInfo.isVersionCompatible(version);
	}

	/**
	 * 获取版本信息
	 * @returns {Object} 版本详情
	 */
	getVersionInfo() {
		if (!this.brandInfo) {
			throw new Error("品牌服务未初始化");
		}
		return this.brandInfo.getVersionInfo();
	}

	/**
	 * 重置为默认品牌
	 * @returns {Promise<boolean>} 成功状态
	 */
	async resetToDefault() {
		try {
			this.brandInfo = BrandInfo.getDefaultBrand();
			await this.pathService.writeConfigFile("brand", this.brandInfo.toJSON());
			this.cache.clear();
			return true;
		} catch (error) {
			throw new Error(`重置品牌失败: ${error.message}`);
		}
	}

	/**
	 * 获取服务状态
	 * @returns {Object} 服务状态
	 */
	getStatus() {
		return {
			initialized: !!this.brandInfo,
			cacheSize: this.cache.size,
			brandValidation: this.brandInfo ? this.brandInfo.validate() : null,
			currentBrand: this.brandInfo ? this.brandInfo.getDisplayInfo() : null,
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
		this.brandInfo = null;
		this.pathService = null;
	}
}

export { BrandService };
