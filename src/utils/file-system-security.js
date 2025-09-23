/**
 * 文件系统安全验证模块
 * 提供全面的文件系统权限验证和安全检查机制
 */

import fs from "node:fs/promises";
import { platform } from "node:os";
import path from "node:path";
import { getLoggerOrDefault } from "./logger-utils.js";

/**
 * 安全验证结果类
 */
export class SecurityValidationResult {
	/**
	 * 构造函数
	 * @param {boolean} secure - 是否安全
	 * @param {Array} violations - 安全违规列表
	 * @param {Array} warnings - 安全警告列表
	 * @param {Object} metadata - 元数据
	 */
	constructor(secure = true, violations = [], warnings = [], metadata = {}) {
		this.secure = secure;
		this.violations = violations;
		this.warnings = warnings;
		this.metadata = metadata;
	}

	/**
	 * 添加安全违规
	 * @param {string} message - 违规信息
	 * @param {string} code - 违规代码
	 * @param {Object} details - 违规详情
	 */
	addViolation(message, code = null, details = {}) {
		this.violations.push({
			message,
			code,
			details,
			timestamp: new Date().toISOString(),
			severity: "CRITICAL",
		});
		this.secure = false;
	}

	/**
	 * 添加安全警告
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
			severity: "WARNING",
		});
	}

	/**
	 * 合并另一个安全验证结果
	 * @param {SecurityValidationResult} other - 另一个验证结果
	 */
	merge(other) {
		this.violations.push(...other.violations);
		this.warnings.push(...other.warnings);
		if (!other.secure) {
			this.secure = false;
		}
		Object.assign(this.metadata, other.metadata);
	}

	/**
	 * 获取违规数量
	 * @returns {number} 违规数量
	 */
	getViolationCount() {
		return this.violations.length;
	}

	/**
	 * 获取警告数量
	 * @returns {number} 警告数量
	 */
	getWarningCount() {
		return this.warnings.length;
	}
}

/**
 * 文件系统安全验证器类
 */
export class FileSystemSecurityValidator {
	/**
	 * 构造函数
	 * @param {Object} options - 配置选项
	 */
	constructor(options = {}) {
		this.options = {
			strictMode: options.strictMode || false,
			allowUnsafeOperations: options.allowUnsafeOperations || false,
			maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB
			maxPathLength: options.maxPathLength || 4096, // 最大路径长度
			allowedFileExtensions: options.allowedFileExtensions || [
				".js",
				".ts",
				".json",
				".md",
				".txt",
				".yaml",
				".yml",
			],
			forbiddenPaths: options.forbiddenPaths || [
				"/etc",
				"/usr",
				"/bin",
				"/sbin",
				"/boot",
				"/sys",
				"/proc",
				"/root",
				"/home",
				"/var",
				"C:\\Windows",
				"C:\\Program Files",
			],
			sensitiveDirectories: options.sensitiveDirectories || [
				"node_modules",
				".git",
				".svn",
				"tmp",
				"temp",
				".vscode",
				".idea",
			],
			...options,
		};
	}

	/**
	 * 执行完整的安全验证
	 * @param {string} filePath - 文件路径
	 * @param {string} operation - 操作类型 ('read', 'write', 'delete', 'execute')
	 * @param {Object} context - 验证上下文
	 * @returns {Promise<SecurityValidationResult>} 验证结果
	 */
	async validateFileOperation(filePath, operation, context = {}) {
		const result = new SecurityValidationResult();
		const logger = getLoggerOrDefault(context.logger);

		try {
			logger.debug?.(`开始验证文件操作: ${operation} ${filePath}`);

			// 1. 基础路径验证
			this._validatePathBasics(filePath, result);

			// 2. 路径遍历攻击检查
			this._validatePathTraversal(filePath, result);

			// 3. 敏感路径检查
			this._validateSensitivePaths(filePath, result);

			// 4. 文件系统权限检查
			if (context.checkPermissions !== false) {
				await this._validateFilePermissions(filePath, operation, result);
			}

			// 5. 文件属性验证
			if (context.checkAttributes !== false) {
				await this._validateFileAttributes(filePath, operation, result);
			}

			// 6. 目录权限验证
			if (context.checkDirectoryPermissions !== false) {
				await this._validateDirectoryPermissions(filePath, operation, result);
			}

			// 7. 操作特定验证
			await this._validateOperationSpecific(
				filePath,
				operation,
				result,
				context,
			);

			logger.debug?.(`文件操作验证完成: ${result.secure ? "安全" : "不安全"}`);
		} catch (error) {
			logger.error?.(`文件操作验证失败: ${error.message}`);
			result.addViolation(
				`验证过程中发生错误: ${error.message}`,
				"VALIDATION_ERROR",
				{ error: error.message, filePath, operation },
			);
		}

		return result;
	}

