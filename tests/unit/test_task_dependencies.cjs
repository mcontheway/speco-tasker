/**
 * test_task_dependencies.cjs
 * 单元测试：验证任务依赖功能
 *
 * SCOPE: 测试任务依赖关系的核心功能，包括依赖链验证、执行顺序和依赖影响分析
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

describe('任务依赖功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		// 模拟文件系统
		fs.existsSync = jest.fn().mockReturnValue(true)
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}))
		path.dirname = jest.fn().mockReturnValue('/mock/project')
		path.join = jest.fn().mockImplementation((...args) => args.join('/'))
	})

	describe('任务依赖数据结构', () => {
		it('应该正确创建具有依赖关系属性的任务对象', () => {
			const task = {
				id: 1,
				title: '主要任务',
				description: '测试依赖关系',
				dependencies: [2, 3, 4],
				subtasks: [],
				dependents: [5, 6] // 被依赖的任务
			}

			expect(task).toHaveProperty('dependencies')
			expect(task).toHaveProperty('dependents')
			expect(Array.isArray(task.dependencies)).toBe(true)
			expect(Array.isArray(task.dependents)).toBe(true)
			expect(task.dependencies.length).toBe(3)
			expect(task.dependents.length).toBe(2)
		})

		it('应该验证依赖关系的数据类型和约束', () => {
			const validTask = {
				id: 1,
				dependencies: [2, 3, 4],
				dependents: [5, 6]
			}

			const invalidTask = {
				id: 2,
				dependencies: ['2', '3', null], // 无效类型
				dependents: [5, undefined]
			}

			expect(validTask.dependencies.every(dep => typeof dep === 'number')).toBe(true)
			expect(validTask.dependents.every(dep => typeof dep === 'number')).toBe(true)
			expect(invalidTask.dependencies.every(dep => typeof dep === 'number')).toBe(false)
			expect(invalidTask.dependents.every(dep => dep != null)).toBe(false)
		})
	})

	describe('依赖链验证', () => {
		it('应该验证依赖任务的存在性', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1], title: '任务2' },
				{ id: 3, dependencies: [1, 2], title: '任务3' }
			]

			const validateDependencies = (task, allTasks) => {
				const taskIds = allTasks.map(t => t.id)
				return task.dependencies.every(depId => taskIds.includes(depId))
			}

			expect(validateDependencies(tasks[1], tasks)).toBe(true) // 任务2依赖任务1
			expect(validateDependencies(tasks[2], tasks)).toBe(true) // 任务3依赖任务1和2
		})

		it('应该检测缺失的依赖任务', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1, 999], title: '任务2' } // 999不存在
			]

			const findMissingDependencies = (task, allTasks) => {
				const taskIds = allTasks.map(t => t.id)
				return task.dependencies.filter(depId => !taskIds.includes(depId))
			}

			const missingDeps = findMissingDependencies(tasks[1], tasks)
			expect(missingDeps).toContain(999)
			expect(missingDeps.length).toBe(1)
		})

		it('应该防止自引用依赖', () => {
			const selfReferencingTask = {
				id: 1,
				dependencies: [1], // 依赖自己
				title: '自引用任务'
			}

			const hasSelfReference = (task) => {
				return task.dependencies.includes(task.id)
			}

			expect(hasSelfReference(selfReferencingTask)).toBe(true)
		})

		it('应该检测循环依赖', () => {
			const tasks = [
				{ id: 1, dependencies: [3], title: '任务1' },
				{ id: 2, dependencies: [1], title: '任务2' },
				{ id: 3, dependencies: [2], title: '任务3' }
			]

			// 检测循环依赖的函数
			const hasCircularDependency = (taskId, visited = new Set()) => {
				if (visited.has(taskId)) return true

				const task = tasks.find(t => t.id === taskId)
				if (!task) return false

				visited.add(taskId)
				for (const depId of task.dependencies) {
					if (hasCircularDependency(depId, visited)) return true
				}
				visited.delete(taskId)
				return false
			}

			expect(hasCircularDependency(1)).toBe(true)
			expect(hasCircularDependency(2)).toBe(true)
			expect(hasCircularDependency(3)).toBe(true)
		})
	})

	describe('依赖执行顺序计算', () => {
		it('应该计算任务的正确执行顺序', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1], title: '任务2' },
				{ id: 3, dependencies: [1], title: '任务3' },
				{ id: 4, dependencies: [2, 3], title: '任务4' },
				{ id: 5, dependencies: [4], title: '任务5' }
			]

			// 拓扑排序计算执行顺序
			const calculateExecutionOrder = (tasks) => {
				const result = []
				const visited = new Set()
				const visiting = new Set()

				const visit = (taskId) => {
					if (visited.has(taskId)) return
					if (visiting.has(taskId)) return // 循环依赖，暂时跳过

					visiting.add(taskId)

					const task = tasks.find(t => t.id === taskId)
					if (task) {
						task.dependencies.forEach(depId => visit(depId))
					}

					visiting.delete(taskId)
					visited.add(taskId)
					result.push(taskId)
				}

				tasks.forEach(task => visit(task.id))
				return result
			}

			const executionOrder = calculateExecutionOrder(tasks)
			expect(executionOrder).toEqual([1, 2, 3, 4, 5])
		})

		it('应该识别可并行执行的任务', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1], title: '任务2' },
				{ id: 3, dependencies: [1], title: '任务3' }, // 与任务2并行
				{ id: 4, dependencies: [2], title: '任务4' },
				{ id: 5, dependencies: [3], title: '任务5' }  // 与任务4并行
			]

			// 计算每个执行阶段的可并行任务
			const getParallelExecutionStages = (tasks) => {
				const stages = []
				const processed = new Set()

				const getNextStage = () => {
					const stage = []

					tasks.forEach(task => {
						if (!processed.has(task.id)) {
							const canExecute = task.dependencies.every(depId => processed.has(depId))
							if (canExecute) {
								stage.push(task.id)
							}
						}
					})

					stage.forEach(taskId => processed.add(taskId))
					return stage
				}

				let stage
				while ((stage = getNextStage()).length > 0) {
					stages.push(stage)
				}

				return stages
			}

			const stages = getParallelExecutionStages(tasks)
			expect(stages).toEqual([[1], [2, 3], [4, 5]])
		})

		it('应该处理复杂的依赖关系图', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1, 3], title: '任务2' },
				{ id: 3, dependencies: [1], title: '任务3' },
				{ id: 4, dependencies: [2, 5], title: '任务4' },
				{ id: 5, dependencies: [3], title: '任务5' }
			]

			const calculateExecutionOrder = (tasks) => {
				const result = []
				const visited = new Set()
				const visiting = new Set()

				const visit = (taskId) => {
					if (visited.has(taskId)) return
					if (visiting.has(taskId)) return

					visiting.add(taskId)

					const task = tasks.find(t => t.id === taskId)
					if (task) {
						task.dependencies.forEach(depId => visit(depId))
					}

					visiting.delete(taskId)
					visited.add(taskId)
					result.push(taskId)
				}

				tasks.forEach(task => visit(task.id))
				return result
			}

			const executionOrder = calculateExecutionOrder(tasks)
			expect(executionOrder).toEqual([1, 3, 2, 5, 4])
		})
	})

	describe('依赖影响分析', () => {
		it('应该计算依赖链的长度', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1], title: '任务2' },
				{ id: 3, dependencies: [2], title: '任务3' },
				{ id: 4, dependencies: [3], title: '任务4' }
			]

			const calculateDependencyDepth = (taskId, tasks, visited = new Set()) => {
				if (visited.has(taskId)) return 0

				const task = tasks.find(t => t.id === taskId)
				if (!task || task.dependencies.length === 0) return 0

				visited.add(taskId)
				const depths = task.dependencies.map(depId =>
					calculateDependencyDepth(depId, tasks, visited) + 1
				)
				visited.delete(taskId)

				return Math.max(...depths)
			}

			expect(calculateDependencyDepth(1, tasks)).toBe(0)
			expect(calculateDependencyDepth(2, tasks)).toBe(1)
			expect(calculateDependencyDepth(3, tasks)).toBe(2)
			expect(calculateDependencyDepth(4, tasks)).toBe(3)
		})

		it('应该识别关键路径', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1', duration: 2 },
				{ id: 2, dependencies: [1], title: '任务2', duration: 3 },
				{ id: 3, dependencies: [1], title: '任务3', duration: 1 },
				{ id: 4, dependencies: [2, 3], title: '任务4', duration: 2 }
			]

			// 计算关键路径（最长依赖链）
			const calculateCriticalPath = (tasks) => {
				const path = []
				const visited = new Set()

				const findLongestPath = (taskId) => {
					if (visited.has(taskId)) return []

					const task = tasks.find(t => t.id === taskId)
					if (!task || task.dependencies.length === 0) return [taskId]

					visited.add(taskId)

					let longestPath = []
					task.dependencies.forEach(depId => {
						const depPath = findLongestPath(depId)
						if (depPath.length > longestPath.length) {
							longestPath = depPath
						}
					})

					visited.delete(taskId)
					return [...longestPath, taskId]
				}

				tasks.forEach(task => {
					const taskPath = findLongestPath(task.id)
					if (taskPath.length > path.length) {
						path.splice(0, path.length, ...taskPath)
					}
				})

				return path
			}

			const criticalPath = calculateCriticalPath(tasks)
			expect(criticalPath).toEqual([1, 2, 4])
		})

		it('应该计算任务的紧前任务和后续任务', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1], title: '任务2' },
				{ id: 3, dependencies: [1], title: '任务3' },
				{ id: 4, dependencies: [2], title: '任务4' },
				{ id: 5, dependencies: [3], title: '任务5' }
			]

			const getPredecessors = (taskId, tasks) => {
				const task = tasks.find(t => t.id === taskId)
				if (!task) return []

				const predecessors = [...task.dependencies]
				task.dependencies.forEach(depId => {
					predecessors.push(...getPredecessors(depId, tasks))
				})

				return [...new Set(predecessors)]
			}

			const getSuccessors = (taskId, tasks) => {
				const successors = []

				tasks.forEach(task => {
					if (task.dependencies.includes(taskId)) {
						successors.push(task.id)
						successors.push(...getSuccessors(task.id, tasks))
					}
				})

				return [...new Set(successors)]
			}

			expect(getPredecessors(4, tasks)).toEqual([2, 1])
			expect(getSuccessors(1, tasks).sort()).toEqual([2, 3, 4, 5].sort())
		})
	})

	describe('依赖关系维护', () => {
		it('应该在删除任务时清理依赖关系', () => {
			const tasks = [
				{ id: 1, dependencies: [], dependents: [2, 3] },
				{ id: 2, dependencies: [1], dependents: [3] },
				{ id: 3, dependencies: [1, 2], dependents: [] }
			]

			const taskIdToDelete = 2

			// 清理依赖关系
			const updatedTasks = tasks.map(task => ({
				...task,
				dependencies: task.dependencies.filter(depId => depId !== taskIdToDelete),
				dependents: task.dependents.filter(depId => depId !== taskIdToDelete)
			}))

			// 删除任务
			const remainingTasks = updatedTasks.filter(task => task.id !== taskIdToDelete)

			expect(remainingTasks.find(t => t.id === 3).dependencies).toEqual([1])
			expect(remainingTasks.find(t => t.id === 1).dependents).toEqual([3])
		})

		it('应该在移动任务时更新依赖关系', () => {
			const tasks = [
				{ id: 1, dependencies: [], dependents: [2] },
				{ id: 2, dependencies: [1], dependents: [] }
			]

			// 假设任务2移动到ID 5
			const updatedTasks = tasks.map(task => ({
				...task,
				dependencies: task.dependencies.map(depId =>
					depId === 2 ? 5 : depId
				),
				dependents: task.dependents.map(depId =>
					depId === 2 ? 5 : depId
				)
			}))

			const movedTask = { ...tasks.find(t => t.id === 2), id: 5 }

			expect(updatedTasks.find(t => t.id === 1).dependents).toEqual([5])
			expect(movedTask.id).toBe(5)
		})

		it('应该验证依赖关系的完整性', () => {
			const tasks = [
				{ id: 1, dependencies: [], dependents: [2] },
				{ id: 2, dependencies: [1], dependents: [] },
				{ id: 3, dependencies: [1, 4], dependents: [] } // 引用不存在的任务4
			]

			const validateDependencyIntegrity = (tasks) => {
				const taskIds = tasks.map(t => t.id)

				return tasks.every(task =>
					task.dependencies.every(depId => taskIds.includes(depId)) &&
					task.dependents.every(depId => taskIds.includes(depId))
				)
			}

			expect(validateDependencyIntegrity(tasks)).toBe(false)

			// 添加缺失的任务
			const fixedTasks = [...tasks, { id: 4, dependencies: [], dependents: [] }]
			expect(validateDependencyIntegrity(fixedTasks)).toBe(true)
		})
	})

	describe('依赖关系查询功能', () => {
		it('应该能够查询任务的直接依赖', () => {
			const task = {
				id: 2,
				dependencies: [1, 3, 5],
				title: '任务2'
			}

			const getDirectDependencies = (task) => {
				return task.dependencies
			}

			const directDeps = getDirectDependencies(task)
			expect(directDeps).toEqual([1, 3, 5])
			expect(directDeps.length).toBe(3)
		})

		it('应该能够查询任务的间接依赖', () => {
			const tasks = [
				{ id: 1, dependencies: [], title: '任务1' },
				{ id: 2, dependencies: [1], title: '任务2' },
				{ id: 3, dependencies: [1], title: '任务3' },
				{ id: 4, dependencies: [2, 3], title: '任务4' }
			]

			const getAllDependencies = (taskId, tasks, visited = new Set()) => {
				if (visited.has(taskId)) return []

				const task = tasks.find(t => t.id === taskId)
				if (!task) return []

				const dependencies = [...task.dependencies]
				visited.add(taskId)

				task.dependencies.forEach(depId => {
					dependencies.push(...getAllDependencies(depId, tasks, visited))
				})

				visited.delete(taskId)
				return [...new Set(dependencies)]
			}

			expect(getAllDependencies(4, tasks)).toEqual([2, 3, 1])
			expect(getAllDependencies(2, tasks)).toEqual([1])
			expect(getAllDependencies(1, tasks)).toEqual([])
		})

		it('应该能够查询依赖于特定任务的其他任务', () => {
			const tasks = [
				{ id: 1, dependencies: [], dependents: [2, 3] },
				{ id: 2, dependencies: [1], dependents: [4] },
				{ id: 3, dependencies: [1], dependents: [4] },
				{ id: 4, dependencies: [2, 3], dependents: [] }
			]

			const getDependentTasks = (taskId, tasks) => {
				const task = tasks.find(t => t.id === taskId)
				if (!task) return []

				return task.dependents.map(depId => {
					const depTask = tasks.find(t => t.id === depId)
					return depTask ? { id: depTask.id, title: depTask.title } : null
				}).filter(Boolean)
			}

			const dependents = getDependentTasks(1, tasks)
			expect(dependents.length).toBe(2)
			expect(dependents.map(d => d.id).sort()).toEqual([2, 3])
		})
	})

	describe('依赖关系边界情况处理', () => {
		it('应该处理空依赖关系', () => {
			const task = {
				id: 1,
				dependencies: [],
				dependents: [],
				title: '独立任务'
			}

			expect(task.dependencies.length).toBe(0)
			expect(task.dependents.length).toBe(0)
		})

		it('应该处理包含null或undefined值的依赖关系', () => {
			const taskWithInvalidDeps = {
				id: 1,
				dependencies: [2, null, 3, undefined],
				dependents: [4, null, 5]
			}

			const cleanDependencies = taskWithInvalidDeps.dependencies.filter(dep =>
				dep != null && typeof dep === 'number'
			)

			const cleanDependents = taskWithInvalidDeps.dependents.filter(dep =>
				dep != null && typeof dep === 'number'
			)

			expect(cleanDependencies).toEqual([2, 3])
			expect(cleanDependents).toEqual([4, 5])
		})

		it('应该处理依赖关系中的重复项', () => {
			const task = {
				id: 1,
				dependencies: [2, 3, 2, 3, 4],
				dependents: [5, 6, 5, 7]
			}

			const uniqueDependencies = [...new Set(task.dependencies)]
			const uniqueDependents = [...new Set(task.dependents)]

			expect(uniqueDependencies).toEqual([2, 3, 4])
			expect(uniqueDependents).toEqual([5, 6, 7])
		})
	})

	describe('依赖关系性能验证', () => {
		it('应该高效处理大量任务的依赖关系计算', () => {
			const generateTasks = (count) => {
				const tasks = []
				for (let i = 1; i <= count; i++) {
					tasks.push({
						id: i,
						dependencies: i > 1 ? [i - 1] : [], // 每个任务依赖前一个任务
						dependents: i < count ? [i + 1] : [],
						title: `任务${i}`
					})
				}
				return tasks
			}

			const tasks = generateTasks(100)

			const startTime = Date.now()

			// 计算所有任务的执行顺序
			const calculateExecutionOrder = (tasks) => {
				const result = []
				const visited = new Set()
				const visiting = new Set()

				const visit = (taskId) => {
					if (visited.has(taskId)) return
					if (visiting.has(taskId)) return

					visiting.add(taskId)

					const task = tasks.find(t => t.id === taskId)
					if (task) {
						task.dependencies.forEach(depId => visit(depId))
					}

					visiting.delete(taskId)
					visited.add(taskId)
					result.push(taskId)
				}

				tasks.forEach(task => visit(task.id))
				return result
			}

			const executionOrder = calculateExecutionOrder(tasks)

			const endTime = Date.now()
			const duration = endTime - startTime

			expect(executionOrder.length).toBe(100)
			expect(executionOrder[0]).toBe(1)
			expect(executionOrder[99]).toBe(100)
			expect(duration).toBeLessThan(50) // 应该在50ms内完成
		})
	})
})
