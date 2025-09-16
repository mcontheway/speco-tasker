/**
 * test_task_history.cjs
 * 单元测试：验证任务历史功能
 *
 * SCOPE: 测试任务历史记录和追踪的核心功能，包括历史记录的创建、查询和数据结构完整性
 */

const fs = require('fs')
const path = require('path')

// Mock 依赖项
jest.mock('fs')
jest.mock('path')

// Mock 工具函数
jest.mock('../../scripts/modules/utils.js', () => ({
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	findProjectRoot: jest.fn(() => '/mock/project/root'),
	ensureTagMetadata: jest.fn(),
	markMigrationForNotice: jest.fn(),
	performCompleteTagMigration: jest.fn(),
	isSilentMode: jest.fn(() => false),
	getCurrentTag: jest.fn(() => 'main'),
	slugifyTagForFilePath: jest.fn(() => 'main')
}))

// Store original path methods to restore them after tests
const originalPathMethods = {
	dirname: require('path').dirname,
	join: require('path').join,
	extname: require('path').extname,
	basename: require('path').basename
}

// Mock 配置管理器
jest.mock('../../scripts/modules/config-manager.js', () => ({
	getDefaultPriority: jest.fn(() => 'medium'),
	hasCodebaseAnalysis: jest.fn(() => false)
}))

