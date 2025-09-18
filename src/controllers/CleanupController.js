/**
 * 清理控制器
 * 处理清理相关的API端点
 */


/**
 * CleanupController 类
 * 负责处理清理相关的HTTP请求
 */
class CleanupController {
	/**
	 * 构造函数
	 * @param {CleanupService} cleanupService - 清理服务实例
	 */
	constructor(cleanupService) {
		this.cleanupService = cleanupService;
	}

	/**
	 * GET /ai-content - 获取AI内容清理信息
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async getAiContent(req, res) {
		try {
			const options = {
				preview: req.query.preview === "true",
				type: "ai_service",
				extensions: req.query.extensions
					? req.query.extensions.split(",")
					: [".js", ".ts", ".json", ".md"],
			};

			// 扫描AI相关内容
			const scanResults = await this.cleanupService.scanFiles(options);

			// 过滤出匹配AI清理规则的文件
			const aiContent = [];
			for (const file of scanResults) {
				const matchingRules = this.cleanupService.rules.filter((rule) => {
					return (
						rule.type === "ai_service" &&
						rule.matches(file.path, file.content).matches
					);
				});

				if (matchingRules.length > 0) {
					aiContent.push({
						path: file.path,
						size: file.size,
						extension: file.extension,
						matchingRules: matchingRules.map((rule) => ({
							id: rule.id,
							name: rule.name,
							action: rule.action,
						})),
					});
				}
			}

			res.json({
				success: true,
				data: {
					totalFiles: aiContent.length,
					files: aiContent,
					scannedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("获取AI内容时出错:", error);
			res.status(500).json({
				success: false,
				error: "获取AI内容失败",
				message: error.message,
			});
		}
	}

	/**
	 * DELETE /ai-content - 执行AI内容清理
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async deleteAiContent(req, res) {
		try {
			const options = {
				type: "ai_service",
				extensions: req.query.extensions
					? req.query.extensions.split(",")
					: [".js", ".ts", ".json", ".md"],
				preview: req.query.preview === "true",
			};

			// 执行清理操作
			const cleanupResults = await this.cleanupService.cleanup(options);

			// 过滤出AI相关的结果
			const aiResults = {
				...cleanupResults,
				changes: cleanupResults.changes.filter((change) => {
					const rule = this.cleanupService.rules.find(
						(r) => r.name === change.rule,
					);
					return rule && rule.type === "ai_service";
				}),
			};

			res.json({
				success: true,
				data: {
					...aiResults,
					message: options.preview ? "AI内容清理预览完成" : "AI内容清理完成",
				},
			});
		} catch (error) {
			console.error("删除AI内容时出错:", error);
			res.status(500).json({
				success: false,
				error: "删除AI内容失败",
				message: error.message,
			});
		}
	}

	/**
	 * GET /brand-info - 获取品牌信息清理信息
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async getBrandInfo(req, res) {
		try {
			const options = {
				preview: req.query.preview === "true",
				type: "brand_info",
				extensions: req.query.extensions
					? req.query.extensions.split(",")
					: [".js", ".ts", ".json", ".md", ".txt"],
			};

			// 扫描品牌相关内容
			const scanResults = await this.cleanupService.scanFiles(options);

			// 过滤出匹配品牌清理规则的文件
			const brandContent = [];
			for (const file of scanResults) {
				const matchingRules = this.cleanupService.rules.filter((rule) => {
					return (
						rule.type === "brand_info" &&
						rule.matches(file.path, file.content).matches
					);
				});

				if (matchingRules.length > 0) {
					// 提取匹配的品牌引用
					const matches = [];
					matchingRules.forEach((rule) => {
						rule.contentPatterns.forEach((pattern) => {
							const found = file.content.match(pattern);
							if (found) {
								matches.push(...found);
							}
						});
					});

					brandContent.push({
						path: file.path,
						size: file.size,
						extension: file.extension,
						matchingRules: matchingRules.map((rule) => ({
							id: rule.id,
							name: rule.name,
							action: rule.action,
						})),
						brandReferences: [...new Set(matches)], // 去重
					});
				}
			}

			res.json({
				success: true,
				data: {
					totalFiles: brandContent.length,
					files: brandContent,
					scannedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("获取品牌信息时出错:", error);
			res.status(500).json({
				success: false,
				error: "获取品牌信息失败",
				message: error.message,
			});
		}
	}

	/**
	 * PATCH /brand-info - 更新品牌信息
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async updateBrandInfo(req, res) {
		try {
			const { newBrand, options = {} } = req.body;

			if (!newBrand || typeof newBrand !== "object") {
				return res.status(400).json({
					success: false,
					error: "无效的品牌信息",
					message: "请求体必须包含有效的 newBrand 对象",
				});
			}

			// 这里需要访问 BrandService，但控制器通常不直接访问其他服务
			// 应该通过依赖注入或服务定位器来获取 BrandService
			// 暂时返回模拟响应，实际实现需要依赖注入

			res.json({
				success: true,
				data: {
					message: "品牌信息更新功能待实现",
					newBrand,
					options,
					note: "此端点需要与 BrandService 集成",
				},
			});
		} catch (error) {
			console.error("更新品牌信息时出错:", error);
			res.status(500).json({
				success: false,
				error: "更新品牌信息失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /validate - 验证清理规则
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async validateCleanup(req, res) {
		try {
			const options = req.body || {};

			// 执行验证操作
			const validationResults =
				await this.cleanupService.validateCleanup(options);

			res.json({
				success: true,
				data: {
					...validationResults,
					validatedAt: new Date().toISOString(),
					message: validationResults.success
						? "清理验证通过"
						: "清理验证发现问题",
				},
			});
		} catch (error) {
			console.error("验证清理时出错:", error);
			res.status(500).json({
				success: false,
				error: "验证清理失败",
				message: error.message,
			});
		}
	}

	/**
	 * GET /cleanup/rules - 获取清理规则列表
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async getCleanupRules(req, res) {
		try {
			const filter = {};

			if (req.query.type) {
				filter.type = req.query.type;
			}

			if (req.query.enabled !== undefined) {
				filter.enabled = req.query.enabled === "true";
			}

			const rules = this.cleanupService.getRules(filter);

			res.json({
				success: true,
				data: {
					rules,
					totalCount: rules.length,
					filter,
				},
			});
		} catch (error) {
			console.error("获取清理规则时出错:", error);
			res.status(500).json({
				success: false,
				error: "获取清理规则失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /cleanup/rules - 添加清理规则
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async addCleanupRule(req, res) {
		try {
			const ruleConfig = req.body;

			if (!ruleConfig || typeof ruleConfig !== "object") {
				return res.status(400).json({
					success: false,
					error: "无效的规则配置",
					message: "请求体必须包含有效的规则配置对象",
				});
			}

			const result = await this.cleanupService.addRule(ruleConfig);

			if (result.success) {
				res.status(201).json({
					success: true,
					data: result,
				});
			} else {
				res.status(400).json({
					success: false,
					error: "添加规则失败",
					message: result.error,
				});
			}
		} catch (error) {
			console.error("添加清理规则时出错:", error);
			res.status(500).json({
				success: false,
				error: "添加清理规则失败",
				message: error.message,
			});
		}
	}

	/**
	 * PUT /cleanup/rules/:ruleId - 更新清理规则
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async updateCleanupRule(req, res) {
		try {
			const { ruleId } = req.params;
			const updates = req.body;

			if (!ruleId || !updates || typeof updates !== "object") {
				return res.status(400).json({
					success: false,
					error: "无效的请求参数",
					message: "必须提供规则ID和更新数据",
				});
			}

			const result = await this.cleanupService.updateRule(ruleId, updates);

			if (result.success) {
				res.json({
					success: true,
					data: result,
				});
			} else {
				res.status(400).json({
					success: false,
					error: "更新规则失败",
					message: result.error,
				});
			}
		} catch (error) {
			console.error("更新清理规则时出错:", error);
			res.status(500).json({
				success: false,
				error: "更新清理规则失败",
				message: error.message,
			});
		}
	}

	/**
	 * DELETE /cleanup/rules/:ruleId - 删除清理规则
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async deleteCleanupRule(req, res) {
		try {
			const { ruleId } = req.params;

			if (!ruleId) {
				return res.status(400).json({
					success: false,
					error: "无效的规则ID",
					message: "必须提供要删除的规则ID",
				});
			}

			const result = await this.cleanupService.removeRule(ruleId);

			if (result.success) {
				res.json({
					success: true,
					data: result,
				});
			} else {
				res.status(400).json({
					success: false,
					error: "删除规则失败",
					message: result.error,
				});
			}
		} catch (error) {
			console.error("删除清理规则时出错:", error);
			res.status(500).json({
				success: false,
				error: "删除清理规则失败",
				message: error.message,
			});
		}
	}

	/**
	 * GET /cleanup/stats - 获取清理统计信息
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async getCleanupStats(req, res) {
		try {
			const stats = this.cleanupService.getStatistics();

			res.json({
				success: true,
				data: {
					...stats,
					generatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("获取清理统计时出错:", error);
			res.status(500).json({
				success: false,
				error: "获取清理统计失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /cleanup/reset-stats - 重置清理统计
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async resetCleanupStats(req, res) {
		try {
			const success = await this.cleanupService.resetStatistics();

			res.json({
				success,
				data: {
					message: "清理统计已重置",
					resetAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("重置清理统计时出错:", error);
			res.status(500).json({
				success: false,
				error: "重置清理统计失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /cleanup/export - 导出清理配置
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async exportCleanupConfig(req, res) {
		try {
			const { exportPath } = req.body;

			if (!exportPath || typeof exportPath !== "string") {
				return res.status(400).json({
					success: false,
					error: "无效的导出路径",
					message: "必须提供有效的导出路径",
				});
			}

			const success = await this.cleanupService.exportConfiguration(exportPath);

			if (success) {
				res.json({
					success: true,
					data: {
						message: "清理配置导出成功",
						exportPath,
						exportedAt: new Date().toISOString(),
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: "导出失败",
					message: "清理配置导出过程中发生错误",
				});
			}
		} catch (error) {
			console.error("导出清理配置时出错:", error);
			res.status(500).json({
				success: false,
				error: "导出清理配置失败",
				message: error.message,
			});
		}
	}

	/**
	 * POST /cleanup/import - 导入清理配置
	 * @param {Object} req - 请求对象
	 * @param {Object} res - 响应对象
	 */
	async importCleanupConfig(req, res) {
		try {
			const { importPath } = req.body;

			if (!importPath || typeof importPath !== "string") {
				return res.status(400).json({
					success: false,
					error: "无效的导入路径",
					message: "必须提供有效的导入路径",
				});
			}

			const result = await this.cleanupService.importConfiguration(importPath);

			res.json({
				success: result.success,
				data: {
					...result,
					importedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("导入清理配置时出错:", error);
			res.status(500).json({
				success: false,
				error: "导入清理配置失败",
				message: error.message,
			});
		}
	}
}

export { CleanupController };
