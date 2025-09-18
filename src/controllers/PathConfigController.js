/**
 * 路径配置控制器
 * 处理路径配置相关的API端点
 */

import { PathService } from "../services/PathService.js";

/**
 * PathConfigController 类
 * 负责处理路径配置相关的HTTP请求
 */
class PathConfigController {
	/**
	 * 构造函数
	 * @param {PathService} pathService - 路径服务实例
	 */
	constructor(pathService) {
		this.pathService = pathService;
	}

	/**
	 * GET /paths - 获取路径配置信息
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async getPaths(req, res) {
		try {
			const includeDetails = req.query.details === "true";
			const tag = req.query.tag;

			const paths = this.pathService.getPathSnapshot();

			let response = {
				success: true,
				data: {
					paths,
					tag: tag || null,
					generatedAt: new Date().toISOString(),
				},
			};

			// 如果请求详细信息，添加更多元数据
			if (includeDetails) {
				const status = this.pathService.getStatus();
				const validation = this.pathService.validateConfiguration();

				response.data.details = {
					status,
					validation,
					configInfo: {
						projectRoot: this.pathService.projectRoot,
						cacheSize: this.pathService.cache.size,
					},
				};
			}

			res.json(response);
		} catch (error) {
			console.error("获取路径配置时出错:", error);
			res.status(500).json({
				success: false,
				error: "获取路径配置失败",
				message: error.message,
			});
		}
	}

	/**
	 * PUT /paths - 更新路径配置
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async updatePaths(req, res) {
		try {
			const updates = req.body;
			const options = req.query;

			if (!updates || typeof updates !== "object") {
				return res.status(400).json({
					success: false,
					error: "无效的更新数据",
					message: "请求体必须包含有效的路径配置更新对象",
				});
			}

			// 验证更新数据的安全性
			const validationResult = this.validatePathUpdates(updates);
			if (!validationResult.valid) {
				return res.status(400).json({
					success: false,
					error: "路径更新验证失败",
					message: validationResult.errors.join(", "),
				});
			}

			// 执行更新
			const success = await this.pathService.updateConfiguration(updates);

			if (success) {
				// 获取更新后的配置
				const newPaths = this.pathService.getPathSnapshot();

				res.json({
					success: true,
					data: {
						message: "路径配置更新成功",
						paths: newPaths,
						updatedAt: new Date().toISOString(),
						changes: this.calculatePathChanges(updates),
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: "路径配置更新失败",
					message: "更新过程中发生未知错误",
				});
			}
		} catch (error) {
			console.error("更新路径配置时出错:", error);
			res.status(500).json({
				success: false,
				error: "更新路径配置失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /paths/validate - 验证路径配置
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async validatePaths(req, res) {
		try {
			const config = req.body;
			const checkExistence = req.query.checkExistence === "true";

			if (!config || typeof config !== "object") {
				return res.status(400).json({
					success: false,
					error: "无效的配置数据",
					message: "请求体必须包含有效的路径配置对象",
				});
			}

			// 基本验证
			const validation = this.validatePathConfig(config);

			const result = {
				success: true,
				data: {
					valid: validation.valid,
					errors: validation.errors,
					warnings: validation.warnings || [],
					validatedAt: new Date().toISOString(),
				},
			};

			// 如果需要检查文件存在性
			if (checkExistence && validation.valid) {
				const existenceCheck = await this.checkPathExistence(config);
				result.data.existence = existenceCheck;
			}

			res.json(result);
		} catch (error) {
			console.error("验证路径配置时出错:", error);
			res.status(500).json({
				success: false,
				error: "验证路径配置失败",
				message: error.message,
			});
		}
	}

	/**
	 * GET /paths/info - 获取路径详细信息
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async getPathInfo(req, res) {
		try {
			const { type, key, tag } = req.query;

			if (!type || !key) {
				return res.status(400).json({
					success: false,
					error: "缺少必要参数",
					message: "必须提供 type 和 key 参数",
				});
			}

			if (!["root", "dir", "file"].includes(type)) {
				return res.status(400).json({
					success: false,
					error: "无效的路径类型",
					message: "type 必须是 root、dir 或 file",
				});
			}

			const pathInfo = await this.pathService.getPathInfo(type, key, tag);

			res.json({
				success: true,
				data: {
					...pathInfo,
					requestedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("获取路径信息时出错:", error);
			res.status(500).json({
				success: false,
				error: "获取路径信息失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /paths/resolve - 解析路径模板
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async resolvePath(req, res) {
		try {
			const { template, variables } = req.body;

			if (!template || typeof template !== "string") {
				return res.status(400).json({
					success: false,
					error: "无效的路径模板",
					message: "必须提供有效的路径模板字符串",
				});
			}

			const resolvedPath = this.pathService.resolvePath(
				template,
				variables || {},
			);

			res.json({
				success: true,
				data: {
					template,
					resolved: resolvedPath,
					variables: variables || {},
					resolvedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("解析路径时出错:", error);
			res.status(500).json({
				success: false,
				error: "解析路径失败",
				message: error.message,
			});
		}
	}

	/**
	 * GET /paths/list - 列出目录内容
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async listDirectory(req, res) {
		try {
			const { dirKey, tag } = req.query;

			if (!dirKey) {
				return res.status(400).json({
					success: false,
					error: "缺少目录键",
					message: "必须提供 dirKey 参数",
				});
			}

			const files = await this.pathService.listDirectory(dirKey, tag);

			res.json({
				success: true,
				data: {
					directory: dirKey,
					files,
					count: files.length,
					tag: tag || null,
					listedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("列出目录时出错:", error);
			res.status(500).json({
				success: false,
				error: "列出目录失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /paths/create - 创建目录
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async createDirectory(req, res) {
		try {
			const { dirKey, tag } = req.body;

			if (!dirKey) {
				return res.status(400).json({
					success: false,
					error: "缺少目录键",
					message: "必须提供 dirKey 参数",
				});
			}

			const success = await this.pathService.createDirectory(dirKey, tag);

			res.json({
				success,
				data: {
					message: success ? "目录创建成功" : "目录创建失败",
					directory: dirKey,
					tag: tag || null,
					createdAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("创建目录时出错:", error);
			res.status(500).json({
				success: false,
				error: "创建目录失败",
				message: error.message,
			});
		}
	}

	/**
	 * DELETE /paths - 删除路径
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async removePath(req, res) {
		try {
			const { type, key, tag, recursive } = req.body;

			if (!type || !key) {
				return res.status(400).json({
					success: false,
					error: "缺少必要参数",
					message: "必须提供 type 和 key 参数",
				});
			}

			if (!["root", "dir", "file"].includes(type)) {
				return res.status(400).json({
					success: false,
					error: "无效的路径类型",
					message: "type 必须是 root、dir 或 file",
				});
			}

			const options = {
				recursive: recursive === true,
			};

			const success = await this.pathService.remove(type, key, tag, options);

			res.json({
				success,
				data: {
					message: success ? "路径删除成功" : "路径删除失败",
					type,
					key,
					tag: tag || null,
					options,
					deletedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("删除路径时出错:", error);
			res.status(500).json({
				success: false,
				error: "删除路径失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /paths/copy - 复制路径
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async copyPath(req, res) {
		try {
			const { srcType, srcKey, destType, destKey, srcTag, destTag } = req.body;

			if (!srcType || !srcKey || !destType || !destKey) {
				return res.status(400).json({
					success: false,
					error: "缺少必要参数",
					message: "必须提供 srcType、srcKey、destType 和 destKey 参数",
				});
			}

			if (
				!["root", "dir", "file"].includes(srcType) ||
				!["root", "dir", "file"].includes(destType)
			) {
				return res.status(400).json({
					success: false,
					error: "无效的路径类型",
					message: "路径类型必须是 root、dir 或 file",
				});
			}

			const success = await this.pathService.copy(
				srcType,
				srcKey,
				destType,
				destKey,
				srcTag,
				destTag,
			);

			res.json({
				success,
				data: {
					message: success ? "路径复制成功" : "路径复制失败",
					source: { type: srcType, key: srcKey, tag: srcTag },
					destination: { type: destType, key: destKey, tag: destTag },
					copiedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("复制路径时出错:", error);
			res.status(500).json({
				success: false,
				error: "复制路径失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /paths/reset - 重置为默认配置
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async resetPaths(req, res) {
		try {
			const success = await this.pathService.resetToDefault();

			if (success) {
				const newPaths = this.pathService.getPathSnapshot();

				res.json({
					success: true,
					data: {
						message: "路径配置已重置为默认值",
						paths: newPaths,
						resetAt: new Date().toISOString(),
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: "重置路径配置失败",
					message: "重置过程中发生未知错误",
				});
			}
		} catch (error) {
			console.error("重置路径配置时出错:", error);
			res.status(500).json({
				success: false,
				error: "重置路径配置失败",
				message: error.message,
			});
		}
	}

	/**
	 * GET /paths/status - 获取路径服务状态
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async getPathStatus(req, res) {
		try {
			const status = this.pathService.getStatus();

			res.json({
				success: true,
				data: {
					...status,
					checkedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("获取路径状态时出错:", error);
			res.status(500).json({
				success: false,
				error: "获取路径状态失败",
				message: error.message,
			});
		}
	}

	/**
	 * 验证路径配置
	 * @param {Object} config - 配置对象
	 * @returns {Object} 验证结果
	 */
	validatePathConfig(config) {
		const errors = [];
		const warnings = [];

		// 验证根目录配置
		if (config.root) {
			if (config.root.speco && typeof config.root.speco !== "string") {
				errors.push("root.speco 必须是字符串");
			}

			if (config.root.speco && config.root.speco.length > 255) {
				errors.push("root.speco 路径长度不能超过255字符");
			}

			if (config.root.speco && /[<>:"|?*]/.test(config.root.speco)) {
				errors.push('root.speco 不能包含特殊字符 < > : " | ? *');
			}
		}

		// 验证目录配置
		if (config.dirs) {
			Object.entries(config.dirs).forEach(([key, value]) => {
				if (typeof value !== "string") {
					errors.push(`dirs.${key} 必须是字符串`);
				}

				if (value && value.length > 255) {
					errors.push(`dirs.${key} 路径长度不能超过255字符`);
				}

				if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
					errors.push(`dirs.${key} 只能包含字母、数字、下划线`);
				}
			});
		}

		// 验证文件配置
		if (config.files) {
			Object.entries(config.files).forEach(([key, value]) => {
				if (typeof value !== "string") {
					errors.push(`files.${key} 必须是字符串`);
				}

				if (value && value.length > 255) {
					errors.push(`files.${key} 文件名长度不能超过255字符`);
				}

				if (value && (value.includes("/") || value.includes("\\"))) {
					errors.push(`files.${key} 不能包含路径分隔符`);
				}
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * 验证路径更新
	 * @param {Object} updates - 更新对象
	 * @returns {Object} 验证结果
	 */
	validatePathUpdates(updates) {
		const errors = [];

		// 检查是否有危险的更新
		if (updates.root && updates.root.speco === "") {
			errors.push("不能将 root.speco 设置为空字符串");
		}

		// 检查路径遍历攻击
		const checkPathTraversal = (path) => {
			if (path && (path.includes("../") || path.includes("..\\"))) {
				return true;
			}
			return false;
		};

		if (updates.root) {
			Object.values(updates.root).forEach((path) => {
				if (checkPathTraversal(path)) {
					errors.push("路径不能包含路径遍历序列 (..)");
				}
			});
		}

		if (updates.dirs) {
			Object.values(updates.dirs).forEach((path) => {
				if (checkPathTraversal(path)) {
					errors.push("目录路径不能包含路径遍历序列 (..)");
				}
			});
		}

		if (updates.files) {
			Object.values(updates.files).forEach((path) => {
				if (checkPathTraversal(path)) {
					errors.push("文件路径不能包含路径遍历序列 (..)");
				}
			});
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 检查路径存在性
	 * @param {Object} config - 配置对象
	 * @returns {Promise<Object>} 存在性检查结果
	 */
	async checkPathExistence(config) {
		const existence = {
			directories: {},
			files: {},
		};

		// 检查目录存在性
		if (config.dirs) {
			for (const [key, dirName] of Object.entries(config.dirs)) {
				try {
					const dirPath = `${config.root?.speco || ".speco"}/${dirName}`;
					const exists = await this.pathService.fileExists("dir", key);
					existence.directories[key] = {
						path: dirPath,
						exists,
						type: "directory",
					};
				} catch (error) {
					existence.directories[key] = {
						path: `${config.root?.speco || ".speco"}/${dirName}`,
						exists: false,
						error: error.message,
						type: "directory",
					};
				}
			}
		}

		// 检查文件存在性
		if (config.files) {
			for (const [key, fileName] of Object.entries(config.files)) {
				try {
					const exists = await this.pathService.fileExists("file", key);
					existence.files[key] = {
						path: `${config.root?.speco || ".speco"}/${config.dirs?.[this.getDirKeyForFile(key)] || "config"}/${fileName}`,
						exists,
						type: "file",
					};
				} catch (error) {
					existence.files[key] = {
						path: `${config.root?.speco || ".speco"}/${config.dirs?.[this.getDirKeyForFile(key)] || "config"}/${fileName}`,
						exists: false,
						error: error.message,
						type: "file",
					};
				}
			}
		}

		return existence;
	}

	/**
	 * 计算路径变化
	 * @param {Object} updates - 更新对象
	 * @returns {Object} 变化详情
	 */
	calculatePathChanges(updates) {
		const changes = {};

		const compareSection = (sectionName, newValues, oldValues = {}) => {
			const sectionChanges = {};

			Object.keys(newValues).forEach((key) => {
				if (oldValues[key] !== newValues[key]) {
					sectionChanges[key] = {
						from: oldValues[key],
						to: newValues[key],
					};
				}
			});

			if (Object.keys(sectionChanges).length > 0) {
				changes[sectionName] = sectionChanges;
			}
		};

		if (updates.root) {
			compareSection("root", updates.root, this.pathService.pathConfig.root);
		}

		if (updates.dirs) {
			compareSection("dirs", updates.dirs, this.pathService.pathConfig.dirs);
		}

		if (updates.files) {
			compareSection("files", updates.files, this.pathService.pathConfig.files);
		}

		return changes;
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
}

export { PathConfigController };
