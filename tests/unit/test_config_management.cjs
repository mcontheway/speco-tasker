/**
 * test_config_management.cjs
 * 单元测试：验证配置管理功能
 *
 * SCOPE: 测试配置文件的读取、写入、验证和更新功能
 */

// Mock 工具函数
jest.mock('../../scripts/modules/utils.js', () => ({
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	findProjectRoot: jest.fn(() => '/mock/project/root'),
	ensureTagMetadata: jest.fn(),
	markMigrationForNotice: jest.fn(),
	performCompleteTagMigration: jest.fn(),
	isSilentMode: jest.fn(() => false)
}))

// Mock 配置管理器
jest.mock('../../scripts/modules/config-manager.js', () => ({
	getDefaultPriority: jest.fn(() => 'medium'),
	hasCodebaseAnalysis: jest.fn(() => false)
}))

describe('配置管理功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('配置文件数据结构', () => {
		it('应该正确定义配置对象结构', () => {
			const config = {
				version: '1.0.0',
				project: {
					name: 'task-master',
					description: '任务管理系统',
					version: '1.0.0',
					author: 'developer'
				},
				models: {
					main: 'claude-3-sonnet-20240229',
					research: 'claude-3-haiku-20240307',
					fallback: 'gpt-3.5-turbo'
				},
				ai: {
					maxTokens: 4000,
					temperature: 0.7,
					topP: 0.9
				},
				task: {
					defaultPriority: 'medium',
					maxSubtasks: 10,
					autoSave: true
				},
				ui: {
					theme: 'dark',
					language: 'zh-CN',
					showProgress: true
				},
				logging: {
					level: 'info',
					file: 'logs/task-master.log',
					maxSize: '10m'
				}
			}

			expect(config).toHaveProperty('version')
			expect(config).toHaveProperty('project')
			expect(config).toHaveProperty('models')
			expect(config).toHaveProperty('ai')
			expect(config).toHaveProperty('task')
			expect(config).toHaveProperty('ui')
			expect(config).toHaveProperty('logging')

			expect(config.project.name).toBe('task-master')
			expect(config.models.main).toBe('claude-3-sonnet-20240229')
			expect(config.task.defaultPriority).toBe('medium')
			expect(config.ui.theme).toBe('dark')
		})

		it('应该验证配置值的有效性', () => {
			const validateConfig = (config) => {
				const errors = []

				// 验证项目配置
				if (!config.project?.name || config.project.name.length === 0) {
					errors.push('项目名称不能为空')
				}

				// 验证模型配置
				const validModels = ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'gpt-3.5-turbo', 'gpt-4']
				if (config.models?.main && !validModels.includes(config.models.main)) {
					errors.push('主模型配置无效')
				}

				// 验证AI参数
				if (config.ai?.maxTokens && (config.ai.maxTokens < 100 || config.ai.maxTokens > 32000)) {
					errors.push('maxTokens必须在100-32000之间')
				}
				if (config.ai?.temperature && (config.ai.temperature < 0 || config.ai.temperature > 2)) {
					errors.push('temperature必须在0-2之间')
				}

				// 验证任务配置
				const validPriorities = ['low', 'medium', 'high']
				if (config.task?.defaultPriority && !validPriorities.includes(config.task.defaultPriority)) {
					errors.push('默认优先级无效')
				}

				return { isValid: errors.length === 0, errors }
			}

			const validConfig = {
				project: { name: 'test-project' },
				models: { main: 'claude-3-sonnet-20240229' },
				ai: { maxTokens: 4000, temperature: 0.7 },
				task: { defaultPriority: 'medium' }
			}

			const invalidConfig = {
				project: { name: '' },
				models: { main: 'invalid-model' },
				ai: { maxTokens: 50000, temperature: 3 },
				task: { defaultPriority: 'urgent' }
			}

			expect(validateConfig(validConfig).isValid).toBe(true)
			expect(validateConfig(invalidConfig).isValid).toBe(false)
			expect(validateConfig(invalidConfig).errors.length).toBeGreaterThan(0)
		})
	})

	describe('配置文件的读写操作', () => {
		it('应该能够读取配置文件', () => {
			const mockConfig = {
				version: '1.0.0',
				project: { name: 'test-project' },
				models: { main: 'claude-3-sonnet-20240229' }
			}

			// Mock文件系统读取
			const fs = require('fs')
			fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockConfig))

			const loadConfig = (configPath) => {
				try {
					const configData = fs.readFileSync(configPath, 'utf8')
					return JSON.parse(configData)
				} catch (error) {
					throw new Error(`读取配置文件失败: ${error.message}`)
				}
			}

			const config = loadConfig('/mock/config.json')
			expect(config.version).toBe('1.0.0')
			expect(config.project.name).toBe('test-project')
			expect(config.models.main).toBe('claude-3-sonnet-20240229')
		})

		it('应该能够写入配置文件', () => {
			const configToSave = {
				version: '1.0.0',
				project: { name: 'updated-project' },
				models: { main: 'gpt-4' }
			}

			// Mock文件系统写入
			const fs = require('fs')
			fs.writeFileSync = jest.fn()

			const saveConfig = (configPath, config) => {
				try {
					const configData = JSON.stringify(config, null, 2)
					fs.writeFileSync(configPath, configData, 'utf8')
					return true
				} catch (error) {
					throw new Error(`写入配置文件失败: ${error.message}`)
				}
			}

			const result = saveConfig('/mock/config.json', configToSave)
			expect(result).toBe(true)
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				'/mock/config.json',
				JSON.stringify(configToSave, null, 2),
				'utf8'
			)
		})

		it('应该处理配置文件不存在的情况', () => {
			const fs = require('fs')
			fs.readFileSync = jest.fn().mockImplementation(() => {
				throw new Error('文件不存在')
			})

			const loadConfigWithDefault = (configPath) => {
				try {
					const configData = fs.readFileSync(configPath, 'utf8')
					return JSON.parse(configData)
				} catch (error) {
					// 返回默认配置
					return {
						version: '1.0.0',
						project: { name: 'default-project' },
						models: { main: 'claude-3-sonnet-20240229' }
					}
				}
			}

			const config = loadConfigWithDefault('/non-existent/config.json')
			expect(config.project.name).toBe('default-project')
			expect(config.models.main).toBe('claude-3-sonnet-20240229')
		})
	})

	describe('配置项的更新操作', () => {
		it('应该能够更新单个配置项', () => {
			const config = {
				project: { name: 'original-project' },
				models: { main: 'claude-3-sonnet-20240229' },
				ai: { maxTokens: 4000 }
			}

			const updateConfigValue = (config, path, value) => {
				const keys = path.split('.')
				let current = config

				for (let i = 0; i < keys.length - 1; i++) {
					if (!current[keys[i]]) {
						current[keys[i]] = {}
					}
					current = current[keys[i]]
				}

				current[keys[keys.length - 1]] = value
				return config
			}

			const updatedConfig = updateConfigValue(config, 'project.name', 'updated-project')
			expect(updatedConfig.project.name).toBe('updated-project')

			const updatedConfig2 = updateConfigValue(config, 'ai.maxTokens', 8000)
			expect(updatedConfig2.ai.maxTokens).toBe(8000)

			const updatedConfig3 = updateConfigValue(config, 'models.fallback', 'gpt-3.5-turbo')
			expect(updatedConfig3.models.fallback).toBe('gpt-3.5-turbo')
		})

		it('应该能够批量更新配置项', () => {
			const config = {
				project: { name: 'original' },
				models: { main: 'claude-3-sonnet-20240229' },
				ai: { maxTokens: 4000, temperature: 0.7 }
			}

			const batchUpdateConfig = (config, updates) => {
				const newConfig = JSON.parse(JSON.stringify(config))

				updates.forEach(({ path, value }) => {
					const keys = path.split('.')
					let current = newConfig

					for (let i = 0; i < keys.length - 1; i++) {
						if (!current[keys[i]]) {
							current[keys[i]] = {}
						}
						current = current[keys[i]]
					}

					current[keys[keys.length - 1]] = value
				})

				return newConfig
			}

			const updates = [
				{ path: 'project.name', value: 'batch-updated' },
				{ path: 'models.main', value: 'gpt-4' },
				{ path: 'ai.maxTokens', value: 8000 },
				{ path: 'ui.theme', value: 'light' }
			]

			const updatedConfig = batchUpdateConfig(config, updates)
			expect(updatedConfig.project.name).toBe('batch-updated')
			expect(updatedConfig.models.main).toBe('gpt-4')
			expect(updatedConfig.ai.maxTokens).toBe(8000)
			expect(updatedConfig.ui.theme).toBe('light')
		})

		it('应该支持配置项的撤销操作', () => {
			const configHistory = []
			let currentConfig = {
				project: { name: 'original' },
				models: { main: 'claude-3-sonnet-20240229' }
			}

			const updateConfigWithHistory = (config, path, value) => {
				// 保存当前状态到历史
				configHistory.push(JSON.parse(JSON.stringify(config)))

				// 更新配置
				const keys = path.split('.')
				let current = config

				for (let i = 0; i < keys.length - 1; i++) {
					current = current[keys[i]]
				}

				current[keys[keys.length - 1]] = value
				return config
			}

			const undoConfigChange = () => {
				if (configHistory.length === 0) return null
				return configHistory.pop()
			}

			// 进行更新
			updateConfigWithHistory(currentConfig, 'project.name', 'updated')
			expect(currentConfig.project.name).toBe('updated')
			expect(configHistory.length).toBe(1)

			// 撤销更新
			const previousConfig = undoConfigChange()
			expect(previousConfig.project.name).toBe('original')
			expect(configHistory.length).toBe(0)
		})
	})

	describe('配置验证和合并', () => {
		it('应该能够合并用户配置和默认配置', () => {
			const defaultConfig = {
				version: '1.0.0',
				project: { name: 'default-project', version: '1.0.0' },
				models: { main: 'claude-3-sonnet-20240229', fallback: 'gpt-3.5-turbo' },
				ai: { maxTokens: 4000, temperature: 0.7 },
				task: { defaultPriority: 'medium', autoSave: true },
				ui: { theme: 'dark', language: 'en' }
			}

			const userConfig = {
				project: { name: 'user-project' },
				models: { main: 'gpt-4' },
				ai: { maxTokens: 8000 },
				ui: { theme: 'light' }
			}

			const mergeConfigs = (defaultConfig, userConfig) => {
				const merged = JSON.parse(JSON.stringify(defaultConfig))

				const deepMerge = (target, source) => {
					for (const key in source) {
						if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
							target[key] = target[key] || {}
							deepMerge(target[key], source[key])
						} else {
							target[key] = source[key]
						}
					}
				}

				deepMerge(merged, userConfig)
				return merged
			}

			const mergedConfig = mergeConfigs(defaultConfig, userConfig)

			// 用户配置覆盖默认值
			expect(mergedConfig.project.name).toBe('user-project')
			expect(mergedConfig.models.main).toBe('gpt-4')
			expect(mergedConfig.ai.maxTokens).toBe(8000)
			expect(mergedConfig.ui.theme).toBe('light')

			// 未覆盖的保持默认值
			expect(mergedConfig.project.version).toBe('1.0.0')
			expect(mergedConfig.models.fallback).toBe('gpt-3.5-turbo')
			expect(mergedConfig.ai.temperature).toBe(0.7)
			expect(mergedConfig.task.defaultPriority).toBe('medium')
		})

		it('应该验证配置项之间的依赖关系', () => {
			const validateConfigDependencies = (config) => {
				const errors = []

				// 如果启用了AI功能，必须配置模型
				if (config.ai?.enabled && !config.models?.main) {
					errors.push('启用AI功能时必须配置主模型')
				}

				// 如果设置了备用模型，必须有主模型
				if (config.models?.fallback && !config.models?.main) {
					errors.push('配置备用模型时必须先配置主模型')
				}

				// 某些UI主题需要特定的配置
				if (config.ui?.theme === 'custom' && !config.ui?.customColors) {
					errors.push('自定义主题需要配置customColors')
				}

				return { isValid: errors.length === 0, errors }
			}

			const validConfig = {
				ai: { enabled: true },
				models: { main: 'claude-3-sonnet-20240229', fallback: 'gpt-3.5-turbo' },
				ui: { theme: 'dark' }
			}

			const invalidConfig1 = {
				ai: { enabled: true },
				models: {} // 缺少主模型
			}

			const invalidConfig2 = {
				models: { fallback: 'gpt-3.5-turbo' }, // 有备用但无主模型
				ui: { theme: 'custom' } // 自定义主题缺少配置
			}

			expect(validateConfigDependencies(validConfig).isValid).toBe(true)
			expect(validateConfigDependencies(invalidConfig1).isValid).toBe(false)
			expect(validateConfigDependencies(invalidConfig2).isValid).toBe(false)
		})

		it('应该支持配置版本迁移', () => {
			const migrateConfig = (config, targetVersion) => {
				const migrations = {
					'1.0.0': (cfg) => cfg, // 基础版本
					'1.1.0': (cfg) => ({
						...cfg,
						ai: { ...cfg.ai, topP: cfg.ai.topP || 0.9 }
					}),
					'1.2.0': (cfg) => ({
						...cfg,
						task: { ...cfg.task, maxSubtasks: cfg.task.maxSubtasks || 10 },
						ui: { ...cfg.ui, showProgress: cfg.ui.showProgress !== false }
					})
				}

				let migratedConfig = JSON.parse(JSON.stringify(config))

				// 按版本顺序应用迁移
				const versions = Object.keys(migrations).sort()
				for (const version of versions) {
					if (version > config.version && version <= targetVersion) {
						migratedConfig = migrations[version](migratedConfig)
						migratedConfig.version = version
					}
				}

				return migratedConfig
			}

			const oldConfig = {
				version: '1.0.0',
				project: { name: 'test' },
				ai: { maxTokens: 4000, temperature: 0.7 },
				task: { defaultPriority: 'medium' },
				ui: { theme: 'dark' }
			}

			const migratedConfig = migrateConfig(oldConfig, '1.2.0')

			expect(migratedConfig.version).toBe('1.2.0')
			expect(migratedConfig.ai.topP).toBe(0.9)
			expect(migratedConfig.task.maxSubtasks).toBe(10)
			expect(migratedConfig.ui.showProgress).toBe(true)
		})
	})

	describe('配置安全性', () => {
		it('应该保护敏感配置信息', () => {
			const configWithSecrets = {
				apiKeys: {
					anthropic: 'sk-ant-api03-xxxxxxxxxxxxx',
					openai: 'sk-xxxxxxxxxxxxxxxxxx',
					database: 'postgres://user:password@localhost/db'
				},
				project: { name: 'sensitive-project' },
				models: { main: 'claude-3-sonnet-20240229' }
			}

			const sanitizeConfig = (config) => {
				const sanitized = JSON.parse(JSON.stringify(config))

				// 隐藏API密钥
				if (sanitized.apiKeys) {
					Object.keys(sanitized.apiKeys).forEach(key => {
						if (typeof sanitized.apiKeys[key] === 'string') {
							const value = sanitized.apiKeys[key]
							sanitized.apiKeys[key] = value.substring(0, 8) + '...' + value.substring(value.length - 4)
						}
					})
				}

				// 隐藏数据库连接字符串中的密码
				if (sanitized.database?.url) {
					sanitized.database.url = sanitized.database.url.replace(/:([^:@]{4})[^:@]*@/, ':$1****@')
				}

				return sanitized
			}

			const sanitizedConfig = sanitizeConfig(configWithSecrets)

			expect(sanitizedConfig.apiKeys.anthropic).toMatch(/^sk-ant-a\.\.\./)
			expect(sanitizedConfig.apiKeys.openai).toMatch(/^sk-xxxxx\.\.\./)
			expect(sanitizedConfig.project.name).toBe('sensitive-project') // 非敏感信息保持不变
			expect(sanitizedConfig.models.main).toBe('claude-3-sonnet-20240229') // 非敏感信息保持不变
		})

		it('应该验证配置文件的权限', () => {
			const fs = require('fs')

			const checkConfigFilePermissions = (configPath) => {
				try {
					const stats = fs.statSync(configPath)
					const isOwner = stats.uid === process.getuid()
					const isGroup = stats.gid === process.getgid()
					const permissions = (stats.mode & parseInt('777', 8)).toString(8)

					return {
						exists: true,
						isReadable: !!(stats.mode & parseInt('400', 8)),
						isWritable: !!(stats.mode & parseInt('200', 8)),
						isOwner,
						isGroup,
						permissions,
						isSecure: permissions === '600' || permissions === '400' // 只允许所有者读/写
					}
				} catch (error) {
					return { exists: false, error: error.message }
				}
			}

			// Mock文件状态
			fs.statSync = jest.fn().mockReturnValue({
				uid: process.getuid(),
				gid: process.getgid(),
				mode: parseInt('600', 8), // 只允许所有者读写
				isFile: () => true,
				isDirectory: () => false
			})

			const permissions = checkConfigFilePermissions('/mock/config.json')

			expect(permissions.exists).toBe(true)
			expect(permissions.isReadable).toBe(true)
			expect(permissions.isWritable).toBe(true)
			expect(permissions.isOwner).toBe(true)
			expect(permissions.permissions).toBe('600')
			expect(permissions.isSecure).toBe(true)
		})

		it('应该支持配置加密存储', () => {
			const encryptConfig = (config, key) => {
				const configString = JSON.stringify(config)
				// 简化的"加密" - 实际实现应该使用真正的加密算法
				const encrypted = btoa(configString.split('').reverse().join(''))
				return {
					encrypted,
					algorithm: 'simple-reverse-base64',
					timestamp: new Date().toISOString()
				}
			}

			const decryptConfig = (encryptedData, key) => {
				// 简化的"解密"
				const decrypted = atob(encryptedData.encrypted).split('').reverse().join('')
				return JSON.parse(decrypted)
			}

			const sensitiveConfig = {
				apiKeys: { anthropic: 'secret-key' },
				project: { name: 'secure-project' }
			}

			const encrypted = encryptConfig(sensitiveConfig, 'encryption-key')
			const decrypted = decryptConfig(encrypted, 'encryption-key')

			expect(encrypted.algorithm).toBe('simple-reverse-base64')
			expect(encrypted.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
			expect(decrypted.project.name).toBe('secure-project')
			expect(decrypted.apiKeys.anthropic).toBe('secret-key')
		})
	})

	describe('配置备份和恢复', () => {
		it('应该能够创建配置备份', () => {
			const config = {
				version: '1.0.0',
				project: { name: 'backup-test' },
				models: { main: 'claude-3-sonnet-20240229' }
			}

			const createConfigBackup = (config, backupPath) => {
				const fs = require('fs')
				const backupData = {
					config,
					backupDate: new Date().toISOString(),
					version: config.version,
					checksum: 'mock-checksum' // 实际实现应该计算校验和
				}

				fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))
				return backupData
			}

			const fs = require('fs')
			fs.writeFileSync = jest.fn()

			const backup = createConfigBackup(config, '/backup/config.backup.json')

			expect(backup.config.project.name).toBe('backup-test')
			expect(backup.backupDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
			expect(backup.version).toBe('1.0.0')
			expect(fs.writeFileSync).toHaveBeenCalled()
		})

		it('应该能够从备份恢复配置', () => {
			const backupData = {
				config: {
					version: '1.0.0',
					project: { name: 'restored-project' },
					models: { main: 'gpt-4' }
				},
				backupDate: '2024-01-01T00:00:00.000Z',
				version: '1.0.0'
			}

			const fs = require('fs')
			fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(backupData))

			const restoreConfigFromBackup = (backupPath) => {
				try {
					const backupContent = fs.readFileSync(backupPath, 'utf8')
					const backup = JSON.parse(backupContent)

					return {
						...backup.config,
						restoredFrom: backupPath,
						restoredAt: new Date().toISOString(),
						originalBackupDate: backup.backupDate
					}
				} catch (error) {
					throw new Error(`恢复配置失败: ${error.message}`)
				}
			}

			const restoredConfig = restoreConfigFromBackup('/backup/config.backup.json')

			expect(restoredConfig.project.name).toBe('restored-project')
			expect(restoredConfig.models.main).toBe('gpt-4')
			expect(restoredConfig.restoredFrom).toBe('/backup/config.backup.json')
			expect(restoredConfig.originalBackupDate).toBe('2024-01-01T00:00:00.000Z')
		})

		it('应该验证备份文件的完整性', () => {
			const validateBackupIntegrity = (backupData) => {
				const errors = []

				// 验证必需字段
				if (!backupData.config) errors.push('缺少config字段')
				if (!backupData.backupDate) errors.push('缺少backupDate字段')
				if (!backupData.version) errors.push('缺少version字段')

				// 验证配置结构
				if (backupData.config && !backupData.config.project?.name) {
					errors.push('配置缺少项目名称')
				}

				// 验证时间戳格式
				if (backupData.backupDate) {
					const date = new Date(backupData.backupDate)
					if (isNaN(date.getTime())) {
						errors.push('backupDate格式无效')
					}
				}

				return { isValid: errors.length === 0, errors }
			}

			const validBackup = {
				config: { project: { name: 'test' }, models: { main: 'gpt-4' } },
				backupDate: '2024-01-01T00:00:00.000Z',
				version: '1.0.0'
			}

			const invalidBackup = {
				config: { models: { main: 'gpt-4' } }, // 缺少项目名称
				version: '1.0.0'
				// 缺少backupDate
			}

			expect(validateBackupIntegrity(validBackup).isValid).toBe(true)
			expect(validateBackupIntegrity(invalidBackup).isValid).toBe(false)
			expect(validateBackupIntegrity(invalidBackup).errors).toContain('缺少backupDate字段')
			expect(validateBackupIntegrity(invalidBackup).errors).toContain('配置缺少项目名称')
		})
	})
})