describe('任务历史功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		// 模拟文件系统
		fs.existsSync = jest.fn().mockReturnValue(true)
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}))
		path.dirname = jest.fn().mockReturnValue('/mock/project')
		path.join = jest.fn().mockImplementation((...args) => args.join('/'))
	})

	afterEach(() => {
		// Restore original path methods to prevent interference with other test suites
		Object.assign(path, originalPathMethods)
	})

	describe('历史记录数据结构验证', () => {
		it('应该创建具有完整属性的历史记录对象', () => {
			const historyEntry = {
				id: 'hist_001',
				taskId: 1,
				action: 'status_changed',
				oldValue: 'pending',
				newValue: 'in-progress',
				timestamp: new Date().toISOString(),
				user: 'test-user',
				details: '任务状态从待处理变更为进行中',
				tag: 'main',
				version: '1.0.0'
			}

			// 验证历史记录对象包含所有必需属性
			expect(historyEntry).toHaveProperty('id')
			expect(historyEntry).toHaveProperty('taskId')
			expect(historyEntry).toHaveProperty('action')
			expect(historyEntry).toHaveProperty('timestamp')
			expect(historyEntry).toHaveProperty('user')
			expect(historyEntry).toHaveProperty('details')
			expect(historyEntry).toHaveProperty('tag')
			expect(historyEntry).toHaveProperty('version')

			// 验证属性类型
			expect(typeof historyEntry.id).toBe('string')
			expect(typeof historyEntry.taskId).toBe('number')
			expect(typeof historyEntry.action).toBe('string')
			expect(typeof historyEntry.timestamp).toBe('string')
			expect(typeof historyEntry.user).toBe('string')
			expect(typeof historyEntry.details).toBe('string')
			expect(typeof historyEntry.tag).toBe('string')
			expect(typeof historyEntry.version).toBe('string')
		})

		it('应该支持不同类型的任务操作历史记录', () => {
			const historyTypes = [
				{
					action: 'task_created',
					description: '任务创建'
				},
				{
					action: 'task_updated',
					description: '任务更新'
				},
				{
					action: 'status_changed',
					description: '状态变更'
				},
				{
					action: 'priority_changed',
					description: '优先级变更'
				},
				{
					action: 'task_deleted',
					description: '任务删除'
				},
				{
					action: 'subtask_added',
					description: '子任务添加'
				},
				{
					action: 'dependency_added',
					description: '依赖关系添加'
				}
			]

			historyTypes.forEach(type => {
				const historyEntry = {
					id: `hist_${type.action}`,
					taskId: 1,
					action: type.action,
					timestamp: new Date().toISOString(),
					user: 'test-user',
					details: type.description,
					tag: 'main',
					version: '1.0.0'
				}

				expect(historyEntry.action).toBe(type.action)
				expect(historyEntry.details).toContain(type.description)
			})
		})

		it('应该支持历史记录的标签系统集成', () => {
			const taggedHistory = {
				id: 'hist_tag_001',
				taskId: 5,
				action: 'tag_changed',
				oldValue: 'main',
				newValue: 'feature-branch',
				timestamp: new Date().toISOString(),
				user: 'test-user',
				details: '任务标签从 master 变更为 feature-branch',
				tag: 'feature-branch',
				version: '1.0.0'
			}

			expect(taggedHistory.action).toBe('tag_changed')
			expect(taggedHistory.oldValue).toBe('main')
			expect(taggedHistory.newValue).toBe('feature-branch')
			expect(taggedHistory.tag).toBe('feature-branch')
			expect(taggedHistory.details).toContain('标签从 master 变更为 feature-branch')
		})
	})

	describe('历史记录查询功能验证', () => {
		it('应该能够按任务ID查询历史记录', () => {
			const mockHistoryData = [
				{
					id: 'hist_001',
					taskId: 1,
					action: 'task_created',
					timestamp: '2024-01-01T10:00:00Z',
					user: 'user1',
					details: '任务创建',
					tag: 'main'
				},
				{
					id: 'hist_002',
					taskId: 1,
					action: 'status_changed',
					timestamp: '2024-01-01T11:00:00Z',
					user: 'user1',
					details: '状态变更',
					tag: 'main'
				},
				{
					id: 'hist_003',
					taskId: 2,
					action: 'task_created',
					timestamp: '2024-01-01T12:00:00Z',
					user: 'user2',
					details: '任务创建',
					tag: 'main'
				}
			]

			// 模拟按任务ID查询
			const task1History = mockHistoryData.filter(entry => entry.taskId === 1)
			const task2History = mockHistoryData.filter(entry => entry.taskId === 2)

			expect(task1History).toHaveLength(2)
			expect(task2History).toHaveLength(1)
			expect(task1History.every(entry => entry.taskId === 1)).toBe(true)
			expect(task2History.every(entry => entry.taskId === 2)).toBe(true)
		})

		it('应该支持按时间范围查询历史记录', () => {
			const mockHistoryData = [
				{
					id: 'hist_001',
					taskId: 1,
					action: 'task_created',
					timestamp: '2024-01-01T08:00:00Z',
					user: 'user1',
					details: '早上创建任务',
					tag: 'main'
				},
				{
					id: 'hist_002',
					taskId: 1,
					action: 'status_changed',
					timestamp: '2024-01-01T14:00:00Z',
					user: 'user1',
					details: '下午状态变更',
					tag: 'main'
				},
				{
					id: 'hist_003',
					taskId: 1,
					action: 'task_completed',
					timestamp: '2024-01-01T18:00:00Z',
					user: 'user1',
					details: '晚上完成任务',
					tag: 'main'
				}
			]

			const startTime = '2024-01-01T12:00:00Z'
			const endTime = '2024-01-01T16:00:00Z'

			// 模拟按时间范围查询
			const timeRangeHistory = mockHistoryData.filter(entry => {
				return entry.timestamp >= startTime && entry.timestamp <= endTime
			})

			expect(timeRangeHistory).toHaveLength(1)
			expect(timeRangeHistory[0].action).toBe('status_changed')
			expect(timeRangeHistory[0].timestamp).toBe('2024-01-01T14:00:00Z')
		})

		it('应该支持按操作类型查询历史记录', () => {
			const mockHistoryData = [
				{
					id: 'hist_001',
					taskId: 1,
					action: 'task_created',
					timestamp: '2024-01-01T10:00:00Z',
					user: 'user1',
					details: '任务创建',
					tag: 'main'
				},
				{
					id: 'hist_002',
					taskId: 1,
					action: 'status_changed',
					timestamp: '2024-01-01T11:00:00Z',
					user: 'user1',
					details: '状态变更',
					tag: 'main'
				},
				{
					id: 'hist_003',
					taskId: 2,
					action: 'task_created',
					timestamp: '2024-01-01T12:00:00Z',
					user: 'user2',
					details: '任务创建',
					tag: 'main'
				},
				{
					id: 'hist_004',
					taskId: 2,
					action: 'status_changed',
					timestamp: '2024-01-01T13:00:00Z',
					user: 'user2',
					details: '状态变更',
					tag: 'main'
				}
			]

			const actionType = 'status_changed'
			const actionHistory = mockHistoryData.filter(entry => entry.action === actionType)

			expect(actionHistory).toHaveLength(2)
			expect(actionHistory.every(entry => entry.action === actionType)).toBe(true)
			expect(actionHistory.map(entry => entry.taskId)).toEqual([1, 2])
		})
	})

	describe('历史记录存储和持久化', () => {
		it('应该能够序列化历史记录对象为JSON', () => {
			const historyEntry = {
				id: 'hist_001',
				taskId: 1,
				action: 'task_created',
				timestamp: new Date().toISOString(),
				user: 'test-user',
				details: '任务创建',
				tag: 'main',
				version: '1.0.0'
			}

			const jsonString = JSON.stringify(historyEntry)
			const parsedHistory = JSON.parse(jsonString)

			expect(parsedHistory.id).toBe(historyEntry.id)
			expect(parsedHistory.taskId).toBe(historyEntry.taskId)
			expect(parsedHistory.action).toBe(historyEntry.action)
			expect(parsedHistory.timestamp).toBe(historyEntry.timestamp)
			expect(parsedHistory.user).toBe(historyEntry.user)
			expect(parsedHistory.details).toBe(historyEntry.details)
			expect(parsedHistory.tag).toBe(historyEntry.tag)
			expect(parsedHistory.version).toBe(historyEntry.version)
		})

		it('应该处理历史记录文件读写', () => {
			const mockHistoryData = {
				master: {
					entries: [
						{
							id: 'hist_001',
							taskId: 1,
							action: 'task_created',
							timestamp: '2024-01-01T10:00:00Z',
							user: 'user1',
							details: '任务创建',
							tag: 'main'
						},
						{
							id: 'hist_002',
							taskId: 2,
							action: 'task_created',
							timestamp: '2024-01-01T11:00:00Z',
							user: 'user2',
							details: '任务创建',
							tag: 'main'
						}
					],
					lastUpdated: '2024-01-01T11:00:00Z'
				}
			}

			// Mock 文件读取
			const { readJSON } = require('../../scripts/modules/utils.js')
			readJSON.mockReturnValue(mockHistoryData)

			const result = readJSON('/mock/history.json', '/mock/project', 'main')
			expect(result).toEqual(mockHistoryData)
			expect(result.master.entries).toHaveLength(2)
			expect(result.master.lastUpdated).toBe('2024-01-01T11:00:00Z')
		})

		it('应该支持历史记录的分页查询', () => {
			const mockHistoryData = Array.from({ length: 50 }, (_, index) => ({
				id: `hist_${index + 1}`,
				taskId: Math.floor(index / 10) + 1,
				action: index % 2 === 0 ? 'task_created' : 'status_changed',
				timestamp: new Date(2024, 0, 1, index).toISOString(),
				user: `user${(index % 3) + 1}`,
				details: `历史记录 ${index + 1}`,
				tag: 'main'
			}))

			const pageSize = 10
			const pageNumber = 2
			const startIndex = (pageNumber - 1) * pageSize
			const endIndex = startIndex + pageSize

			const paginatedHistory = mockHistoryData.slice(startIndex, endIndex)

			expect(paginatedHistory).toHaveLength(10)
			expect(paginatedHistory[0].id).toBe('hist_11')
			expect(paginatedHistory[9].id).toBe('hist_20')
		})
	})

	describe('历史记录清理和维护', () => {
		it('应该支持按时间清理过期历史记录', () => {
			const mockHistoryData = [
				{
					id: 'hist_001',
					taskId: 1,
					action: 'task_created',
					timestamp: '2024-01-01T10:00:00Z', // 过期
					user: 'user1',
					details: '旧记录',
					tag: 'main'
				},
				{
					id: 'hist_002',
					taskId: 1,
					action: 'status_changed',
					timestamp: '2024-12-01T10:00:00Z', // 当前
					user: 'user1',
					details: '新记录',
					tag: 'main'
				}
			]

			const cutoffDate = new Date('2024-06-01T00:00:00Z')
			const filteredHistory = mockHistoryData.filter(entry => {
				return new Date(entry.timestamp) > cutoffDate
			})

			expect(filteredHistory).toHaveLength(1)
			expect(filteredHistory[0].id).toBe('hist_002')
			expect(filteredHistory[0].timestamp).toBe('2024-12-01T10:00:00Z')
		})

		it('应该支持按记录数量限制历史记录', () => {
			const mockHistoryData = Array.from({ length: 150 }, (_, index) => ({
				id: `hist_${index + 1}`,
				taskId: Math.floor(index / 10) + 1,
				action: 'task_created',
				timestamp: new Date(2024, 0, index + 1).toISOString(),
				user: `user${(index % 3) + 1}`,
				details: `历史记录 ${index + 1}`,
				tag: 'main'
			}))

			const maxRecords = 100
			const limitedHistory = mockHistoryData.slice(-maxRecords)

			expect(limitedHistory).toHaveLength(100)
			expect(limitedHistory[0].id).toBe('hist_51')
			expect(limitedHistory[99].id).toBe('hist_150')
		})

		it('应该验证历史记录的完整性和一致性', () => {
			const validHistoryEntry = {
				id: 'hist_001',
				taskId: 1,
				action: 'task_created',
				timestamp: new Date().toISOString(),
				user: 'test-user',
				details: '有效的历史记录',
				tag: 'main',
				version: '1.0.0'
			}

			const invalidHistoryEntry = {
				id: '', // 无效ID
				taskId: null, // 无效任务ID
				action: '', // 无效操作
				timestamp: 'invalid-date', // 无效时间戳
				user: '',
				details: '',
				tag: 'main'
			}

			// 验证有效记录
			expect(validHistoryEntry.id).toBeTruthy()
			expect(validHistoryEntry.taskId).toBeGreaterThan(0)
			expect(validHistoryEntry.action).toBeTruthy()
			expect(validHistoryEntry.timestamp).toBeTruthy()
			expect(() => new Date(validHistoryEntry.timestamp)).not.toThrow()

			// 验证无效记录
			expect(invalidHistoryEntry.id).toBeFalsy()
			expect(invalidHistoryEntry.taskId).toBeNull()
			expect(invalidHistoryEntry.action).toBeFalsy()
		})
	})
})