	/**
	 * 验证目录操作
	 * @param {string} dirPath - 目录路径
	 * @param {string} operation - 操作类型
	 * @param {Object} context - 验证上下文
	 * @returns {Promise<SecurityValidationResult>} 验证结果
	 */
	async validateDirectoryOperation(dirPath, operation, context = {}) {
		const result = new SecurityValidationResult();
		const logger = getLoggerOrDefault(context.logger);

		try {
			logger.debug?.(`开始验证目录操作: ${operation} ${dirPath}`);

			// 1. 基础路径验证
			this._validatePathBasics(dirPath, result);

			// 2. 路径遍历攻击检查
			this._validatePathTraversal(dirPath, result);

			// 3. 敏感路径检查
			this._validateSensitivePaths(dirPath, result);

			// 4. 目录权限检查
			if (context.checkPermissions !== false) {
				await this._validateDirectoryPermissions(dirPath, operation, result);
			}

			// 5. 目录结构验证
			await this._validateDirectoryStructure(
				dirPath,
				operation,
				result,
				context,
			);

			logger.debug?.(`目录操作验证完成: ${result.secure ? "安全" : "不安全"}`);
		} catch (error) {
			logger.error?.(`目录操作验证失败: ${error.message}`);
			result.addViolation(
				`目录验证过程中发生错误: ${error.message}`,
				"DIRECTORY_VALIDATION_ERROR",
				{ error: error.message, dirPath, operation },
			);
		}

		return result;
	}

	/**
	 * 批量验证文件操作
	 * @param {Array} fileOperations - 文件操作列表
	 * @param {Object} context - 验证上下文
	 * @returns {Promise<SecurityValidationResult>} 验证结果
	 */
	async validateBatchFileOperations(fileOperations, context = {}) {
		const result = new SecurityValidationResult();
		const logger = getLoggerOrDefault(context.logger);

		logger.debug?.(`开始批量验证 ${fileOperations.length} 个文件操作`);

		for (const operation of fileOperations) {
			const { filePath, operation: op, context: opContext } = operation;
			const opResult = await this.validateFileOperation(filePath, op, {
				...context,
				...opContext,
			});
			result.merge(opResult);
		}

		logger.debug?.(
			`批量验证完成: ${result.violations.length} 违规, ${result.warnings.length} 警告`,
		);

		return result;
	}

	// 私有验证方法

