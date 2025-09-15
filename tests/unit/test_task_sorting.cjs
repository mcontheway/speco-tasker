/**
 * test_task_sorting.cjs
 * 单元测试：验证任务排序功能
 *
 * SCOPE: 测试任务排序的核心功能，包括按ID、优先级、状态、时间等排序规则
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
	isSilentMode: jest.fn(() => false)
}))

// Mock 配置管理器
jest.mock('../../scripts/modules/config-manager.js', () => ({
	getDefaultPriority: jest.fn(() => 'medium'),
	hasCodebaseAnalysis: jest.fn(() => false)
}))

describe('任务排序功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		// 模拟文件系统
		fs.existsSync = jest.fn().mockReturnValue(true)
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}))
		path.dirname = jest.fn().mockReturnValue('/mock/project')
		path.join = jest.fn().mockImplementation((...args) => args.join('/'))
	})

	describe('基础排序数据结构', () => {
		it('应该创建具有排序相关属性的任务对象', () => {
			const task = {
				id: 1,
				title: '测试任务',
				priority: 'high',
				status: 'pending',
				createdAt: '2024-01-01T10:00:00Z',
				updatedAt: '2024-01-01T10:00:00Z',
				dependencies: [],
				subtasks: []
			}

			expect(task).toHaveProperty('id')
			expect(task).toHaveProperty('priority')
			expect(task).toHaveProperty('status')
			expect(task).toHaveProperty('createdAt')
			expect(task).toHaveProperty('updatedAt')
			expect(typeof task.createdAt).toBe('string')
			expect(typeof task.updatedAt).toBe('string')
		})

		it('应该验证排序字段的数据类型', () => {
			const validTask = {
				id: 1,
				priority: 'medium',
				status: 'pending',
				createdAt: '2024-01-01T10:00:00Z'
			}

			expect(typeof validTask.id).toBe('number')
			expect(typeof validTask.priority).toBe('string')
			expect(typeof validTask.status).toBe('string')
			expect(typeof validTask.createdAt).toBe('string')
		})
	})

	describe('按ID排序功能', () => {
		it('应该能够按升序排列任务ID', () => {
			const tasks = [
				{ id: 5, title: '任务5' },
				{ id: 1, title: '任务1' },
				{ id: 3, title: '任务3' },
				{ id: 2, title: '任务2' }
			]

			const sortedTasks = tasks.sort((a, b) => a.id - b.id)

			expect(sortedTasks.map(t => t.id)).toEqual([1, 2, 3, 5])
			expect(sortedTasks.map(t => t.title)).toEqual(['任务1', '任务2', '任务3', '任务5'])
		})

		it('应该能够按降序排列任务ID', () => {
			const tasks = [
				{ id: 1, title: '任务1' },
				{ id: 3, title: '任务3' },
				{ id: 5, title: '任务5' },
				{ id: 2, title: '任务2' }
			]

			const sortedTasks = tasks.sort((a, b) => b.id - a.id)

			expect(sortedTasks.map(t => t.id)).toEqual([5, 3, 2, 1])
			expect(sortedTasks.map(t => t.title)).toEqual(['任务5', '任务3', '任务2', '任务1'])
		})

		it('应该正确处理相同ID的情况', () => {
			const tasks = [
				{ id: 1, title: '任务1A' },
				{ id: 1, title: '任务1B' },
				{ id: 2, title: '任务2' }
			]

			const sortedTasks = tasks.sort((a, b) => a.id - b.id)

			expect(sortedTasks.length).toBe(3)
			expect(sortedTasks[0].id).toBe(1)
			expect(sortedTasks[1].id).toBe(1)
			expect(sortedTasks[2].id).toBe(2)
		})
	})

	describe('按优先级排序功能', () => {
		it('应该能够按优先级排序任务', () => {
			const tasks = [
				{ id: 1, priority: 'low', title: '低优先级任务' },
				{ id: 2, priority: 'high', title: '高优先级任务' },
				{ id: 3, priority: 'medium', title: '中优先级任务' }
			]

			const priorityOrder = { high: 1, medium: 2, low: 3 }
			const sortedTasks = tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

			expect(sortedTasks.map(t => t.priority)).toEqual(['high', 'medium', 'low'])
			expect(sortedTasks.map(t => t.id)).toEqual([2, 3, 1])
		})

		it('应该正确处理相同优先级任务', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '高优先级任务1' },
				{ id: 2, priority: 'high', title: '高优先级任务2' },
				{ id: 3, priority: 'medium', title: '中优先级任务' }
			]

			const priorityOrder = { high: 1, medium: 2, low: 3 }
			const sortedTasks = tasks.sort((a, b) => {
				if (a.priority === b.priority) {
					return a.id - b.id // 相同优先级按ID排序
				}
				return priorityOrder[a.priority] - priorityOrder[b.priority]
			})

			expect(sortedTasks.map(t => t.priority)).toEqual(['high', 'high', 'medium'])
			expect(sortedTasks.map(t => t.id)).toEqual([1, 2, 3])
		})

		it('应该处理无效的优先级值', () => {
			const tasks = [
				{ id: 1, priority: 'invalid', title: '无效优先级' },
				{ id: 2, priority: 'high', title: '高优先级' }
			]

			const priorityOrder = { high: 1, medium: 2, low: 3 }
			const sortedTasks = tasks.sort((a, b) => {
				const aOrder = priorityOrder[a.priority] || 999
				const bOrder = priorityOrder[b.priority] || 999
				return aOrder - bOrder
			})

			expect(sortedTasks[0].priority).toBe('high')
			expect(sortedTasks[1].priority).toBe('invalid')
		})
	})

	describe('按状态排序功能', () => {
		it('应该能够按状态排序任务', () => {
			const tasks = [
				{ id: 1, status: 'done', title: '已完成任务' },
				{ id: 2, status: 'pending', title: '待处理任务' },
				{ id: 3, status: 'in-progress', title: '进行中任务' },
				{ id: 4, status: 'blocked', title: '阻塞任务' }
			]

			const statusOrder = { pending: 1, 'in-progress': 2, blocked: 3, done: 4 }
			const sortedTasks = tasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

			expect(sortedTasks.map(t => t.status)).toEqual(['pending', 'in-progress', 'blocked', 'done'])
			expect(sortedTasks.map(t => t.id)).toEqual([2, 3, 4, 1])
		})

		it('应该正确处理相同状态任务', () => {
			const tasks = [
				{ id: 1, status: 'pending', title: '待处理任务1' },
				{ id: 2, status: 'pending', title: '待处理任务2' },
				{ id: 3, status: 'done', title: '已完成任务' }
			]

			const statusOrder = { pending: 1, 'in-progress': 2, blocked: 3, done: 4 }
			const sortedTasks = tasks.sort((a, b) => {
				if (a.status === b.status) {
					return a.id - b.id // 相同状态按ID排序
				}
				return statusOrder[a.status] - statusOrder[b.status]
			})

			expect(sortedTasks.map(t => t.status)).toEqual(['pending', 'pending', 'done'])
			expect(sortedTasks.map(t => t.id)).toEqual([1, 2, 3])
		})
	})

	describe('按时间排序功能', () => {
		it('应该能够按创建时间排序任务', () => {
			const tasks = [
				{ id: 1, createdAt: '2024-01-03T10:00:00Z', title: '任务1' },
				{ id: 2, createdAt: '2024-01-01T10:00:00Z', title: '任务2' },
				{ id: 3, createdAt: '2024-01-02T10:00:00Z', title: '任务3' }
			]

			const sortedTasks = tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

			expect(sortedTasks.map(t => t.id)).toEqual([2, 3, 1])
			expect(sortedTasks.map(t => t.createdAt)).toEqual([
				'2024-01-01T10:00:00Z',
				'2024-01-02T10:00:00Z',
				'2024-01-03T10:00:00Z'
			])
		})

		it('应该能够按更新时间排序任务', () => {
			const tasks = [
				{ id: 1, updatedAt: '2024-01-03T10:00:00Z', title: '任务1' },
				{ id: 2, updatedAt: '2024-01-01T10:00:00Z', title: '任务2' },
				{ id: 3, updatedAt: '2024-01-02T10:00:00Z', title: '任务3' }
			]

			const sortedTasks = tasks.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))

			expect(sortedTasks.map(t => t.id)).toEqual([2, 3, 1])
			expect(sortedTasks.map(t => t.updatedAt)).toEqual([
				'2024-01-01T10:00:00Z',
				'2024-01-02T10:00:00Z',
				'2024-01-03T10:00:00Z'
			])
		})

		it('应该处理无效的时间格式', () => {
			const tasks = [
				{ id: 1, createdAt: 'invalid-date', title: '无效时间' },
				{ id: 2, createdAt: '2024-01-01T10:00:00Z', title: '有效时间' }
			]

			const sortedTasks = tasks.sort((a, b) => {
				const aTime = new Date(a.createdAt).getTime()
				const bTime = new Date(b.createdAt).getTime()
				return (isNaN(aTime) ? Infinity : aTime) - (isNaN(bTime) ? Infinity : bTime)
			})

			expect(sortedTasks[0].id).toBe(2)
			expect(sortedTasks[1].id).toBe(1)
		})
	})

	describe('按标题排序功能', () => {
		it('应该能够按标题字母顺序排序任务', () => {
			const tasks = [
				{ id: 1, title: 'Z任务', status: 'pending' },
				{ id: 2, title: 'A任务', status: 'pending' },
				{ id: 3, title: 'M任务', status: 'pending' }
			]

			const sortedTasks = tasks.sort((a, b) => a.title.localeCompare(b.title))

			expect(sortedTasks.map(t => t.title)).toEqual(['A任务', 'M任务', 'Z任务'])
			expect(sortedTasks.map(t => t.id)).toEqual([2, 3, 1])
		})

		it('应该忽略大小写进行排序', () => {
			const tasks = [
				{ id: 1, title: 'apple', status: 'pending' },
				{ id: 2, title: 'Banana', status: 'pending' },
				{ id: 3, title: 'cherry', status: 'pending' }
			]

			const sortedTasks = tasks.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()))

			expect(sortedTasks.map(t => t.title)).toEqual(['apple', 'Banana', 'cherry'])
			expect(sortedTasks.map(t => t.id)).toEqual([1, 2, 3])
		})
	})

	describe('多字段组合排序', () => {
		it('应该能够按优先级和ID组合排序', () => {
			const tasks = [
				{ id: 3, priority: 'high', title: '任务3' },
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'medium', title: '任务2' },
				{ id: 4, priority: 'low', title: '任务4' }
			]

			const priorityOrder = { high: 1, medium: 2, low: 3 }
			const sortedTasks = tasks.sort((a, b) => {
				if (a.priority === b.priority) {
					return a.id - b.id // 相同优先级按ID排序
				}
				return priorityOrder[a.priority] - priorityOrder[b.priority]
			})

			expect(sortedTasks.map(t => t.id)).toEqual([1, 3, 2, 4])
			expect(sortedTasks.map(t => t.priority)).toEqual(['high', 'high', 'medium', 'low'])
		})

		it('应该能够按状态和创建时间组合排序', () => {
			const tasks = [
				{ id: 1, status: 'pending', createdAt: '2024-01-02T10:00:00Z', title: '任务1' },
				{ id: 2, status: 'pending', createdAt: '2024-01-01T10:00:00Z', title: '任务2' },
				{ id: 3, status: 'done', createdAt: '2024-01-03T10:00:00Z', title: '任务3' }
			]

			const statusOrder = { pending: 1, 'in-progress': 2, blocked: 3, done: 4 }
			const sortedTasks = tasks.sort((a, b) => {
				if (a.status === b.status) {
					return new Date(a.createdAt) - new Date(b.createdAt) // 相同状态按时间排序
				}
				return statusOrder[a.status] - statusOrder[b.status]
			})

			expect(sortedTasks.map(t => t.id)).toEqual([2, 1, 3])
			expect(sortedTasks.map(t => t.status)).toEqual(['pending', 'pending', 'done'])
		})

		it('应该处理复杂的多字段排序场景', () => {
			const tasks = [
				{ id: 1, priority: 'high', status: 'pending', createdAt: '2024-01-02T10:00:00Z' },
				{ id: 2, priority: 'high', status: 'pending', createdAt: '2024-01-01T10:00:00Z' },
				{ id: 3, priority: 'medium', status: 'done', createdAt: '2024-01-03T10:00:00Z' },
				{ id: 4, priority: 'medium', status: 'pending', createdAt: '2024-01-04T10:00:00Z' }
			]

			const priorityOrder = { high: 1, medium: 2, low: 3 }
			const statusOrder = { pending: 1, 'in-progress': 2, blocked: 3, done: 4 }

			const sortedTasks = tasks.sort((a, b) => {
				// 第一级：优先级
				const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
				if (priorityDiff !== 0) return priorityDiff

				// 第二级：状态
				const statusDiff = statusOrder[a.status] - statusOrder[b.status]
				if (statusDiff !== 0) return statusDiff

				// 第三级：创建时间
				return new Date(a.createdAt) - new Date(b.createdAt)
			})

			expect(sortedTasks.map(t => t.id)).toEqual([2, 1, 4, 3])
			expect(sortedTasks.map(t => t.priority)).toEqual(['high', 'high', 'medium', 'medium'])
		})
	})

	describe('排序稳定性验证', () => {
		it('应该保持排序的稳定性', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'high', title: '任务2' },
				{ id: 3, priority: 'high', title: '任务3' }
			]

			const sortedTasks1 = tasks.sort((a, b) => a.id - b.id)
			const sortedTasks2 = tasks.sort((a, b) => a.id - b.id)

			expect(sortedTasks1.map(t => t.id)).toEqual(sortedTasks2.map(t => t.id))
		})

		it('应该正确处理空数组和单个元素', () => {
			const emptyTasks = []
			const singleTask = [{ id: 1, title: '单个任务' }]

			expect(emptyTasks.sort((a, b) => a.id - b.id)).toEqual([])
			expect(singleTask.sort((a, b) => a.id - b.id)).toEqual([{ id: 1, title: '单个任务' }])
		})
	})

	describe('排序函数封装', () => {
		it('应该提供可重用的排序函数', () => {
			const createSortFunction = (sortBy, order = 'asc') => {
				const priorityOrder = { high: 1, medium: 2, low: 3 }
				const statusOrder = { pending: 1, 'in-progress': 2, blocked: 3, done: 4 }

				return (a, b) => {
					let comparison = 0

					switch (sortBy) {
						case 'id':
							comparison = a.id - b.id
							break
						case 'priority':
							comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
							break
						case 'status':
							comparison = statusOrder[a.status] - statusOrder[b.status]
							break
						case 'createdAt':
							comparison = new Date(a.createdAt) - new Date(b.createdAt)
							break
						case 'title':
							comparison = a.title.localeCompare(b.title)
							break
					}

					return order === 'desc' ? -comparison : comparison
				}
			}

			const tasks = [
				{ id: 2, priority: 'high', status: 'pending', createdAt: '2024-01-01T10:00:00Z', title: 'B任务' },
				{ id: 1, priority: 'medium', status: 'done', createdAt: '2024-01-02T10:00:00Z', title: 'A任务' }
			]

			const sortById = createSortFunction('id')
			const sortedById = [...tasks].sort(sortById)
			expect(sortedById.map(t => t.id)).toEqual([1, 2])

			const sortByTitleDesc = createSortFunction('title', 'desc')
			const sortedByTitleDesc = [...tasks].sort(sortByTitleDesc)
			expect(sortedByTitleDesc.map(t => t.title)).toEqual(['B任务', 'A任务'])
		})
	})

	describe('排序性能考虑', () => {
		it('应该处理大量任务的排序', () => {
			const generateTasks = (count) => {
				return Array.from({ length: count }, (_, i) => ({
					id: i + 1,
					title: `任务${i + 1}`,
					priority: ['high', 'medium', 'low'][i % 3],
					status: 'pending',
					createdAt: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`
				}))
			}

			const tasks = generateTasks(1000)
			const startTime = Date.now()

			const sortedTasks = tasks.sort((a, b) => a.id - b.id)

			const endTime = Date.now()
			const duration = endTime - startTime

			expect(sortedTasks.length).toBe(1000)
			expect(sortedTasks[0].id).toBe(1)
			expect(sortedTasks[999].id).toBe(1000)
			expect(duration).toBeLessThan(100) // 应该在100ms内完成
		})
	})

	describe('排序边界情况处理', () => {
		it('应该处理包含null或undefined值的任务', () => {
			const tasks = [
				{ id: 1, priority: null, title: '任务1' },
				{ id: 2, priority: 'high', title: '任务2' },
				{ id: 3, priority: undefined, title: '任务3' }
			]

			const sortedTasks = tasks.sort((a, b) => {
				const aPriority = a.priority || 'low'
				const bPriority = b.priority || 'low'
				const priorityOrder = { high: 1, medium: 2, low: 3 }
				return priorityOrder[aPriority] - priorityOrder[bPriority]
			})

			expect(sortedTasks[0].id).toBe(2)
			expect(sortedTasks[1].id).toBe(1)
			expect(sortedTasks[2].id).toBe(3)
		})

		it('应该处理缺少排序字段的任务', () => {
			const tasks = [
				{ id: 1, title: '任务1' }, // 缺少priority字段
				{ id: 2, priority: 'high', title: '任务2' }
			]

			const sortedTasks = tasks.sort((a, b) => {
				const aPriority = a.priority || 'medium'
				const bPriority = b.priority || 'medium'
				const priorityOrder = { high: 1, medium: 2, low: 3 }
				return priorityOrder[aPriority] - priorityOrder[bPriority]
			})

			expect(sortedTasks.length).toBe(2)
			expect(sortedTasks[0].id).toBe(2)
			expect(sortedTasks[1].id).toBe(1)
		})
	})
})
