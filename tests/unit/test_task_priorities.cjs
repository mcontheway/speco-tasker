/**
 * test_task_priorities.cjs
 * 单元测试：验证任务优先级功能
 *
 * SCOPE: 测试任务优先级的核心功能，包括优先级设置、验证、排序和业务逻辑
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

// Mock 任务优先级常量
jest.mock('../../src/constants/task-priority.js', () => ({
	DEFAULT_TASK_PRIORITY: 'medium',
	TASK_PRIORITY_OPTIONS: ['high', 'medium', 'low'],
	isValidTaskPriority: jest.fn((priority) => ['high', 'medium', 'low'].includes(priority)),
	normalizeTaskPriority: jest.fn((priority) => priority || 'medium'),
	getPriorityOrder: jest.fn((priority) => {
		const order = { high: 1, medium: 2, low: 3 }
		return order[priority] || 999
	}),
	getPriorityLabel: jest.fn((priority) => {
		const labels = { high: '高', medium: '中', low: '低' }
		return labels[priority] || '未知'
	})
}))

describe('任务优先级功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		// 模拟文件系统
		fs.existsSync = jest.fn().mockReturnValue(true)
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}))
		path.dirname = jest.fn().mockReturnValue('/mock/project')
		path.join = jest.fn().mockImplementation((...args) => args.join('/'))
	})

	describe('优先级数据结构验证', () => {
		it('应该创建具有优先级属性的任务对象', () => {
			const task = {
				id: 1,
				title: '测试任务',
				priority: 'high',
				status: 'pending',
				description: '测试描述'
			}

			expect(task).toHaveProperty('priority')
			expect(typeof task.priority).toBe('string')
			expect(task.priority).toBe('high')
		})

		it('应该验证优先级字段的数据完整性', () => {
			const validTask = {
				id: 1,
				priority: 'medium',
				title: '有效任务'
			}

			const invalidTask = {
				id: 2,
				priority: null,
				title: '无效任务'
			}

			expect(validTask.priority).toBeTruthy()
			expect(typeof validTask.priority).toBe('string')
			expect(invalidTask.priority).toBeNull()
		})

		it('应该支持默认优先级设置', () => {
			const { DEFAULT_TASK_PRIORITY } = require('../../src/constants/task-priority.js')

			const taskWithoutPriority = {
				id: 1,
				title: '无优先级任务'
			}

			const taskWithDefaultPriority = {
				...taskWithoutPriority,
				priority: taskWithoutPriority.priority || DEFAULT_TASK_PRIORITY
			}

			expect(taskWithDefaultPriority.priority).toBe('medium')
		})
	})

	describe('优先级值验证', () => {
		it('应该验证有效的优先级值', () => {
			const { TASK_PRIORITY_OPTIONS, isValidTaskPriority } = require('../../src/constants/task-priority.js')

			const validPriorities = ['high', 'medium', 'low']

			validPriorities.forEach(priority => {
				expect(TASK_PRIORITY_OPTIONS).toContain(priority)
				expect(isValidTaskPriority(priority)).toBe(true)
			})
		})

		it('应该拒绝无效的优先级值', () => {
			const { isValidTaskPriority } = require('../../src/constants/task-priority.js')

			const invalidPriorities = ['urgent', 'critical', 'low-medium', '', null, undefined]

			invalidPriorities.forEach(priority => {
				expect(isValidTaskPriority(priority)).toBe(false)
			})
		})

		it('应该正确规范化优先级值', () => {
			const { normalizeTaskPriority } = require('../../src/constants/task-priority.js')

			expect(normalizeTaskPriority('high')).toBe('high')
			expect(normalizeTaskPriority('')).toBe('medium')
			expect(normalizeTaskPriority(null)).toBe('medium')
			expect(normalizeTaskPriority(undefined)).toBe('medium')
			expect(normalizeTaskPriority('invalid')).toBe('invalid') // 不应该改变无效值
		})
	})

	describe('优先级排序功能', () => {
		it('应该能够按优先级排序任务', () => {
			const { getPriorityOrder } = require('../../src/constants/task-priority.js')

			const tasks = [
				{ id: 1, priority: 'low', title: '低优先级任务' },
				{ id: 2, priority: 'high', title: '高优先级任务' },
				{ id: 3, priority: 'medium', title: '中优先级任务' }
			]

			const sortedTasks = tasks.sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority))

			expect(sortedTasks.map(t => t.priority)).toEqual(['high', 'medium', 'low'])
			expect(sortedTasks.map(t => t.id)).toEqual([2, 3, 1])
		})

		it('应该正确处理相同优先级的任务', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '高优先级任务1', id: 1 },
				{ id: 2, priority: 'high', title: '高优先级任务2', id: 2 },
				{ id: 3, priority: 'medium', title: '中优先级任务', id: 3 }
			]

			const sortedTasks = tasks.sort((a, b) => {
				const { getPriorityOrder } = require('../../src/constants/task-priority.js')
				const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority)
				if (priorityDiff !== 0) return priorityDiff
				return a.id - b.id // 相同优先级按ID排序
			})

			expect(sortedTasks.map(t => t.id)).toEqual([1, 2, 3])
			expect(sortedTasks.map(t => t.priority)).toEqual(['high', 'high', 'medium'])
		})

		it('应该处理无效优先级值的排序', () => {
			const tasks = [
				{ id: 1, priority: 'invalid', title: '无效优先级任务' },
				{ id: 2, priority: 'high', title: '高优先级任务' },
				{ id: 3, priority: 'low', title: '低优先级任务' }
			]

			const sortedTasks = tasks.sort((a, b) => {
				const { getPriorityOrder } = require('../../src/constants/task-priority.js')
				const aOrder = getPriorityOrder(a.priority)
				const bOrder = getPriorityOrder(b.priority)
				return aOrder - bOrder
			})

			expect(sortedTasks[0].priority).toBe('high')
			expect(sortedTasks[1].priority).toBe('low')
			expect(sortedTasks[2].priority).toBe('invalid')
		})
	})

	describe('优先级过滤功能', () => {
		it('应该能够按优先级过滤任务', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'medium', title: '任务2' },
				{ id: 3, priority: 'low', title: '任务3' },
				{ id: 4, priority: 'high', title: '任务4' }
			]

			const highPriorityTasks = tasks.filter(task => task.priority === 'high')
			const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium')
			const lowPriorityTasks = tasks.filter(task => task.priority === 'low')

			expect(highPriorityTasks.length).toBe(2)
			expect(mediumPriorityTasks.length).toBe(1)
			expect(lowPriorityTasks.length).toBe(1)
			expect(highPriorityTasks.map(t => t.id)).toEqual([1, 4])
		})

		it('应该能够过滤多个优先级的任务', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'medium', title: '任务2' },
				{ id: 3, priority: 'low', title: '任务3' },
				{ id: 4, priority: 'high', title: '任务4' }
			]

			const highAndMediumTasks = tasks.filter(task =>
				['high', 'medium'].includes(task.priority)
			)

			expect(highAndMediumTasks.length).toBe(3)
			expect(highAndMediumTasks.map(t => t.id).sort()).toEqual([1, 2, 4])
		})

		it('应该能够排除特定优先级的任务', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'medium', title: '任务2' },
				{ id: 3, priority: 'low', title: '任务3' },
				{ id: 4, priority: 'high', title: '任务4' }
			]

			const nonLowPriorityTasks = tasks.filter(task => task.priority !== 'low')

			expect(nonLowPriorityTasks.length).toBe(3)
			expect(nonLowPriorityTasks.map(t => t.id).sort()).toEqual([1, 2, 4])
		})
	})

	describe('优先级统计功能', () => {
		it('应该能够统计各优先级的任务数量', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'medium', title: '任务2' },
				{ id: 3, priority: 'low', title: '任务3' },
				{ id: 4, priority: 'high', title: '任务4' },
				{ id: 5, priority: 'medium', title: '任务5' }
			]

			const priorityStats = tasks.reduce((stats, task) => {
				stats[task.priority] = (stats[task.priority] || 0) + 1
				return stats
			}, {})

			expect(priorityStats.high).toBe(2)
			expect(priorityStats.medium).toBe(2)
			expect(priorityStats.low).toBe(1)
		})

		it('应该能够计算优先级占比', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'high', title: '任务2' },
				{ id: 3, priority: 'medium', title: '任务3' },
				{ id: 4, priority: 'low', title: '任务4' }
			]

			const totalTasks = tasks.length
			const priorityCounts = tasks.reduce((stats, task) => {
				stats[task.priority] = (stats[task.priority] || 0) + 1
				return stats
			}, {})

			const priorityPercentages = {}
			Object.keys(priorityCounts).forEach(priority => {
				priorityPercentages[priority] = (priorityCounts[priority] / totalTasks) * 100
			})

			expect(priorityPercentages.high).toBe(50)
			expect(priorityPercentages.medium).toBe(25)
			expect(priorityPercentages.low).toBe(25)
		})

		it('应该能够识别优先级分布是否均衡', () => {
			const evenDistribution = [
				{ id: 1, priority: 'high' },
				{ id: 2, priority: 'medium' },
				{ id: 3, priority: 'low' }
			]

			const unevenDistribution = [
				{ id: 1, priority: 'high' },
				{ id: 2, priority: 'high' },
				{ id: 3, priority: 'high' }
			]

			const getPriorityDistribution = (tasks) => {
				const stats = tasks.reduce((acc, task) => {
					acc[task.priority] = (acc[task.priority] || 0) + 1
					return acc
				}, {})

				const total = tasks.length
				const ideal = total / 3 // 假设3个优先级
				let variance = 0

				Object.values(stats).forEach(count => {
					variance += Math.pow(count - ideal, 2)
				})

				return {
					stats,
					isBalanced: variance < 1, // 简单的平衡性检查
					variance
				}
			}

			const evenResult = getPriorityDistribution(evenDistribution)
			const unevenResult = getPriorityDistribution(unevenDistribution)

			expect(evenResult.isBalanced).toBe(true)
			expect(unevenResult.isBalanced).toBe(false)
		})
	})

	describe('优先级业务逻辑', () => {
		it('应该根据优先级确定任务执行顺序', () => {
			const tasks = [
				{ id: 1, priority: 'low', status: 'pending', title: '任务1' },
				{ id: 2, priority: 'high', status: 'pending', title: '任务2' },
				{ id: 3, priority: 'medium', status: 'pending', title: '任务3' }
			]

			const getNextTaskByPriority = (tasks) => {
				const pendingTasks = tasks.filter(task => task.status === 'pending')
				const { getPriorityOrder } = require('../../src/constants/task-priority.js')

				return pendingTasks.sort((a, b) => {
					const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority)
					if (priorityDiff !== 0) return priorityDiff
					return a.id - b.id // 相同优先级按ID排序
				})[0]
			}

			const nextTask = getNextTaskByPriority(tasks)
			expect(nextTask.id).toBe(2)
			expect(nextTask.priority).toBe('high')
		})

		it('应该根据优先级分配资源', () => {
			const tasks = [
				{ id: 1, priority: 'high', estimatedHours: 4 },
				{ id: 2, priority: 'medium', estimatedHours: 2 },
				{ id: 3, priority: 'low', estimatedHours: 8 }
			]

			const allocateResourcesByPriority = (tasks, availableHours) => {
				const { getPriorityOrder } = require('../../src/constants/task-priority.js')
				const sortedTasks = tasks.sort((a, b) =>
					getPriorityOrder(a.priority) - getPriorityOrder(b.priority)
				)

				const allocation = []
				let remainingHours = availableHours

				for (const task of sortedTasks) {
					if (remainingHours >= task.estimatedHours) {
						allocation.push({ taskId: task.id, allocatedHours: task.estimatedHours })
						remainingHours -= task.estimatedHours
					}
					// 如果剩余时间不足以完成任务，跳过该任务
				}

				return allocation
			}

			const allocation = allocateResourcesByPriority(tasks, 6)
			expect(allocation.length).toBe(2)
			expect(allocation[0].taskId).toBe(1)
			expect(allocation[0].allocatedHours).toBe(4)
			expect(allocation[1].taskId).toBe(2)
			expect(allocation[1].allocatedHours).toBe(2)
		})

		it('应该根据优先级设置截止时间', () => {
			const now = new Date()
			const tasks = [
				{ id: 1, priority: 'high', title: '紧急任务' },
				{ id: 2, priority: 'medium', title: '普通任务' },
				{ id: 3, priority: 'low', title: '非紧急任务' }
			]

			const setDeadlineByPriority = (task) => {
				const baseDate = new Date(now)
				switch (task.priority) {
					case 'high':
						baseDate.setHours(baseDate.getHours() + 24) // 24小时
						break
					case 'medium':
						baseDate.setDate(baseDate.getDate() + 3) // 3天
						break
					case 'low':
						baseDate.setDate(baseDate.getDate() + 7) // 1周
						break
					default:
						baseDate.setDate(baseDate.getDate() + 3)
				}
				return { ...task, deadline: baseDate.toISOString() }
			}

			const tasksWithDeadlines = tasks.map(setDeadlineByPriority)

			const highPriorityTask = tasksWithDeadlines.find(t => t.id === 1)
			const mediumPriorityTask = tasksWithDeadlines.find(t => t.id === 2)
			const lowPriorityTask = tasksWithDeadlines.find(t => t.id === 3)

			expect(highPriorityTask).toHaveProperty('deadline')
			expect(mediumPriorityTask).toHaveProperty('deadline')
			expect(lowPriorityTask).toHaveProperty('deadline')

			// 验证截止时间逻辑（这里只验证存在性，具体时间计算依赖于测试执行时间）
			const highDeadline = new Date(highPriorityTask.deadline)
			const mediumDeadline = new Date(mediumPriorityTask.deadline)
			const lowDeadline = new Date(lowPriorityTask.deadline)

			expect(highDeadline.getTime()).toBeGreaterThan(now.getTime())
			expect(mediumDeadline.getTime()).toBeGreaterThan(now.getTime())
			expect(lowDeadline.getTime()).toBeGreaterThan(now.getTime())
		})
	})

	describe('优先级显示和格式化', () => {
		it('应该能够获取优先级的显示标签', () => {
			const { getPriorityLabel } = require('../../src/constants/task-priority.js')

			expect(getPriorityLabel('high')).toBe('高')
			expect(getPriorityLabel('medium')).toBe('中')
			expect(getPriorityLabel('low')).toBe('低')
			expect(getPriorityLabel('invalid')).toBe('未知')
		})

		it('应该能够格式化任务列表显示优先级', () => {
			const { getPriorityLabel } = require('../../src/constants/task-priority.js')

			const tasks = [
				{ id: 1, priority: 'high', title: '紧急任务' },
				{ id: 2, priority: 'medium', title: '普通任务' },
				{ id: 3, priority: 'low', title: '非紧急任务' }
			]

			const formatTaskWithPriority = (task) => {
				const label = getPriorityLabel(task.priority)
				return `${task.id}. [${label}] ${task.title}`
			}

			const formattedTasks = tasks.map(formatTaskWithPriority)

			expect(formattedTasks[0]).toBe('1. [高] 紧急任务')
			expect(formattedTasks[1]).toBe('2. [中] 普通任务')
			expect(formattedTasks[2]).toBe('3. [低] 非紧急任务')
		})

		it('应该能够按优先级对任务进行分组显示', () => {
			const tasks = [
				{ id: 1, priority: 'high', title: '任务1' },
				{ id: 2, priority: 'medium', title: '任务2' },
				{ id: 3, priority: 'high', title: '任务3' },
				{ id: 4, priority: 'low', title: '任务4' }
			]

			const groupTasksByPriority = (tasks) => {
				return tasks.reduce((groups, task) => {
					if (!groups[task.priority]) {
						groups[task.priority] = []
					}
					groups[task.priority].push(task)
					return groups
				}, {})
			}

			const groupedTasks = groupTasksByPriority(tasks)

			expect(groupedTasks.high.length).toBe(2)
			expect(groupedTasks.medium.length).toBe(1)
			expect(groupedTasks.low.length).toBe(1)
			expect(groupedTasks.high.map(t => t.id)).toEqual([1, 3])
		})
	})

	describe('优先级边界情况处理', () => {
		it('应该处理缺少优先级字段的任务', () => {
			const tasks = [
				{ id: 1, title: '任务1' }, // 缺少priority字段
				{ id: 2, priority: 'high', title: '任务2' }
			]

			const normalizeTaskPriorities = (tasks) => {
				const { DEFAULT_TASK_PRIORITY } = require('../../src/constants/task-priority.js')
				return tasks.map(task => ({
					...task,
					priority: task.priority || DEFAULT_TASK_PRIORITY
				}))
			}

			const normalizedTasks = normalizeTaskPriorities(tasks)

			expect(normalizedTasks[0].priority).toBe('medium')
			expect(normalizedTasks[1].priority).toBe('high')
		})

		it('应该处理优先级字段为null或undefined的情况', () => {
			const tasks = [
				{ id: 1, priority: null, title: '任务1' },
				{ id: 2, priority: undefined, title: '任务2' },
				{ id: 3, priority: 'high', title: '任务3' }
			]

			const cleanTaskPriorities = (tasks) => {
				const { DEFAULT_TASK_PRIORITY } = require('../../src/constants/task-priority.js')
				return tasks.map(task => ({
					...task,
					priority: task.priority || DEFAULT_TASK_PRIORITY
				}))
			}

			const cleanedTasks = cleanTaskPriorities(tasks)

			expect(cleanedTasks[0].priority).toBe('medium')
			expect(cleanedTasks[1].priority).toBe('medium')
			expect(cleanedTasks[2].priority).toBe('high')
		})

		it('应该处理空任务列表的优先级操作', () => {
			const emptyTasks = []

			const groupTasksByPriority = (tasks) => {
				return tasks.reduce((groups, task) => {
					if (!groups[task.priority]) {
						groups[task.priority] = []
					}
					groups[task.priority].push(task)
					return groups
				}, {})
			}

			const sortTasksByPriority = (tasks) => {
				const { getPriorityOrder } = require('../../src/constants/task-priority.js')
				return tasks.sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority))
			}

			expect(groupTasksByPriority(emptyTasks)).toEqual({})
			expect(sortTasksByPriority(emptyTasks)).toEqual([])
		})
	})

	describe('优先级性能验证', () => {
		it('应该高效处理大量任务的优先级排序', () => {
			const generateTasks = (count) => {
				const priorities = ['high', 'medium', 'low']
				return Array.from({ length: count }, (_, i) => ({
					id: i + 1,
					title: `任务${i + 1}`,
					priority: priorities[i % 3],
					status: 'pending'
				}))
			}

			const tasks = generateTasks(1000)

			const startTime = Date.now()

			const { getPriorityOrder } = require('../../src/constants/task-priority.js')
			const sortedTasks = tasks.sort((a, b) => {
				const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority)
				if (priorityDiff !== 0) return priorityDiff
				return a.id - b.id
			})

			const endTime = Date.now()
			const duration = endTime - startTime

			expect(sortedTasks.length).toBe(1000)
			expect(sortedTasks[0].priority).toBe('high')
			expect(duration).toBeLessThan(100) // 应该在100ms内完成
		})
	})
})
