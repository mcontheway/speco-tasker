/**
 * 配置缓存管理器
 * 提供高效的配置缓存和内存泄漏防护机制
 */

const DEFAULT_CACHE_CONFIG = {
	maxSize: 1000, // 最大缓存条目数
	ttl: 3600000, // 默认TTL: 1小时 (毫秒)
	cleanupInterval: 300000, // 清理间隔: 5分钟 (毫秒)
	maxMemoryUsage: 50 * 1024 * 1024, // 最大内存使用: 50MB
};

/**
 * CacheEntry 类
 * 表示缓存中的单个条目
 */
class CacheEntry {
	/**
	 * 构造函数
	 * @param {any} value - 缓存的值
	 * @param {number} ttl - 生存时间 (毫秒)
	 */
	constructor(value, ttl = DEFAULT_CACHE_CONFIG.ttl) {
		this.value = value;
		this.createdAt = Date.now();
		this.lastAccessed = Date.now();
		this.ttl = ttl;
		this.accessCount = 0;
	}

	/**
	 * 检查条目是否过期
	 * @returns {boolean} 是否过期
	 */
	isExpired() {
		return Date.now() - this.createdAt > this.ttl;
	}

	/**
	 * 更新访问信息
	 */
	access() {
		this.lastAccessed = Date.now();
		this.accessCount++;
	}

	/**
	 * 获取条目大小 (近似值)
	 * @returns {number} 大小 (字节)
	 */
	getSize() {
		try {
			// 估算对象大小 (简化实现)
			const jsonString = JSON.stringify(this.value);
			return jsonString.length * 2; // UTF-16 每个字符2字节
		} catch (error) {
			return 1024; // 默认1KB
		}
	}
}

/**
 * ConfigCache 类
 * 配置缓存管理器
 */
class ConfigCache {
	/**
	 * 构造函数
	 * @param {Object} config - 缓存配置
	 */
	constructor(config = {}) {
		this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
		this.cache = new Map();
		this.stats = {
			hits: 0,
			misses: 0,
			evictions: 0,
			totalSize: 0,
			lastCleanup: Date.now(),
		};

		// 启动自动清理
		this.startAutoCleanup();
	}

	/**
	 * 获取缓存条目
	 * @param {string} key - 缓存键
	 * @returns {any} 缓存的值或null
	 */
	get(key) {
		const entry = this.cache.get(key);

		if (!entry) {
			this.stats.misses++;
			return null;
		}

		if (entry.isExpired()) {
			this.cache.delete(key);
			this.stats.evictions++;
			this.stats.totalSize -= entry.getSize();
			this.stats.misses++;
			return null;
		}

		entry.access();
		this.stats.hits++;
		return entry.value;
	}

	/**
	 * 设置缓存条目
	 * @param {string} key - 缓存键
	 * @param {any} value - 缓存的值
	 * @param {number} ttl - 生存时间 (毫秒)
	 */
	set(key, value, ttl = this.config.ttl) {
		// 检查内存使用情况
		if (this.shouldEvictDueToMemory()) {
			this.evictOldest();
		}

		// 检查缓存大小限制
		if (this.cache.size >= this.config.maxSize) {
			this.evictLRU();
		}

		const entry = new CacheEntry(value, ttl);
		const entrySize = entry.getSize();

		// 如果设置新条目会导致超出内存限制，先清理
		if (this.stats.totalSize + entrySize > this.config.maxMemoryUsage) {
			this.evictUntilFits(entrySize);
		}

		this.cache.set(key, entry);
		this.stats.totalSize += entrySize;
	}

	/**
	 * 删除缓存条目
	 * @param {string} key - 缓存键
	 * @returns {boolean} 是否成功删除
	 */
	delete(key) {
		const entry = this.cache.get(key);
		if (entry) {
			this.stats.totalSize -= entry.getSize();
			return this.cache.delete(key);
		}
		return false;
	}

	/**
	 * 清空缓存
	 */
	clear() {
		this.cache.clear();
		this.stats.totalSize = 0;
		this.stats.evictions += this.cache.size;
	}

