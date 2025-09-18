/**
 * 清理规则实体
 * 定义需要清理的AI相关内容和品牌信息的识别规则
 */

/**
 * 清理类型枚举
 */
const CleanupType = {
	AI_SERVICE: "ai_service", // AI服务调用
	AI_CONFIG: "ai_config", // AI配置项
	BRAND_INFO: "brand_info", // 品牌信息
	DOCUMENTATION: "documentation", // 文档内容
};

/**
 * 清理动作枚举
 */
const CleanupAction = {
	REMOVE: "remove", // 完全移除
	REPLACE: "replace", // 替换内容
	MARK: "mark", // 标记需要手动处理
};

/**
 * CleanupRule 类
 * 负责管理清理规则的实体类
 */
class CleanupRule {
	/**
	 * 构造函数
	 * @param {Object} config - 配置对象
	 */
	constructor(config = {}) {
		// 规则标识
		this.id = (config && config.id) || this.generateId();
		this.name = (config && config.name) || "未命名规则";
		this.type = (config && config.type) || CleanupType.AI_SERVICE;

		// 性能优化：编译正则表达式缓存
		this._compiledPatterns = null;
		this._lastContent = null;
		this._contentHash = null;

		// 配置缓存管理器
		this._cacheManager = null;

		// 匹配规则
		this.patterns =
			config && Array.isArray(config.patterns) ? [...config.patterns] : [];
		this.contentPatterns =
			config && Array.isArray(config.contentPatterns)
				? config.contentPatterns.map((p) => {
						if (p instanceof RegExp) return p;
						try {
							return new RegExp(p);
						} catch (error) {
							// 如果正则表达式无效，返回一个永不匹配的模式
							return /(?!)/;
						}
					})
				: [];

		// 处理规则
		this.action = (config && config.action) || CleanupAction.MARK;
		this.replacement = (config && config.replacement) || "";

		// 安全规则
		this.safePatterns =
			config && Array.isArray(config.safePatterns)
				? [...config.safePatterns]
				: [];
		this.requiresConfirmation =
			config && config.requiresConfirmation !== undefined
				? config.requiresConfirmation
				: true;

		// 验证规则
		this.validationPatterns =
			config && Array.isArray(config.validationPatterns)
				? config.validationPatterns.map((p) => {
						if (p instanceof RegExp) return p;
						try {
							return new RegExp(p);
						} catch (error) {
							// 如果正则表达式无效，返回一个永不匹配的模式
							return /(?!)/;
						}
					})
				: [];

		// 元数据
		this.metadata = {
			created:
				(config && config.metadata && config.metadata.created) ||
				new Date().toISOString(),
			updated:
				(config && config.metadata && config.metadata.updated) ||
				new Date().toISOString(),
			version:
				(config && config.metadata && config.metadata.version) || "1.0.0",
			enabled:
				config && config.metadata && config.metadata.enabled !== undefined
					? config.metadata.enabled
					: true,
			priority: (config && config.metadata && config.metadata.priority) || 0,
		};

		// 统计信息
		this.stats = {
			matches: 0,
			processed: 0,
			errors: 0,
			lastRun: null,
		};
	}

