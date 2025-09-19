/**
 * 监控系统
 * 提供系统监控、审计报告和性能跟踪功能
 */

import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import { LOG_LEVELS, LOG_TYPES, Logger, getLogger } from "./Logger.js";

export const MONITORING_EVENTS = {
	SYSTEM_HEALTH_CHANGED: "system_health_changed",
	PERFORMANCE_THRESHOLD_EXCEEDED: "performance_threshold_exceeded",
	SECURITY_ALERT: "security_alert",
	AUDIT_VIOLATION: "audit_violation",
	CONFIGURATION_CHANGED: "configuration_changed",
};

/**
 * 监控指标类
 */
export class MonitoringMetrics {
	constructor() {
		this.startTime = Date.now();
		this.counters = new Map();
		this.gauges = new Map();
		this.histograms = new Map();
		this.timers = new Map();
	}

	/**
	 * 增加计数器
	 * @param {string} name - 指标名称
	 * @param {number} value - 增加的值
	 * @param {Object} tags - 标签
	 */
	increment(name, value = 1, tags = {}) {
		const key = this._getKey(name, tags);
		const current = this.counters.get(key) || 0;
		this.counters.set(key, current + value);
	}

	/**
	 * 设置测量值
	 * @param {string} name - 指标名称
	 * @param {number} value - 测量值
	 * @param {Object} tags - 标签
	 */
	gauge(name, value, tags = {}) {
		const key = this._getKey(name, tags);
		this.gauges.set(key, { value, timestamp: Date.now() });
	}

	/**
	 * 记录直方图值
	 * @param {string} name - 指标名称
	 * @param {number} value - 值
	 * @param {Object} tags - 标签
	 */
	histogram(name, value, tags = {}) {
		const key = this._getKey(name, tags);
		if (!this.histograms.has(key)) {
			this.histograms.set(key, []);
		}
		const values = this.histograms.get(key);
		values.push({ value, timestamp: Date.now() });

		// 保持最近1000个值
		if (values.length > 1000) {
			values.shift();
		}
	}

	/**
	 * 开始计时器
	 * @param {string} name - 计时器名称
	 * @param {Object} tags - 标签
	 * @returns {string} 计时器ID
	 */
	startTimer(name, tags = {}) {
		const id = `${name}_${Date.now()}_${Math.random()}`;
		this.timers.set(id, {
			name,
			tags,
			startTime: Date.now(),
		});
		return id;
	}

	/**
	 * 停止计时器
	 * @param {string} timerId - 计时器ID
	 * @returns {number} 持续时间（毫秒）
	 */
	stopTimer(timerId) {
		const timer = this.timers.get(timerId);
		if (!timer) {
			return 0;
		}

		const duration = Date.now() - timer.startTime;
		this.histogram(`${timer.name}_duration`, duration, timer.tags);
		this.timers.delete(timerId);

		return duration;
	}

	/**
	 * 获取指标快照
	 * @returns {Object} 指标快照
	 */
	getSnapshot() {
		const uptime = Date.now() - this.startTime;

		return {
			timestamp: new Date().toISOString(),
			uptime,
			counters: Object.fromEntries(this.counters),
			gauges: Object.fromEntries(this.gauges),
			histograms: Object.fromEntries(
				Array.from(this.histograms.entries()).map(([key, values]) => [
					key,
					this._calculateHistogramStats(values),
				]),
			),
			activeTimers: this.timers.size,
		};
	}

	/**
	 * 重置指标
	 */
	reset() {
		this.counters.clear();
		this.gauges.clear();
		this.histograms.clear();
		this.timers.clear();
		this.startTime = Date.now();
	}