	/**
	 * 检查键是否存在且未过期
	 * @param {string} key - 缓存键
	 * @returns {boolean} 是否存在
	 */
	has(key) {
		const entry = this.cache.get(key);
		return entry && !entry.isExpired();
	}

	/**
	 * 获取缓存统计信息
	 * @returns {Object} 统计信息
	 */
	getStats() {
		const now = Date.now();
		const entries = Array.from(this.cache.values());

		return {
			...this.stats,
			size: this.cache.size,
			hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
			totalMemoryUsage: this.stats.totalSize,
			maxMemoryUsage: this.config.maxMemoryUsage,
			avgEntrySize:
				entries.length > 0 ? this.stats.totalSize / entries.length : 0,
			oldestEntry:
				entries.length > 0
					? Math.min(...entries.map((e) => e.createdAt))
					: null,
			newestEntry:
				entries.length > 0
					? Math.max(...entries.map((e) => e.createdAt))
					: null,
			lastCleanup: new Date(this.stats.lastCleanup).toISOString(),
			uptime: now - this.stats.lastCleanup,
		};
	}

	/**
	 * 检查是否应该由于内存使用而驱逐
	 * @returns {boolean} 是否需要驱逐
	 */
	shouldEvictDueToMemory() {
		return this.stats.totalSize >= this.config.maxMemoryUsage * 0.9; // 90%阈值
	}

	/**
	 * 驱逐最旧的条目
	 */
	evictOldest() {
		let oldestKey = null;
		let oldestTime = Date.now();

		for (const [key, entry] of this.cache) {
			if (entry.createdAt < oldestTime) {
				oldestTime = entry.createdAt;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.delete(oldestKey);
			this.stats.evictions++;
		}
	}

	/**
	 * 驱逐最少使用的条目 (LRU)
	 */
	evictLRU() {
		let lruKey = null;
		let lruTime = Date.now();

		for (const [key, entry] of this.cache) {
			if (entry.lastAccessed < lruTime) {
				lruTime = entry.lastAccessed;
				lruKey = key;
			}
		}

		if (lruKey) {
			this.delete(lruKey);
			this.stats.evictions++;
		}
	}

	/**
	 * 驱逐条目直到有足够空间
	 * @param {number} requiredSize - 需要的大小
	 */
	evictUntilFits(requiredSize) {
		const targetSize = this.config.maxMemoryUsage - requiredSize;

		while (this.stats.totalSize > targetSize && this.cache.size > 0) {
			this.evictOldest();
		}
	}

	/**
	 * 执行清理操作
	 */
	cleanup() {
		const now = Date.now();
		let cleaned = 0;

		for (const [key, entry] of this.cache) {
			if (entry.isExpired()) {
				this.stats.totalSize -= entry.getSize();
				this.cache.delete(key);
				cleaned++;
			}
		}

		this.stats.evictions += cleaned;
		this.stats.lastCleanup = now;
	}

	/**
	 * 启动自动清理
	 */
	startAutoCleanup() {
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, this.config.cleanupInterval);
	}

	/**
	 * 停止自动清理
	 */
	stopAutoCleanup() {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}

	/**
	 * 获取或设置配置
	 * @param {string} key - 配置键
	 * @param {any} defaultValue - 默认值
	 * @returns {any} 配置值
	 */
	getConfig(key, defaultValue = null) {
		return this.config[key] !== undefined ? this.config[key] : defaultValue;
	}

	/**
	 * 设置配置
	 * @param {string} key - 配置键
	 * @param {any} value - 配置值
	 */
	setConfig(key, value) {
		this.config[key] = value;

		// 如果是关键配置变化，可能需要重新初始化
		if (key === "maxSize" || key === "ttl" || key === "maxMemoryUsage") {
			this.cleanup(); // 立即清理以应用新限制
		}
	}
}

// 创建默认实例
const defaultCache = new ConfigCache();

export { ConfigCache, defaultCache, DEFAULT_CACHE_CONFIG };