	/**
	 * 生成唯一规则ID
	 * @returns {string} 规则ID
	 */
	generateId() {
		return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 验证清理规则的有效性
	 * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
	 */
	validate() {
		const errors = [];

		// 验证必填字段
		if (
			!this.id ||
			typeof this.id !== "string" ||
			this.id.trim().length === 0
		) {
			errors.push("id 必须是非空字符串");
		}

		if (
			!this.name ||
			typeof this.name !== "string" ||
			this.name.trim().length === 0
		) {
			errors.push("name 必须是非空字符串");
		}

		// 验证类型
		if (!Object.values(CleanupType).includes(this.type)) {
			errors.push(
				`type 必须是有效的清理类型: ${Object.values(CleanupType).join(", ")}`,
			);
		}

		// 验证动作
		if (!Object.values(CleanupAction).includes(this.action)) {
			errors.push(
				`action 必须是有效的清理动作: ${Object.values(CleanupAction).join(", ")}`,
			);
		}

		// 验证模式
		if (!Array.isArray(this.patterns)) {
			errors.push("patterns 必须是数组");
		}

		if (!Array.isArray(this.contentPatterns)) {
			errors.push("contentPatterns 必须是数组");
		} else {
			this.contentPatterns.forEach((pattern, index) => {
				if (!(pattern instanceof RegExp)) {
					errors.push(`contentPatterns[${index}] 必须是正则表达式`);
				}
			});
		}

		// 验证安全模式
		if (!Array.isArray(this.safePatterns)) {
			errors.push("safePatterns 必须是数组");
		}

		// 验证验证模式
		if (!Array.isArray(this.validationPatterns)) {
			errors.push("validationPatterns 必须是数组");
		} else {
			this.validationPatterns.forEach((pattern, index) => {
				if (!(pattern instanceof RegExp)) {
					errors.push(`validationPatterns[${index}] 必须是正则表达式`);
				}
			});
		}

		// 验证替换内容
		if (
			this.action === CleanupAction.REPLACE &&
			(!this.replacement || typeof this.replacement !== "string")
		) {
			errors.push("当 action 为 replace 时，replacement 必须是非空字符串");
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 检查文件是否匹配规则
	 * @param {string} filePath - 文件路径
	 * @param {string} content - 文件内容
	 * @returns {Object} 匹配结果 {matches: boolean, details: Object}
	 */
	matches(filePath, content = "") {
		const details = {
			pathMatches: [],
			contentMatches: [],
			safeMatches: [],
			finalMatch: false,
		};

		// 检查文件路径匹配
		this.patterns.forEach((pattern) => {
			if (this.matchPattern(filePath, pattern)) {
				details.pathMatches.push(pattern);
			}
		});

		// 检查内容匹配
		if (content) {
			this.contentPatterns.forEach((pattern) => {
				const matches = content.match(pattern);
				if (matches) {
					details.contentMatches.push({
						pattern: pattern.toString(),
						matches: matches.length,
					});
				}
			});
		}

		// 检查安全模式（排除项）
		this.safePatterns.forEach((pattern) => {
			if (
				this.matchPattern(filePath, pattern) ||
				(content && this.matchPattern(content, pattern))
			) {
				details.safeMatches.push(pattern);
			}
		});

		// 确定最终匹配结果
		const hasPathMatch = details.pathMatches.length > 0;
		const hasContentMatch = details.contentMatches.length > 0;
		const hasSafeMatch = details.safeMatches.length > 0;

		// 如果有安全匹配，则不匹配
		if (hasSafeMatch) {
			details.finalMatch = false;
		} else {
			// 根据类型决定匹配逻辑
			switch (this.type) {
				case CleanupType.AI_SERVICE:
				case CleanupType.AI_CONFIG:
					details.finalMatch = hasPathMatch || hasContentMatch;
					break;
				case CleanupType.BRAND_INFO:
					details.finalMatch = hasContentMatch;
					break;
				case CleanupType.DOCUMENTATION:
					details.finalMatch = hasPathMatch && hasContentMatch;
					break;
				default:
					details.finalMatch = hasPathMatch || hasContentMatch;
			}
		}

		return {
			matches: details.finalMatch,
			details,
		};
	}

	/**
	 * 获取缓存管理器 (延迟初始化)
	 * @returns {ConfigCache} 缓存管理器实例
	 */
	async _getCacheManager() {
		if (!this._cacheManager) {
			const { ConfigCache } = await import("../utils/ConfigCache.js");
			this._cacheManager = new ConfigCache({
				maxSize: 200, // 规则缓存较小
				ttl: 600000, // 10分钟 (规则变化较频繁)
			});
		}
		return this._cacheManager;
	}

	/**
	 * 编译正则表达式模式以提高性能
	 * @returns {Object} 编译后的模式
	 */
	_compilePatterns() {
		if (!this._compiledPatterns) {
			this._compiledPatterns = {
				contentPatterns: this.contentPatterns.map((p) => ({
					original: p,
					regex: p instanceof RegExp ? p : new RegExp(p),
				})),
				safePatterns: this.safePatterns.map((p) => ({
					original: p,
					regex: p instanceof RegExp ? p : new RegExp(p),
				})),
				validationPatterns: this.validationPatterns.map((p) => ({
					original: p,
					regex: p instanceof RegExp ? p : new RegExp(p),
				})),
			};
		}
		return this._compiledPatterns;
	}

	/**
	 * 匹配单个模式
	 * @param {string} target - 匹配目标
	 * @param {string|RegExp} pattern - 匹配模式
	 * @returns {boolean} 是否匹配
	 */
	matchPattern(target, pattern) {
		if (typeof pattern === "string") {
			// 简单字符串匹配
			return target.includes(pattern);
		} else if (pattern instanceof RegExp) {
			// 正则表达式匹配
			return pattern.test(target);
		}
		return false;
	}

	/**
	 * 执行清理操作
	 * @param {string} content - 原始内容
	 * @returns {Object} 清理结果 {success: boolean, result: string, details: Object}
	 */
	execute(content) {
		const details = {
			originalLength: content.length,
			changes: [],
			errors: [],
		};

		try {
			let result = content;
			const compiledPatterns = this._compilePatterns();

			switch (this.action) {
				case CleanupAction.REMOVE:
					// 完全移除匹配的内容
					compiledPatterns.contentPatterns.forEach(({ original, regex }) => {
						const matches = result.match(regex);
						if (matches) {
							result = result.replace(regex, "");
							details.changes.push({
								action: "remove",
								pattern: original.toString(),
								matches: matches.length,
							});
						}
					});
					break;

				case CleanupAction.REPLACE:
					// 替换匹配的内容
					compiledPatterns.contentPatterns.forEach(({ original, regex }) => {
						const matches = result.match(regex);
						if (matches) {
							result = result.replace(regex, this.replacement);
							details.changes.push({
								action: "replace",
								pattern: original.toString(),
								replacement: this.replacement,
								matches: matches.length,
							});
						}
					});
					break;

				case CleanupAction.MARK:
					// 标记需要手动处理的内容
					compiledPatterns.contentPatterns.forEach(({ original, regex }) => {
						const matches = result.match(regex);
						if (matches) {
							const marker = `/* CLEANUP MARKER: ${this.name} */`;
							result = result.replace(regex, marker + matches[0]);
							details.changes.push({
								action: "mark",
								pattern: original.toString(),
								marker,
								matches: matches.length,
							});
						}
					});
					break;
			}

			// 验证清理结果
			const validationResult = this.validateResult(result);
			if (!validationResult.valid) {
				details.errors.push(...validationResult.errors);
			}

			// 更新统计信息
			this.stats.processed++;
			if (details.changes.length > 0) {
				this.stats.matches++;
			}
			this.stats.lastRun = new Date().toISOString();

			return {
				success: details.errors.length === 0,
				result,
				details: {
					...details,
					finalLength: result.length,
					reduction: details.originalLength - result.length,
				},
			};
		} catch (error) {
			details.errors.push(error.message);
			this.stats.errors++;

			return {
				success: false,
				result: content,
				details,
			};
		}
	}

	/**
	 * 验证清理结果
	 * @param {string} result - 清理后的结果
	 * @returns {Object} 验证结果
	 */
	validateResult(result) {
		const errors = [];
		const compiledPatterns = this._compilePatterns();

		compiledPatterns.validationPatterns.forEach(({ original, regex }) => {
			if (!regex.test(result)) {
				errors.push(`验证失败: ${original.toString()}`);
			}
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 转换为JSON格式
	 * @returns {Object} JSON对象
	 */
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			patterns: this.patterns,
			contentPatterns: this.contentPatterns.map((p) => p.toString()),
			action: this.action,
			replacement: this.replacement,
			safePatterns: this.safePatterns,
			requiresConfirmation: this.requiresConfirmation,
			validationPatterns: this.validationPatterns.map((p) => p.toString()),
			metadata: this.metadata,
			stats: this.stats,
		};
	}

	/**
	 * 从JSON创建实例
	 * @param {Object} json - JSON对象
	 * @returns {CleanupRule} CleanupRule实例
	 */
	static fromJSON(json) {
		// 转换正则表达式字符串回RegExp对象
		const config = {
			...json,
			contentPatterns: json.contentPatterns.map((p) => {
				if (p instanceof RegExp) return p;
				// 移除包围的斜杠和标志
				const match = p.match(/^\/(.*)\/([gimuy]*)$/);
				if (match) {
					return new RegExp(match[1], match[2]);
				}
				return new RegExp(p);
			}),
			validationPatterns: json.validationPatterns.map((p) => {
				if (p instanceof RegExp) return p;
				// 移除包围的斜杠和标志
				const match = p.match(/^\/(.*)\/([gimuy]*)$/);
				if (match) {
					return new RegExp(match[1], match[2]);
				}
				return new RegExp(p);
			}),
		};

		return new CleanupRule(config);
	}

	/**
	 * 获取默认清理规则
	 * @returns {CleanupRule[]} 默认规则数组
	 */
	static getDefaultRules() {
		return [
			// AI服务清理规则
			new CleanupRule({
				name: "AI服务调用清理",
				type: CleanupType.AI_SERVICE,
				patterns: ["**/ai/**", "**/services/ai/**"],
				contentPatterns: [
					/import.*from.*['"]@ai-provider/gi,
					/require\(['"]ai-service['"]\)/gi,
					/AI_SERVICE|aiService/gi,
				],
				action: CleanupAction.REMOVE,
				safePatterns: ["**/tests/**", "**/mocks/**"],
			}),

			// AI配置清理规则
			new CleanupRule({
				name: "AI配置清理",
				type: CleanupType.AI_CONFIG,
				patterns: ["**/config/**"],
				contentPatterns: [
					/OPENAI_API_KEY|ANTHROPIC_API_KEY|AI_API_KEY/gi,
					/ai\.config|aiConfig/gi,
				],
				action: CleanupAction.REPLACE,
				replacement: "# AI configuration removed",
			}),

			// 品牌信息清理规则
			new CleanupRule({
				name: "品牌信息清理",
				type: CleanupType.BRAND_INFO,
				contentPatterns: [
					/Task Master|task-master|TaskMaster/gi,
					/AI-powered|AI powered|ai-powered/gi,
				],
				action: CleanupAction.REPLACE,
				replacement: "Speco Tasker",
			}),
		];
	}

	/**
	 * 更新规则
	 * @param {Object} updates - 更新对象
	 */
	update(updates) {
		Object.keys(updates).forEach((key) => {
			if (key === "contentPatterns" || key === "validationPatterns") {
				// 特殊处理正则表达式数组
				if (Array.isArray(updates[key])) {
					this[key] = updates[key].map((p) =>
						p instanceof RegExp ? p : new RegExp(p),
					);
				}
			} else if (this.hasOwnProperty(key)) {
				this[key] = updates[key];
			}
		});

		this.metadata.updated = new Date().toISOString();
	}

	/**
	 * 克隆规则
	 * @returns {CleanupRule} 克隆实例
	 */
	clone() {
		const json = this.toJSON();
		// 直接从当前实例创建配置，避免JSON序列化问题
		const config = {
			id: this.id,
			name: this.name,
			type: this.type,
			patterns: [...this.patterns],
			contentPatterns: [...this.contentPatterns],
			action: this.action,
			replacement: this.replacement,
			safePatterns: [...this.safePatterns],
			requiresConfirmation: this.requiresConfirmation,
			validationPatterns: [...this.validationPatterns],
			metadata: { ...this.metadata },
			stats: { ...this.stats },
		};
		return new CleanupRule(config);
	}

	/**
	 * 获取规则摘要
	 * @returns {Object} 规则摘要
	 */
	getSummary() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			action: this.action,
			enabled: this.metadata.enabled,
			priority: this.metadata.priority,
			stats: {
				...this.stats,
				errors: this.stats.errors,
				matches: this.stats.matches,
				processed: this.stats.processed,
				lastRun: this.stats.lastRun,
			},
		};
	}

	/**
	 * 清除编译缓存
	 * 当规则发生变化时调用
	 */
	clearCompiledCache() {
		this._compiledPatterns = null;
		this._lastContent = null;
		this._contentHash = null;

		// 同时清除配置缓存
		if (this._cacheManager) {
			this._cacheManager.clear();
		}
	}

	/**
	 * 获取性能统计信息
	 * @returns {Object} 性能统计
	 */
	async getPerformanceStats() {
		const cacheManager = this._cacheManager
			? await this._getCacheManager()
			: null;
		const cacheStats = cacheManager ? cacheManager.getStats() : null;

		return {
			compiled: this._compiledPatterns !== null,
			contentPatternsCount: this.contentPatterns.length,
			safePatternsCount: this.safePatterns.length,
			validationPatternsCount: this.validationPatterns.length,
			cache: cacheStats,
			stats: { ...this.stats },
		};
	}

	/**
	 * 性能测试：测量清理操作性能
	 * @param {number} iterations - 测试迭代次数
	 * @returns {Object} 性能测试结果
	 */
	benchmarkCleanup(iterations = 100) {
		const testContents = [
			"const AI_SERVICE = require('ai-service'); console.log('test');",
			"import { OpenAI } from 'openai'; const client = new OpenAI();",
			"// This is a normal JavaScript file without AI content",
			"function processData(data) { return data.map(item => item.value); }",
			"const config = { database: 'postgres', cache: 'redis' };",
		];

		const startTime = Date.now();

		// 预热编译缓存
		this._compilePatterns();

		// 执行性能测试
		let totalMatches = 0;
		let totalProcessed = 0;

		for (let i = 0; i < iterations; i++) {
			const content = testContents[i % testContents.length];
			const result = this.execute(content);

			if (result.success) {
				totalProcessed++;
				if (result.details.changes.length > 0) {
					totalMatches++;
				}
			}
		}

		const endTime = Date.now();
		const totalTime = endTime - startTime;
		const avgTime = totalTime / iterations;

		return {
			totalTime,
			avgTime,
			iterations,
			totalMatches,
			totalProcessed,
			withinLimit: avgTime < 10, // 小于10ms（比路径解析要求更严格）
			efficiency: totalMatches / iterations, // 匹配效率
		};
	}
}

// 导出类和枚举
export { CleanupRule, CleanupType, CleanupAction };
