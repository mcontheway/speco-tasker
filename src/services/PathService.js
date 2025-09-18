/**
 * 路径配置服务
 * 提供路径配置的管理、解析和文件操作功能
 */

import fs from "fs/promises";
import path from "path";
import { PathConfig } from "../models/PathConfig.js";

/**
 * PathService 类
 * 负责路径配置的服务层
 */
class PathService {
	/**
	 * 构造函数
	 * @param {PathConfig} pathConfig - 路径配置实例
	 * @param {string} projectRoot - 项目根目录
	 */
	constructor(pathConfig = null, projectRoot = process.cwd()) {
		this.pathConfig = pathConfig || PathConfig.getDefaultConfig();
		this.projectRoot = projectRoot;
		this.cache = new Map(); // 路径缓存
	}

	/**
	 * 初始化路径服务
	 * @param {Object} config - 配置对象
	 */
	async initialize(config = {}) {
		try {
			// 加载或创建路径配置文件
			const configPath = this.getAbsolutePath("file", "config");
			let loadedConfig = null;

			try {
				const configContent = await fs.readFile(configPath, "utf8");
				loadedConfig = JSON.parse(configContent);
			} catch (error) {
				// 配置文件不存在，使用默认配置
				console.log("路径配置文件不存在，使用默认配置");
			}

			// 合并配置
			const mergedConfig = { ...loadedConfig, ...config };
			this.pathConfig = new PathConfig(mergedConfig);

			// 验证配置
			const validation = this.pathConfig.validate();
			if (!validation.valid) {
				throw new Error(`路径配置验证失败: ${validation.errors.join(", ")}`);
			}

			// 创建必要的目录
			await this.ensureDirectories();

			return {
				success: true,
				config: this.pathConfig.getPathSnapshot(),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 确保所有必要的目录存在
	 */
	async ensureDirectories() {
		const dirs = [
			this.getAbsolutePath("root", "speco"),
			...Object.values(this.pathConfig.dirs).map((dir) =>
				this.getAbsolutePath(
					"dir",
					Object.keys(this.pathConfig.dirs).find(
						(key) => this.pathConfig.dirs[key] === dir,
					),
				),
			),
		];

		for (const dir of dirs) {
			try {
				await fs.mkdir(dir, { recursive: true });
			} catch (error) {
				if (error.code !== "EEXIST") {
					throw error;
				}
			}
		}
	}

	/**
	 * 获取绝对路径
	 * @param {string} type - 路径类型 ('root', 'dir', 'file')
	 * @param {string} key - 路径键
	 * @param {string} tag - 可选的标签
	 * @returns {string} 绝对路径
	 */
	getAbsolutePath(type, key, tag = null) {
		const relativePath = this.pathConfig.getPath(type, key, tag);
		return path.resolve(this.projectRoot, relativePath);
	}

	/**
	 * 获取相对路径
	 * @param {string} type - 路径类型
	 * @param {string} key - 路径键
	 * @param {string} tag - 可选的标签
	 * @returns {string} 相对路径
	 */
	getRelativePath(type, key, tag = null) {
		return this.pathConfig.getPath(type, key, tag);
	}

	/**
	 * 解析路径（支持变量替换）
	 * @param {string} template - 路径模板
	 * @param {Object} variables - 变量对象
	 * @returns {string} 解析后的路径
	 */
	resolvePath(template, variables = {}) {
		let resolved = template;

		// 替换内置变量
		resolved = resolved.replace("{root}", this.projectRoot);
		resolved = resolved.replace(
			"{speco}",
			this.getAbsolutePath("root", "speco"),
		);
		resolved = resolved.replace(
			"{legacy}",
			this.getAbsolutePath("root", "legacy"),
		);

		// 替换目录变量
		Object.entries(this.pathConfig.dirs).forEach(([key, value]) => {
			resolved = resolved.replace(`{${key}}`, this.getAbsolutePath("dir", key));
		});

		// 替换文件变量
		Object.entries(this.pathConfig.files).forEach(([key, value]) => {
			resolved = resolved.replace(
				`{${key}}`,
				this.getAbsolutePath("file", key),
			);
		});

		// 替换自定义变量
		Object.entries(variables).forEach(([key, value]) => {
			resolved = resolved.replace(`{${key}}`, value);
		});

		return resolved;
	}

	/**
	 * 读取配置文件
	 * @param {string} fileKey - 文件键
	 * @param {string} tag - 可选的标签
	 * @returns {Promise<Object>} 文件内容
	 */
	async readConfigFile(fileKey, tag = null) {
		try {
			const filePath = this.getAbsolutePath("file", fileKey, tag);
			const content = await fs.readFile(filePath, "utf8");
			return JSON.parse(content);
		} catch (error) {
			throw new Error(`读取配置文件失败 (${fileKey}): ${error.message}`);
		}
	}

	/**
	 * 写入配置文件
	 * @param {string} fileKey - 文件键
	 * @param {Object} data - 数据对象
	 * @param {string} tag - 可选的标签
	 * @returns {Promise<boolean>} 成功状态
	 */
	async writeConfigFile(fileKey, data, tag = null) {
		try {
			const filePath = this.getAbsolutePath("file", fileKey, tag);
			const content = JSON.stringify(data, null, 2);

			// 确保目录存在
			const dirPath = path.dirname(filePath);
			await fs.mkdir(dirPath, { recursive: true });

			await fs.writeFile(filePath, content, "utf8");
			return true;
		} catch (error) {
			throw new Error(`写入配置文件失败 (${fileKey}): ${error.message}`);
		}
	}

	/**
	 * 检查文件是否存在
	 * @param {string} type - 路径类型
	 * @param {string} key - 路径键
	 * @param {string} tag - 可选的标签
	 * @returns {Promise<boolean>} 是否存在
	 */
	async fileExists(type, key, tag = null) {
		try {
			const filePath = this.getAbsolutePath(type, key, tag);
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * 获取目录内容
	 * @param {string} dirKey - 目录键
	 * @param {string} tag - 可选的标签
	 * @returns {Promise<string[]>} 文件列表
	 */
	async listDirectory(dirKey, tag = null) {
		try {
			const dirPath = this.getAbsolutePath("dir", dirKey, tag);
			const files = await fs.readdir(dirPath);
			return files;
		} catch (error) {
			throw new Error(`读取目录失败 (${dirKey}): ${error.message}`);
		}
	}

	/**
	 * 创建目录
	 * @param {string} dirKey - 目录键
	 * @param {string} tag - 可选的标签
	 * @returns {Promise<boolean>} 成功状态
	 */
	async createDirectory(dirKey, tag = null) {
		try {
			const dirPath = this.getAbsolutePath("dir", dirKey, tag);
			await fs.mkdir(dirPath, { recursive: true });
			return true;
		} catch (error) {
			throw new Error(`创建目录失败 (${dirKey}): ${error.message}`);
		}
	}

	/**
	 * 删除文件或目录
	 * @param {string} type - 路径类型
	 * @param {string} key - 路径键
	 * @param {string} tag - 可选的标签
	 * @param {Object} options - 删除选项
	 * @returns {Promise<boolean>} 成功状态
	 */
	async remove(type, key, tag = null, options = {}) {
		try {
			const targetPath = this.getAbsolutePath(type, key, tag);
			const stat = await fs.stat(targetPath);

			if (stat.isDirectory()) {
				if (options.recursive) {
					await fs.rm(targetPath, { recursive: true });
				} else {
					await fs.rmdir(targetPath);
				}
			} else {
				await fs.unlink(targetPath);
			}

			return true;
		} catch (error) {
			throw new Error(`删除失败 (${type}:${key}): ${error.message}`);
		}
	}

	/**
	 * 复制文件或目录
	 * @param {string} srcType - 源路径类型
	 * @param {string} srcKey - 源路径键
	 * @param {string} destType - 目标路径类型
	 * @param {string} destKey - 目标路径键
	 * @param {string} srcTag - 源标签
	 * @param {string} destTag - 目标标签
	 * @returns {Promise<boolean>} 成功状态
	 */
	async copy(
		srcType,
		srcKey,
		destType,
		destKey,
		srcTag = null,
		destTag = null,
	) {
		try {
			const srcPath = this.getAbsolutePath(srcType, srcKey, srcTag);
			const destPath = this.getAbsolutePath(destType, destKey, destTag);

			// 确保目标目录存在
			const destDir = path.dirname(destPath);
			await fs.mkdir(destDir, { recursive: true });

			await fs.copyFile(srcPath, destPath);
			return true;
		} catch (error) {
			throw new Error(`复制失败: ${error.message}`);
		}
	}

	/**
	 * 获取路径信息
	 * @param {string} type - 路径类型
	 * @param {string} key - 路径键
	 * @param {string} tag - 可选的标签
	 * @returns {Promise<Object>} 路径信息
	 */
	async getPathInfo(type, key, tag = null) {
		try {
			const filePath = this.getAbsolutePath(type, key, tag);
			const stats = await fs.stat(filePath);

			return {
				path: filePath,
				relativePath: this.getRelativePath(type, key, tag),
				exists: true,
				size: stats.size,
				modified: stats.mtime.toISOString(),
				isDirectory: stats.isDirectory(),
				isFile: stats.isFile(),
			};
		} catch (error) {
			return {
				path: this.getAbsolutePath(type, key, tag),
				relativePath: this.getRelativePath(type, key, tag),
				exists: false,
				error: error.message,
			};
		}
	}

	/**
	 * 验证路径配置
	 * @returns {Object} 验证结果
	 */
	validateConfiguration() {
		return this.pathConfig.validate();
	}

	/**
	 * 获取路径快照
	 * @returns {Object} 路径快照
	 */
	getPathSnapshot() {
		return this.pathConfig.getPathSnapshot();
	}

	/**
	 * 更新路径配置
	 * @param {Object} updates - 更新对象
	 * @returns {Promise<boolean>} 成功状态
	 */
	async updateConfiguration(updates) {
		try {
			this.pathConfig.update(updates);

			// 验证更新后的配置
			const validation = this.pathConfig.validate();
			if (!validation.valid) {
				throw new Error(`配置更新验证失败: ${validation.errors.join(", ")}`);
			}

			// 保存配置
			await this.writeConfigFile("config", this.pathConfig.toJSON());

			// 清空缓存
			this.cache.clear();

			return true;
		} catch (error) {
			throw new Error(`更新配置失败: ${error.message}`);
		}
	}

	/**
	 * 重置为默认配置
	 * @returns {Promise<boolean>} 成功状态
	 */
	async resetToDefault() {
		try {
			this.pathConfig = PathConfig.getDefaultConfig();
			await this.writeConfigFile("config", this.pathConfig.toJSON());
			this.cache.clear();
			return true;
		} catch (error) {
			throw new Error(`重置配置失败: ${error.message}`);
		}
	}

	/**
	 * 获取服务状态
	 * @returns {Object} 服务状态
	 */
	getStatus() {
		return {
			initialized: !!this.pathConfig,
			projectRoot: this.projectRoot,
			cacheSize: this.cache.size,
			configValidation: this.pathConfig ? this.pathConfig.validate() : null,
			pathSnapshot: this.pathConfig ? this.pathConfig.getPathSnapshot() : null,
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
		this.pathConfig = null;
		this.projectRoot = null;
	}
}

export { PathService };
