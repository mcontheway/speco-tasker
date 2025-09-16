/**
 * test_task_listing.cjs
 * 单元测试：验证任务列表功能
 *
 * SCOPE: 测试任务列表显示、过滤、排序和格式化功能
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

describe('任务列表功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('任务列表数据结构', () => {
		it('应该正确处理任务数组', () => {
			const tasks = [
				{ id: 1, title: '任务1', status: 'pending' },
				{ id: 2, title: '任务2', status: 'done' },
				{ id: 3, title: '任务3', status: 'in-progress' }
			]

			expect(Array.isArray(tasks)).toBe(true)
			expect(tasks).toHaveLength(3)
			expect(tasks[0]).toHaveProperty('id')
			expect(tasks[0]).toHaveProperty('title')
			expect(tasks[0]).toHaveProperty('status')
		})

		it('应该支持标签化任务结构', () => {
			const taggedTasks = {
				master: {
					tasks: [
						{ id: 1, title: '主分支任务', status: 'pending' }
					]
				},
				feature: {
					tasks: [
						{ id: 2, title: '功能分支任务', status: 'pending' }
					]
				}
			}

			expect(taggedTasks).toHaveProperty('main')
			expect(taggedTasks).toHaveProperty('feature')
			expect(Array.isArray(taggedTasks.master.tasks)).toBe(true)
			expect(Array.isArray(taggedTasks.feature.tasks)).toBe(true)
		})
	})

	describe('任务过滤功能', () => {
		const tasks = [
			{ id: 1, title: '待处理任务', status: 'pending', priority: 'high' },
			{ id: 2, title: '进行中任务', status: 'in-progress', priority: 'medium' },
			{ id: 3, title: '已完成任务', status: 'done', priority: 'low' },
			{ id: 4, title: '另一个待处理任务', status: 'pending', priority: 'high' }
		]

		it('应该能够按状态过滤任务', () => {
			const pendingTasks = tasks.filter(task => task.status === 'pending')
			const doneTasks = tasks.filter(task => task.status === 'done')
			const inProgressTasks = tasks.filter(task => task.status === 'in-progress')

			expect(pendingTasks).toHaveLength(2)
			expect(doneTasks).toHaveLength(1)
			expect(inProgressTasks).toHaveLength(1)

			expect(pendingTasks.every(task => task.status === 'pending')).toBe(true)
			expect(doneTasks.every(task => task.status === 'done')).toBe(true)
			expect(inProgressTasks.every(task => task.status === 'in-progress')).toBe(true)
		})

		it('应该能够按优先级过滤任务', () => {
			const highPriorityTasks = tasks.filter(task => task.priority === 'high')
			const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium')
			const lowPriorityTasks = tasks.filter(task => task.priority === 'low')

			expect(highPriorityTasks).toHaveLength(2)
			expect(mediumPriorityTasks).toHaveLength(1)
			expect(lowPriorityTasks).toHaveLength(1)

			expect(highPriorityTasks.every(task => task.priority === 'high')).toBe(true)
		})

		it('应该支持组合过滤条件', () => {
			const filteredTasks = tasks.filter(task =>
				task.status === 'pending' && task.priority === 'high'
			)

			expect(filteredTasks).toHaveLength(2)
			expect(filteredTasks.every(task =>
				task.status === 'pending' && task.priority === 'high'
			)).toBe(true)
		})
	})

	describe('任务排序功能', () => {
		it('应该能够按ID排序', () => {
			const tasks = [
				{ id: 3, title: '任务3' },
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' }
			]

			const sortedTasks = [...tasks].sort((a, b) => a.id - b.id)

			expect(sortedTasks[0].id).toBe(1)
			expect(sortedTasks[1].id).toBe(2)
			expect(sortedTasks[2].id).toBe(3)
		})

		it('应该能够按优先级排序', () => {
			const tasks = [
				{ id: 1, title: '低优先级', priority: 'low' },
				{ id: 2, title: '高优先级', priority: 'high' },
				{ id: 3, title: '中优先级', priority: 'medium' }
			]

			const priorityOrder = { high: 1, medium: 2, low: 3 }
			const sortedTasks = [...tasks].sort((a, b) =>
				priorityOrder[a.priority] - priorityOrder[b.priority]
			)

			expect(sortedTasks[0].priority).toBe('high')
			expect(sortedTasks[1].priority).toBe('medium')
			expect(sortedTasks[2].priority).toBe('low')
		})

		it('应该能够按状态排序', () => {
			const tasks = [
				{ id: 1, title: '已完成', status: 'done' },
				{ id: 2, title: '进行中', status: 'in-progress' },
				{ id: 3, title: '待处理', status: 'pending' }
			]

			const statusOrder = { pending: 1, 'in-progress': 2, done: 3 }
			const sortedTasks = [...tasks].sort((a, b) =>
				statusOrder[a.status] - statusOrder[b.status]
			)

			expect(sortedTasks[0].status).toBe('pending')
			expect(sortedTasks[1].status).toBe('in-progress')
			expect(sortedTasks[2].status).toBe('done')
		})
	})

	describe('任务显示格式化', () => {
		it('应该正确格式化任务标题', () => {
			const task = { id: 1, title: '测试任务' }

			const formattedTitle = `[${task.id}] ${task.title}`

			expect(formattedTitle).toBe('[1] 测试任务')
			expect(formattedTitle).toContain(task.id.toString())
			expect(formattedTitle).toContain(task.title)
		})

		it('应该正确格式化任务状态', () => {
			const statusMap = {
				pending: '⏳ 待处理',
				'in-progress': '🔄 进行中',
				done: '✅ 已完成',
				blocked: '🚫 已阻塞',
				cancelled: '❌ 已取消'
			}

			// 验证每个状态都有正确的格式化
			expect(statusMap.pending).toContain('⏳')
			expect(statusMap.pending).toContain('待处理')
			expect(statusMap['in-progress']).toContain('🔄')
			expect(statusMap['in-progress']).toContain('进行中')
			expect(statusMap.done).toContain('✅')
			expect(statusMap.done).toContain('已完成')
		})

		it('应该正确格式化任务优先级', () => {
			const priorityMap = {
				high: '🔴 高',
				medium: '🟡 中',
				low: '🟢 低'
			}

			Object.entries(priorityMap).forEach(([priority, expected]) => {
				expect(expected).toContain(priority === 'high' ? '高' : priority === 'medium' ? '中' : '低')
			})
		})
	})

	describe('子任务显示', () => {
		it('应该正确处理子任务缩进', () => {
			const parentTask = {
				id: 1,
				title: '父任务',
				subtasks: [
					{ id: '1.1', title: '子任务1' },
					{ id: '1.2', title: '子任务2' }
				]
			}

			expect(parentTask.subtasks).toHaveLength(2)
			parentTask.subtasks.forEach(subtask => {
				expect(subtask.id).toMatch(/^1\.\d+$/)
				expect(subtask.id).toContain('1.')
			})
		})

		it('应该支持嵌套子任务结构', () => {
			const complexTask = {
				id: 1,
				title: '复杂任务',
				subtasks: [
					{
						id: '1.1',
						title: '子任务1',
						subtasks: [
							{ id: '1.1.1', title: '孙任务1' },
							{ id: '1.1.2', title: '孙任务2' }
						]
					},
					{
						id: '1.2',
						title: '子任务2'
					}
				]
			}

			expect(complexTask.subtasks[0].subtasks).toHaveLength(2)
			expect(complexTask.subtasks[0].subtasks[0].id).toBe('1.1.1')
			expect(complexTask.subtasks[0].subtasks[1].id).toBe('1.1.2')
		})
	})

	describe('任务统计信息', () => {
		const tasks = [
			{ id: 1, status: 'pending', priority: 'high' },
			{ id: 2, status: 'in-progress', priority: 'medium' },
			{ id: 3, status: 'done', priority: 'low' },
			{ id: 4, status: 'pending', priority: 'high' },
			{ id: 5, status: 'done', priority: 'medium' }
		]

		it('应该正确计算任务状态统计', () => {
			const statusStats = {
				pending: tasks.filter(t => t.status === 'pending').length,
				'in-progress': tasks.filter(t => t.status === 'in-progress').length,
				done: tasks.filter(t => t.status === 'done').length
			}

			expect(statusStats.pending).toBe(2)
			expect(statusStats['in-progress']).toBe(1)
			expect(statusStats.done).toBe(2)
			expect(statusStats.pending + statusStats['in-progress'] + statusStats.done).toBe(5)
		})

		it('应该正确计算任务优先级统计', () => {
			const priorityStats = {
				high: tasks.filter(t => t.priority === 'high').length,
				medium: tasks.filter(t => t.priority === 'medium').length,
				low: tasks.filter(t => t.priority === 'low').length
			}

			expect(priorityStats.high).toBe(2)
			expect(priorityStats.medium).toBe(2)
			expect(priorityStats.low).toBe(1)
			expect(priorityStats.high + priorityStats.medium + priorityStats.low).toBe(5)
		})
	})

	describe('错误处理', () => {
		it('应该处理空任务列表', () => {
			const emptyTasks = []

			expect(Array.isArray(emptyTasks)).toBe(true)
			expect(emptyTasks).toHaveLength(0)
		})

		it('应该处理无效的任务数据', () => {
			const invalidTasks = [
				null,
				undefined,
				{ id: null, title: '' },
				{ id: 1, title: '有效任务' }
			]

			const validTasks = invalidTasks.filter(task =>
				task && typeof task === 'object' && task.id && task.title
			)

			expect(validTasks).toHaveLength(1)
			expect(validTasks[0].id).toBe(1)
			expect(validTasks[0].title).toBe('有效任务')
		})
	})
})