	/**
	 * 生成指标键
	 * @private
	 * @param {string} name - 名称
	 * @param {Object} tags - 标签
	 * @returns {string} 键
	 */
	_getKey(name, tags) {
		const tagStr = Object.entries(tags)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}=${v}`)
			.join(",");
		return tagStr ? `${name}{${tagStr}}` : name;
	}

	/**
	 * 计算直方图统计
	 * @private
	 * @param {Array} values - 值数组
	 * @returns {Object} 统计信息
	 */
	_calculateHistogramStats(values) {
		if (values.length === 0) return {};

		const nums = values.map((v) => v.value).sort((a, b) => a - b);
		const count = nums.length;
		const sum = nums.reduce((a, b) => a + b, 0);
		const mean = sum / count;
		const median = nums[Math.floor(count / 2)];
		const min = nums[0];
		const max = nums[nums.length - 1];

		// 计算百分位数
		const p95 = nums[Math.floor(count * 0.95)];
		const p99 = nums[Math.floor(count * 0.99)];

		return {
			count,
			sum,
			mean,
			median,
			min,
			max,
			p95,
			p99,
		};
	}
}

/**
 * 审计跟踪器类
 */
export class AuditTracker {
	constructor(logger) {
		this.logger = logger;
		this.auditBuffer = [];
		this.maxBufferSize = 1000;
		this.flushInterval = 30000; // 30秒
		this._startFlushTimer();
	}

	/**
	 * 记录审计事件
	 * @param {string} action - 操作
	 * @param {Object} details - 详细信息
	 * @param {Object} context - 上下文
	 */
	audit(action, details = {}, context = {}) {
		const auditEntry = {
			timestamp: new Date().toISOString(),
			action,
			details: this._sanitizeAuditDetails(details),
			context: {
				userId: context.userId || "system",
				sessionId: context.sessionId,
				ip: context.ip,
				userAgent: context.userAgent,
				source: context.source || "internal",
			},
			result: context.result || "success",
			duration: context.duration,
		};

		// 添加到缓冲区
		this.auditBuffer.push(auditEntry);

		// 检查是否需要刷新
		if (this.auditBuffer.length >= this.maxBufferSize) {
			this.flush();
		}

		// 记录到日志系统
		this.logger.audit(action, auditEntry.details, auditEntry.context);
	}

	/**
	 * 刷新审计缓冲区到持久存储
	 */
	async flush() {
		if (this.auditBuffer.length === 0) return;

		try {
			const auditData = {
				flushTime: new Date().toISOString(),
				entries: this.auditBuffer.splice(0), // 清空缓冲区
			};

			// 这里可以实现持久化存储逻辑
			// 例如写入文件、发送到远程服务等
			await this._persistAuditData(auditData);

			this.logger.info("Audit buffer flushed", {
				entriesCount: auditData.entries.length,
			});
		} catch (error) {
			this.logger.error("Failed to flush audit buffer", {
				error: error.message,
			});
		}
	}

	/**
	 * 查询审计日志
	 * @param {Object} filters - 查询过滤器
	 * @returns {Promise<Array>} 审计条目
	 */
	async queryAudit(filters = {}) {
		// 这里可以实现从持久存储查询审计日志的逻辑
		// 目前返回内存中的缓冲区内容作为示例
		let results = [...this.auditBuffer];

		// 应用过滤器
		if (filters.action) {
			results = results.filter((entry) => entry.action === filters.action);
		}

		if (filters.userId) {
			results = results.filter(
				(entry) => entry.context.userId === filters.userId,
			);
		}

		if (filters.startTime) {
			results = results.filter((entry) => entry.timestamp >= filters.startTime);
		}

		if (filters.endTime) {
			results = results.filter((entry) => entry.timestamp <= filters.endTime);
		}

		if (filters.limit) {
			results = results.slice(0, filters.limit);
		}

		return results;
	}

	/**
	 * 生成审计报告
	 * @param {Object} options - 报告选项
	 * @returns {Object} 审计报告
	 */
	generateAuditReport(options = {}) {
		const now = new Date();
		const report = {
			generatedAt: now.toISOString(),
			period: options.period || "last-24-hours",
			summary: this._calculateAuditSummary(),
			riskAssessment: this._assessAuditRisks(),
			recommendations: this._generateAuditRecommendations(),
		};

		return report;
	}

	/**
	 * 清理敏感信息
	 * @private
	 * @param {Object} details - 详细信息
	 * @returns {Object} 清理后的详细信息
	 */
	_sanitizeAuditDetails(details) {
		const sanitized = { ...details };

		// 移除敏感字段
		const sensitiveFields = [
			"password",
			"token",
			"key",
			"secret",
			"privateKey",
		];
		for (const field of sensitiveFields) {
			if (sanitized[field]) {
				sanitized[field] = "[REDACTED]";
			}
		}

		// 深度清理嵌套对象
		this._deepSanitize(sanitized);

		return sanitized;
	}

	/**
	 * 深度清理对象
	 * @private
	 * @param {Object} obj - 对象
	 */
	_deepSanitize(obj) {
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === "object" && value !== null) {
				this._deepSanitize(value);
			} else if (typeof value === "string" && value.length > 500) {
				// 截断长字符串
				obj[key] = `${value.substring(0, 500)}...`;
			}
		}
	}

	/**
	 * 持久化审计数据
	 * @private
	 * @param {Object} auditData - 审计数据
	 */
	async _persistAuditData(auditData) {
		// 示例实现：写入审计文件
		// 在实际实现中，可以写入数据库、发送到远程服务等
		try {
			const auditFile = path.join(
				".speco",
				"audit",
				`audit-${Date.now()}.json`,
			);
			await fs.mkdir(path.dirname(auditFile), { recursive: true });
			await fs.writeFile(auditFile, JSON.stringify(auditData, null, 2));
		} catch (error) {
			// 如果持久化失败，只记录日志，不抛出异常
			console.error("Failed to persist audit data:", error);
		}
	}

	/**
	 * 启动刷新定时器
	 * @private
	 */
	_startFlushTimer() {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.flushInterval);
	}

	/**
	 * 停止刷新定时器
	 */
	stop() {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
		}
		this.flush();
	}

	/**
	 * 计算审计摘要
	 * @private
	 * @returns {Object} 摘要信息
	 */
	_calculateAuditSummary() {
		const summary = {
			totalEvents: this.auditBuffer.length,
			eventsByAction: {},
			eventsByUser: {},
			eventsByResult: {},
			timeRange: {},
		};

		if (this.auditBuffer.length === 0) return summary;

		const timestamps = this.auditBuffer.map(
			(entry) => new Date(entry.timestamp),
		);
		summary.timeRange.start = new Date(Math.min(...timestamps)).toISOString();
		summary.timeRange.end = new Date(Math.max(...timestamps)).toISOString();

		for (const entry of this.auditBuffer) {
			// 按操作统计
			summary.eventsByAction[entry.action] =
				(summary.eventsByAction[entry.action] || 0) + 1;

			// 按用户统计
			const userId = entry.context.userId;
			summary.eventsByUser[userId] = (summary.eventsByUser[userId] || 0) + 1;

			// 按结果统计
			summary.eventsByResult[entry.result] =
				(summary.eventsByResult[entry.result] || 0) + 1;
		}

		return summary;
	}

	/**
	 * 评估审计风险
	 * @private
	 * @returns {Object} 风险评估
	 */
	_assessAuditRisks() {
		const summary = this._calculateAuditSummary();
		const risks = {
			level: "low",
			score: 0,
			issues: [],
		};

		// 检查失败操作比例
		const failureRate = summary.eventsByResult.failure / summary.totalEvents;
		if (failureRate > 0.1) {
			risks.score += 30;
			risks.issues.push("High failure rate in operations");
		}

		// 检查可疑活动模式
		const suspiciousPatterns = ["delete", "modify", "access"];
		for (const action of suspiciousPatterns) {
			const count = summary.eventsByAction[action] || 0;
			if (count > summary.totalEvents * 0.3) {
				risks.score += 20;
				risks.issues.push(`High frequency of ${action} operations`);
			}
		}

		// 根据分数确定风险级别
		if (risks.score >= 50) {
			risks.level = "high";
		} else if (risks.score >= 25) {
			risks.level = "medium";
		}

		return risks;
	}

	/**
	 * 生成审计建议
	 * @private
	 * @returns {Array} 建议列表
	 */
	_generateAuditRecommendations() {
		const recommendations = [];
		const summary = this._calculateAuditSummary();
		const risks = this._assessAuditRisks();

		if (risks.level === "high") {
			recommendations.push({
				priority: "high",
				message: "High security risk detected, immediate review required",
				action:
					"Review recent audit logs and investigate suspicious activities",
			});
		}

		if (summary.eventsByResult.failure > 0) {
			recommendations.push({
				priority: "medium",
				message: "Some operations are failing, investigate error patterns",
				action: "Analyze failed operations and fix underlying issues",
			});
		}

		return recommendations;
	}
}

/**
 * 监控系统类
 */
export class MonitoringSystem extends EventEmitter {
	constructor(config = {}) {
		super();
		this.config = {
			metricsInterval: config.metricsInterval || 60000, // 1分钟
			healthCheckInterval: config.healthCheckInterval || 300000, // 5分钟
			alertThresholds: {
				errorRate: config.alertThresholds?.errorRate || 0.05,
				responseTime: config.alertThresholds?.responseTime || 5000,
				memoryUsage: config.alertThresholds?.memoryUsage || 0.8,
				...config.alertThresholds,
			},
			...config,
		};

		this.logger = getLogger();
		this.metrics = new MonitoringMetrics();
		this.auditTracker = new AuditTracker(this.logger);
		this.healthStatus = "healthy";
		this.alerts = [];
		this._startMonitoring();
	}

	/**
	 * 启动监控
	 * @private
	 */
	_startMonitoring() {
		// 定期收集指标
		this.metricsInterval = setInterval(() => {
			this._collectSystemMetrics();
		}, this.config.metricsInterval);

		// 定期健康检查
		this.healthCheckInterval = setInterval(() => {
			this._performHealthCheck();
		}, this.config.healthCheckInterval);

		this.logger.info("Monitoring system started");
	}

	/**
	 * 收集系统指标
	 * @private
	 */
	_collectSystemMetrics() {
		try {
			// 内存使用情况
			const memUsage = process.memoryUsage();
			this.metrics.gauge("memory_heap_used", memUsage.heapUsed);
			this.metrics.gauge("memory_heap_total", memUsage.heapTotal);
			this.metrics.gauge("memory_external", memUsage.external);
			this.metrics.gauge("memory_rss", memUsage.rss);

			// CPU使用情况（简化版）
			const cpuUsage = process.cpuUsage();
			this.metrics.gauge("cpu_user", cpuUsage.user);
			this.metrics.gauge("cpu_system", cpuUsage.system);

			// 事件循环延迟（如果可用）
			if (typeof process.hrtime.bigint === "function") {
				const start = process.hrtime.bigint();
				setImmediate(() => {
					const end = process.hrtime.bigint();
					const delay = Number(end - start) / 1000000; // 转换为毫秒
					this.metrics.histogram("event_loop_delay", delay);
				});
			}

			// 活跃句柄数
			this.metrics.gauge("active_handles", process._getActiveHandles().length);

			// 活跃请求数
			this.metrics.gauge(
				"active_requests",
				process._getActiveRequests().length,
			);
		} catch (error) {
			this.logger.error("Failed to collect system metrics", {
				error: error.message,
			});
		}
	}

	/**
	 * 执行健康检查
	 * @private
	 */
	_performHealthCheck() {
		const snapshot = this.metrics.getSnapshot();
		let newStatus = "healthy";
		const issues = [];

		// 检查内存使用率
		const heapUsageRatio =
			snapshot.gauges.memory_heap_used?.value /
			snapshot.gauges.memory_heap_total?.value;

		if (heapUsageRatio > this.config.alertThresholds.memoryUsage) {
			newStatus = "warning";
			issues.push(`High memory usage: ${(heapUsageRatio * 100).toFixed(1)}%`);
		}

		// 检查错误率
		const loggerMetrics = this.logger.getMetrics();
		const errorRate =
			loggerMetrics.errors / Math.max(loggerMetrics.totalLogs, 1);

		if (errorRate > this.config.alertThresholds.errorRate) {
			newStatus = "critical";
			issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
		}

		// 检查事件循环延迟
		const eventLoopStats = snapshot.histograms.event_loop_delay;
		if (
			eventLoopStats &&
			eventLoopStats.p95 > this.config.alertThresholds.responseTime
		) {
			newStatus = "warning";
			issues.push(
				`High event loop delay: ${eventLoopStats.p95.toFixed(0)}ms (95th percentile)`,
			);
		}

		// 更新健康状态
		if (newStatus !== this.healthStatus) {
			const oldStatus = this.healthStatus;
			this.healthStatus = newStatus;

			this.emit(MONITORING_EVENTS.SYSTEM_HEALTH_CHANGED, {
				oldStatus,
				newStatus,
				issues,
				timestamp: new Date().toISOString(),
			});

			this.logger.info("System health status changed", {
				oldStatus,
				newStatus,
				issues,
			});
		}

		// 生成告警
		if (issues.length > 0) {
			const alert = {
				level: newStatus === "critical" ? "critical" : "warning",
				message: `System health issues detected: ${issues.join(", ")}`,
				timestamp: new Date().toISOString(),
				metrics: snapshot,
			};

			this.alerts.push(alert);
			this.emit(MONITORING_EVENTS.SECURITY_ALERT, alert);
		}
	}

	/**
	 * 记录操作开始
	 * @param {string} operation - 操作名称
	 * @param {Object} context - 上下文
	 * @returns {string} 操作ID
	 */
	startOperation(operation, context = {}) {
		const operationId = this.metrics.startTimer(
			`operation_${operation}`,
			context,
		);
		this.metrics.increment("operations_started", 1, { operation });

		this.logger.debug(`Operation started: ${operation}`, {
			operationId,
			context,
		});

		return operationId;
	}

	/**
	 * 记录操作完成
	 * @param {string} operationId - 操作ID
	 * @param {boolean} success - 是否成功
	 * @param {Object} result - 结果
	 */
	endOperation(operationId, success = true, result = {}) {
		const duration = this.metrics.stopTimer(operationId);
		const tags = { success: success.toString() };

		this.metrics.increment("operations_completed", 1, tags);
		this.metrics.histogram("operation_duration", duration, tags);

		if (!success) {
			this.metrics.increment("operations_failed", 1);
		}

		this.logger.performance(`operation_${operationId}`, duration, {
			success,
			result: this._sanitizeResult(result),
		});
	}

	/**
	 * 记录审计事件
	 * @param {string} action - 操作
	 * @param {Object} details - 详细信息
	 * @param {Object} context - 上下文
	 */
	audit(action, details = {}, context = {}) {
		this.auditTracker.audit(action, details, context);
	}

	/**
	 * 生成监控报告
	 * @param {Object} options - 报告选项
	 * @returns {Object} 监控报告
	 */
	generateReport(options = {}) {
		const report = {
			generatedAt: new Date().toISOString(),
			period: options.period || "current-session",
			system: {
				health: this.healthStatus,
				uptime: process.uptime(),
				version: process.version,
				platform: process.platform,
				architecture: process.arch,
			},
			metrics: this.metrics.getSnapshot(),
			logging: this.logger.generateReport(options),
			auditing: this.auditTracker.generateAuditReport(options),
			alerts: this.alerts.slice(-10), // 最近10个告警
			recommendations: this._generateRecommendations(),
		};

		return report;
	}

	/**
	 * 获取当前指标
	 * @returns {Object} 当前指标
	 */
	getCurrentMetrics() {
		return this.metrics.getSnapshot();
	}

	/**
	 * 获取告警列表
	 * @param {number} limit - 限制数量
	 * @returns {Array} 告警列表
	 */
	getAlerts(limit = 50) {
		return this.alerts.slice(-limit);
	}

	/**
	 * 清除告警
	 */
	clearAlerts() {
		this.alerts = [];
	}

	/**
	 * 停止监控
	 */
	async stop() {
		if (this.metricsInterval) {
			clearInterval(this.metricsInterval);
		}

		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
		}

		this.auditTracker.stop();
		await this.logger.close();

		this.logger.info("Monitoring system stopped");
	}

	/**
	 * 生成建议
	 * @private
	 * @returns {Array} 建议列表
	 */
	_generateRecommendations() {
		const recommendations = [];
		const snapshot = this.metrics.getSnapshot();

		// 内存使用建议
		const heapUsage = snapshot.gauges.memory_heap_used?.value || 0;
		const heapTotal = snapshot.gauges.memory_heap_total?.value || 1;
		const memoryRatio = heapUsage / heapTotal;

		if (memoryRatio > 0.7) {
			recommendations.push({
				category: "performance",
				priority: "medium",
				message: "High memory usage detected",
				action:
					"Consider optimizing memory usage or increasing available memory",
				metric: `Memory usage: ${(memoryRatio * 100).toFixed(1)}%`,
			});
		}

		// 错误率建议
		const loggerMetrics = this.logger.getMetrics();
		const errorRate =
			loggerMetrics.errors / Math.max(loggerMetrics.totalLogs, 1);

		if (errorRate > 0.03) {
			recommendations.push({
				category: "reliability",
				priority: "high",
				message: "High error rate detected",
				action: "Review error logs and fix underlying issues",
				metric: `Error rate: ${(errorRate * 100).toFixed(2)}%`,
			});
		}

		return recommendations;
	}

	/**
	 * 清理结果数据
	 * @private
	 * @param {Object} result - 结果对象
	 * @returns {Object} 清理后的结果
	 */
	_sanitizeResult(result) {
		const sanitized = { ...result };

		// 移除大对象和敏感信息
		const sensitiveKeys = ["data", "content", "buffer"];
		for (const key of sensitiveKeys) {
			if (
				sanitized[key] &&
				typeof sanitized[key] === "string" &&
				sanitized[key].length > 100
			) {
				sanitized[key] = `[${key} length: ${sanitized[key].length}]`;
			}
		}

		return sanitized;
	}
}

// 创建全局监控实例
let globalMonitoringSystem = null;

/**
 * 获取全局监控系统实例
 * @param {Object} config - 配置对象
 * @returns {MonitoringSystem} 监控系统实例
 */
export function getMonitoringSystem(config = {}) {
	if (!globalMonitoringSystem) {
		globalMonitoringSystem = new MonitoringSystem(config);
	}
	return globalMonitoringSystem;
}

/**
 * 设置全局监控系统实例
 * @param {MonitoringSystem} system - 监控系统实例
 */
export function setMonitoringSystem(system) {
	globalMonitoringSystem = system;
}

// MonitoringSystem, MonitoringMetrics, and AuditTracker are already exported via class/function declarations