	/**
	 * 验证路径基础属性
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {SecurityValidationResult} result - 验证结果
	 */
	_validatePathBasics(filePath, result) {
		// 检查是否为空或未定义
		if (!filePath || typeof filePath !== "string") {
			result.addViolation("文件路径不能为空", "EMPTY_PATH");
			return;
		}

		// 检查路径长度
		if (filePath.length > this.options.maxPathLength) {
			result.addViolation(
				`文件路径过长: ${filePath.length} 字符 (最大 ${this.options.maxPathLength})`,
				"PATH_TOO_LONG",
				{ length: filePath.length, maxLength: this.options.maxPathLength },
			);
		}

		// 检查非法字符
		// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for validating file system characters
		const illegalChars = /[<>:"|?*\x00-\x1f]/;
		if (illegalChars.test(filePath)) {
			result.addViolation("文件路径包含非法字符", "INVALID_PATH_CHARACTERS", {
				path: filePath,
			});
		}

		// 检查文件扩展名
		const ext = path.extname(filePath).toLowerCase();
		if (ext && !this.options.allowedFileExtensions.includes(ext)) {
			result.addWarning(
				`文件扩展名 ${ext} 不在允许列表中`,
				"UNSAFE_EXTENSION",
				{ extension: ext, allowed: this.options.allowedFileExtensions },
			);
		}
	}

	/**
	 * 验证路径遍历攻击
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {SecurityValidationResult} result - 验证结果
	 */
	_validatePathTraversal(filePath, result) {
		// 检查路径遍历攻击
		if (filePath.includes("..") || path.isAbsolute(filePath)) {
			result.addViolation(
				"检测到潜在的路径遍历攻击",
				"PATH_TRAVERSAL_DETECTED",
				{ path: filePath },
			);
		}

		// 检查规范化后的路径是否改变
		const normalizedPath = path.normalize(filePath);
		if (normalizedPath !== filePath) {
			result.addWarning("路径包含冗余组件，已被规范化", "PATH_NORMALIZED", {
				original: filePath,
				normalized: normalizedPath,
			});
		}
	}

	/**
	 * 验证敏感路径
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {SecurityValidationResult} result - 验证结果
	 */
	_validateSensitivePaths(filePath, result) {
		const normalizedPath = path.normalize(filePath);

		// 检查禁止路径
		for (const forbidden of this.options.forbiddenPaths) {
			if (normalizedPath.startsWith(forbidden)) {
				result.addViolation(
					`路径指向禁止的系统目录: ${forbidden}`,
					"FORBIDDEN_PATH_DETECTED",
					{ path: filePath, forbiddenPath: forbidden },
				);
				break;
			}
		}

		// 检查敏感目录
		for (const sensitive of this.options.sensitiveDirectories) {
			if (
				normalizedPath.includes(`/${sensitive}/`) ||
				normalizedPath.startsWith(`${sensitive}/`) ||
				normalizedPath.endsWith(`/${sensitive}`)
			) {
				result.addWarning(
					`路径包含敏感目录: ${sensitive}`,
					"SENSITIVE_DIRECTORY_DETECTED",
					{ path: filePath, sensitiveDir: sensitive },
				);
			}
		}
	}

	/**
	 * 验证文件权限
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {string} operation - 操作类型
	 * @param {SecurityValidationResult} result - 验证结果
	 */
	async _validateFilePermissions(filePath, operation, result) {
		try {
			// 检查文件是否存在
			const exists = await this._fileExists(filePath);

			// 对于写操作和删除操作，文件必须存在
			if (!exists && (operation === "write" || operation === "delete")) {
				result.addWarning(
					`文件不存在，将创建新文件: ${filePath}`,
					"FILE_NOT_EXISTS",
					{ path: filePath, operation },
				);
			}

			// 检查读权限
			if (exists) {
				try {
					await fs.access(filePath, fs.constants.R_OK);
				} catch (error) {
					result.addViolation(
						`文件无读权限: ${filePath}`,
						"READ_PERMISSION_DENIED",
						{ path: filePath, operation, error: error.message },
					);
				}
			}

			// 检查写权限（对于写操作）
			if (operation === "write" || operation === "delete") {
				try {
					await fs.access(filePath, fs.constants.W_OK);
				} catch (error) {
					result.addViolation(
						`文件无写权限: ${filePath}`,
						"WRITE_PERMISSION_DENIED",
						{ path: filePath, operation, error: error.message },
					);
				}
			}

			// 检查执行权限（对于执行操作）
			if (operation === "execute") {
				try {
					await fs.access(filePath, fs.constants.X_OK);
				} catch (error) {
					result.addViolation(
						`文件无执行权限: ${filePath}`,
						"EXECUTE_PERMISSION_DENIED",
						{ path: filePath, operation, error: error.message },
					);
				}
			}
		} catch (error) {
			result.addViolation(
				`权限检查失败: ${error.message}`,
				"PERMISSION_CHECK_ERROR",
				{ path: filePath, operation, error: error.message },
			);
		}
	}

	/**
	 * 验证文件属性
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {string} operation - 操作类型
	 * @param {SecurityValidationResult} result - 验证结果
	 */
	async _validateFileAttributes(filePath, operation, result) {
		try {
			const stats = await fs.stat(filePath);

			// 检查文件大小
			if (stats.size > this.options.maxFileSize) {
				result.addViolation(
					`文件过大: ${stats.size} 字节 (最大 ${this.options.maxFileSize})`,
					"FILE_TOO_LARGE",
					{
						path: filePath,
						size: stats.size,
						maxSize: this.options.maxFileSize,
					},
				);
			}

			// 检查文件类型
			if (stats.isDirectory()) {
				result.addViolation(
					`路径指向目录而非文件: ${filePath}`,
					"PATH_IS_DIRECTORY",
					{ path: filePath, operation },
				);
			}

			// 检查是否为符号链接
			if (stats.isSymbolicLink()) {
				result.addWarning(`路径指向符号链接: ${filePath}`, "PATH_IS_SYMLINK", {
					path: filePath,
					operation,
				});
			}

			// 检查文件修改时间（可选）
			const now = Date.now();
			const modifiedTime = stats.mtime.getTime();
			const daysSinceModified = (now - modifiedTime) / (1000 * 60 * 60 * 24);

			if (daysSinceModified > 365) {
				result.addWarning(
					`文件长时间未修改: ${Math.round(daysSinceModified)} 天`,
					"FILE_OLD_MODIFIED",
					{ path: filePath, daysSinceModified: Math.round(daysSinceModified) },
				);
			}
		} catch (error) {
			// 文件不存在是正常的，不需要报错
			if (error.code !== "ENOENT") {
				result.addViolation(
					`文件属性检查失败: ${error.message}`,
					"ATTRIBUTE_CHECK_ERROR",
					{ path: filePath, operation, error: error.message },
				);
			}
		}
	}

	/**
	 * 验证目录权限
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {string} operation - 操作类型
	 * @param {SecurityValidationResult} result - 验证结果
	 */
	async _validateDirectoryPermissions(filePath, operation, result) {
		const dirPath = path.dirname(filePath);

		try {
			// 检查目录存在
			const dirExists = await this._fileExists(dirPath);
			if (!dirExists) {
				result.addWarning(
					`父目录不存在: ${dirPath}`,
					"PARENT_DIRECTORY_NOT_EXISTS",
					{ path: filePath, dirPath, operation },
				);
			} else {
				// 检查目录权限
				await fs.access(dirPath, fs.constants.W_OK);
			}
		} catch (error) {
			result.addViolation(
				`目录权限检查失败: ${error.message}`,
				"DIRECTORY_PERMISSION_DENIED",
				{ path: filePath, dirPath, operation, error: error.message },
			);
		}
	}

	/**
	 * 验证操作特定要求
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {string} operation - 操作类型
	 * @param {SecurityValidationResult} result - 验证结果
	 * @param {Object} context - 验证上下文
	 */
	async _validateOperationSpecific(filePath, operation, result, context) {
		switch (operation) {
			case "delete":
				await this._validateDeleteOperation(filePath, result, context);
				break;
			case "write":
				await this._validateWriteOperation(filePath, result, context);
				break;
			case "execute":
				await this._validateExecuteOperation(filePath, result, context);
				break;
		}
	}

	/**
	 * 验证删除操作
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {SecurityValidationResult} result - 验证结果
	 * @param {Object} context - 验证上下文
	 */
	async _validateDeleteOperation(filePath, result, context) {
		// 检查是否为重要文件
		const importantFiles = [".gitignore", "README.md", "package.json"];
		const fileName = path.basename(filePath);

		if (importantFiles.includes(fileName)) {
			result.addViolation(
				`不允许删除重要文件: ${fileName}`,
				"IMPORTANT_FILE_DELETION",
				{ path: filePath, fileName },
			);
		}

		// 检查文件是否正在使用（可选）
		if (context.checkFileInUse) {
			// 在实际实现中，这里可以检查文件是否被其他进程锁定
			// 这里只是示例
			result.addWarning(
				"无法检查文件是否正在使用",
				"FILE_IN_USE_CHECK_UNAVAILABLE",
				{ path: filePath },
			);
		}
	}

	/**
	 * 验证写操作
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {SecurityValidationResult} result - 验证结果
	 * @param {Object} context - 验证上下文
	 */
	async _validateWriteOperation(filePath, result, context) {
		// 检查磁盘空间（可选）
		if (context.checkDiskSpace) {
			try {
				// 在实际实现中，这里可以检查可用磁盘空间
				result.addWarning(
					"无法检查可用磁盘空间",
					"DISK_SPACE_CHECK_UNAVAILABLE",
					{ path: filePath },
				);
			} catch (error) {
				result.addWarning(
					`磁盘空间检查失败: ${error.message}`,
					"DISK_SPACE_CHECK_ERROR",
					{ path: filePath, error: error.message },
				);
			}
		}
	}

	/**
	 * 验证执行操作
	 * @private
	 * @param {string} filePath - 文件路径
	 * @param {SecurityValidationResult} result - 验证结果
	 * @param {Object} context - 验证上下文
	 */
	async _validateExecuteOperation(filePath, result, context) {
		// 检查文件扩展名是否适合执行
		const ext = path.extname(filePath).toLowerCase();
		const executableExtensions = [".js", ".exe", ".bat", ".sh", ".cmd"];

		if (ext && !executableExtensions.includes(ext)) {
			result.addWarning(
				`文件扩展名 ${ext} 不适合执行`,
				"UNSAFE_EXECUTABLE_EXTENSION",
				{ path: filePath, extension: ext, allowed: executableExtensions },
			);
		}

		// 检查文件是否为脚本文件
		if (platform() === "win32" && !ext) {
			result.addWarning(
				"Windows系统上的可执行文件应有扩展名",
				"EXECUTABLE_WITHOUT_EXTENSION",
				{ path: filePath, platform },
			);
		}
	}

	/**
	 * 验证目录结构
	 * @private
	 * @param {string} dirPath - 目录路径
	 * @param {string} operation - 操作类型
	 * @param {SecurityValidationResult} result - 验证结果
	 * @param {Object} context - 验证上下文
	 */
	async _validateDirectoryStructure(dirPath, operation, result, context) {
		try {
			const stats = await fs.stat(dirPath);

			if (!stats.isDirectory()) {
				result.addViolation(`路径不是目录: ${dirPath}`, "PATH_NOT_DIRECTORY", {
					path: dirPath,
					operation,
				});
				return;
			}

			// 检查目录是否为空（对于删除操作）
			if (operation === "delete" && context.checkEmptyDirectory) {
				const entries = await fs.readdir(dirPath);
				if (entries.length > 0) {
					result.addWarning(
						`目录不为空，包含 ${entries.length} 个项目`,
						"DIRECTORY_NOT_EMPTY",
						{ path: dirPath, entryCount: entries.length },
					);
				}
			}
		} catch (error) {
			if (error.code === "ENOENT") {
				result.addWarning(`目录不存在: ${dirPath}`, "DIRECTORY_NOT_EXISTS", {
					path: dirPath,
					operation,
				});
			} else {
				result.addViolation(
					`目录结构验证失败: ${error.message}`,
					"DIRECTORY_STRUCTURE_ERROR",
					{ path: dirPath, operation, error: error.message },
				);
			}
		}
	}

	/**
	 * 检查文件是否存在
	 * @private
	 * @param {string} filePath - 文件路径
	 * @returns {Promise<boolean>} 是否存在
	 */
	async _fileExists(filePath) {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}
}

// 创建默认实例
const defaultSecurityValidator = new FileSystemSecurityValidator();

/**
 * 便捷函数：验证单个文件操作
 * @param {string} filePath - 文件路径
 * @param {string} operation - 操作类型
 * @param {Object} context - 验证上下文
 * @returns {Promise<SecurityValidationResult>} 验证结果
 */
export async function validateFileSecurity(filePath, operation, context = {}) {
	return defaultSecurityValidator.validateFileOperation(
		filePath,
		operation,
		context,
	);
}

/**
 * 便捷函数：验证目录操作
 * @param {string} dirPath - 目录路径
 * @param {string} operation - 操作类型
 * @param {Object} context - 验证上下文
 * @returns {Promise<SecurityValidationResult>} 验证结果
 */
export async function validateDirectorySecurity(
	dirPath,
	operation,
	context = {},
) {
	return defaultSecurityValidator.validateDirectoryOperation(
		dirPath,
		operation,
		context,
	);
}

/**
 * 便捷函数：批量验证文件操作
 * @param {Array} fileOperations - 文件操作列表
 * @param {Object} context - 验证上下文
 * @returns {Promise<SecurityValidationResult>} 验证结果
 */
export async function validateBatchFileSecurity(fileOperations, context = {}) {
	return defaultSecurityValidator.validateBatchFileOperations(
		fileOperations,
		context,
	);
}

// FileSystemSecurityValidator and SecurityValidationResult are already exported via class declarations
