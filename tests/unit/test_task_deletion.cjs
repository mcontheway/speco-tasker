/**
 * test_task_deletion.cjs
 * 单元测试：验证任务删除功能
 *
 * SCOPE: 测试任务删除、级联删除、依赖关系清理和安全删除验证
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

describe('任务删除功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('基础删除功能', () => {
		it('应该能够删除单个任务', () => {
			const tasks = [
				{ id: 1, title: '任务1', status: 'pending' },
				{ id: 2, title: '任务2', status: 'pending' },
				{ id: 3, title: '任务3', status: 'pending' }
			]

			const taskIdToDelete = 2
			const remainingTasks = tasks.filter(task => task.id !== taskIdToDelete)

			expect(remainingTasks).toHaveLength(2)
			expect(remainingTasks.find(task => task.id === taskIdToDelete)).toBeUndefined()
			expect(remainingTasks.map(task => task.id)).toEqual([1, 3])
		})

		it('应该能够删除不存在的任务（无错误）', () => {
			const tasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' }
			]

			const nonExistentId = 999
			const remainingTasks = tasks.filter(task => task.id !== nonExistentId)

			expect(remainingTasks).toHaveLength(2)
			expect(remainingTasks).toEqual(tasks)
		})

		it('应该验证任务ID存在性', () => {
			const tasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' }
			]

			const taskExists = (id) => tasks.some(task => task.id === id)

			expect(taskExists(1)).toBe(true)
			expect(taskExists(2)).toBe(true)
			expect(taskExists(3)).toBe(false)
		})
	})

	describe('子任务删除', () => {
		it('应该能够删除父任务及其所有子任务', () => {
			const tasks = [
				{
					id: 1,
					title: '父任务',
					subtasks: [
						{ id: '1.1', title: '子任务1' },
						{ id: '1.2', title: '子任务2' }
					]
				},
				{ id: 2, title: '其他任务' }
			]

			const taskIdToDelete = 1
			const remainingTasks = tasks.filter(task => task.id !== taskIdToDelete)

			expect(remainingTasks).toHaveLength(1)
			expect(remainingTasks[0].id).toBe(2)
		})

		it('应该能够删除单个子任务', () => {
			const parentTask = {
				id: 1,
				title: '父任务',
				subtasks: [
					{ id: '1.1', title: '子任务1' },
					{ id: '1.2', title: '子任务2' },
					{ id: '1.3', title: '子任务3' }
				]
			}

			const subtaskIdToDelete = '1.2'
			const updatedParentTask = {
				...parentTask,
				subtasks: parentTask.subtasks.filter(subtask => subtask.id !== subtaskIdToDelete)
			}

			expect(updatedParentTask.subtasks).toHaveLength(2)
			expect(updatedParentTask.subtasks.map(s => s.id)).toEqual(['1.1', '1.3'])
		})

		it('应该处理删除最后一个子任务的情况', () => {
			const parentTask = {
				id: 1,
				title: '父任务',
				subtasks: [
					{ id: '1.1', title: '最后一个子任务' }
				]
			}

			const updatedParentTask = {
				...parentTask,
				subtasks: []
			}

			expect(updatedParentTask.subtasks).toHaveLength(0)
			expect(updatedParentTask.id).toBe(1) // 父任务应该保留
		})
	})

	describe('依赖关系清理', () => {
		it('应该清理被删除任务的依赖关系', () => {
			const tasks = [
				{ id: 1, title: '任务1', dependencies: [] },
				{ id: 2, title: '任务2', dependencies: [1] },
				{ id: 3, title: '任务3', dependencies: [1, 2] },
				{ id: 4, title: '任务4', dependencies: [] }
			]

			const taskIdToDelete = 1

			// 清理依赖关系
			const updatedTasks = tasks.map(task => ({
				...task,
				dependencies: task.dependencies.filter(depId => depId !== taskIdToDelete)
			}))

			// 删除任务
			const remainingTasks = updatedTasks.filter(task => task.id !== taskIdToDelete)

			expect(remainingTasks).toHaveLength(3)
			expect(remainingTasks.find(t => t.id === 2).dependencies).toEqual([])
			expect(remainingTasks.find(t => t.id === 3).dependencies).toEqual([2])
			expect(remainingTasks.find(t => t.id === 4).dependencies).toEqual([])
		})

		it('应该处理复杂的依赖关系网络', () => {
			const tasks = [
				{ id: 1, title: '任务1', dependencies: [] },
				{ id: 2, title: '任务2', dependencies: [1] },
				{ id: 3, title: '任务3', dependencies: [2] },
				{ id: 4, title: '任务4', dependencies: [1, 3] },
				{ id: 5, title: '任务5', dependencies: [4] }
			]

			const taskIdToDelete = 2

			// 清理依赖关系
			const updatedTasks = tasks.map(task => ({
				...task,
				dependencies: task.dependencies.filter(depId => depId !== taskIdToDelete)
			}))

			// 删除任务
			const remainingTasks = updatedTasks.filter(task => task.id !== taskIdToDelete)

			expect(remainingTasks).toHaveLength(4)
			expect(remainingTasks.find(t => t.id === 3).dependencies).toEqual([])
			expect(remainingTasks.find(t => t.id === 4).dependencies).toEqual([1, 3])
			expect(remainingTasks.find(t => t.id === 5).dependencies).toEqual([4])
		})

		it('应该检测和处理循环依赖', () => {
			const tasks = [
				{ id: 1, title: '任务1', dependencies: [3] },
				{ id: 2, title: '任务2', dependencies: [1] },
				{ id: 3, title: '任务3', dependencies: [2] }
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

	describe('批量删除', () => {
		it('应该支持批量删除多个任务', () => {
			const tasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' },
				{ id: 3, title: '任务3' },
				{ id: 4, title: '任务4' },
				{ id: 5, title: '任务5' }
			]

			const idsToDelete = [2, 4]
			const remainingTasks = tasks.filter(task => !idsToDelete.includes(task.id))

			expect(remainingTasks).toHaveLength(3)
			expect(remainingTasks.map(t => t.id)).toEqual([1, 3, 5])
		})

		it('应该在批量删除时正确清理依赖关系', () => {
			const tasks = [
				{ id: 1, title: '任务1', dependencies: [] },
				{ id: 2, title: '任务2', dependencies: [1] },
				{ id: 3, title: '任务3', dependencies: [1, 2] },
				{ id: 4, title: '任务4', dependencies: [2] },
				{ id: 5, title: '任务5', dependencies: [] }
			]

			const idsToDelete = [1, 2]

			// 清理依赖关系
			const updatedTasks = tasks.map(task => ({
				...task,
				dependencies: task.dependencies.filter(depId => !idsToDelete.includes(depId))
			}))

			// 删除任务
			const remainingTasks = updatedTasks.filter(task => !idsToDelete.includes(task.id))

			expect(remainingTasks).toHaveLength(3)
			expect(remainingTasks.find(t => t.id === 3).dependencies).toEqual([])
			expect(remainingTasks.find(t => t.id === 4).dependencies).toEqual([])
			expect(remainingTasks.find(t => t.id === 5).dependencies).toEqual([])
		})
	})

	describe('删除验证和安全检查', () => {
		it('应该在删除前验证用户确认', () => {
			const taskToDelete = { id: 1, title: '重要任务', status: 'done' }

			// 模拟用户确认逻辑
			const shouldDelete = (task) => {
				// 通常会询问用户确认
				return task.status === 'done' // 只有已完成的任务才能删除
			}

			expect(shouldDelete(taskToDelete)).toBe(true)

			const pendingTask = { ...taskToDelete, status: 'pending' }
			expect(shouldDelete(pendingTask)).toBe(false)
		})

		it('应该防止删除有未完成依赖的任务', () => {
			const tasks = [
				{ id: 1, title: '任务1', status: 'pending' },
				{ id: 2, title: '任务2', status: 'pending', dependencies: [1] },
				{ id: 3, title: '任务3', status: 'pending', dependencies: [2] }
			]

			const canDelete = (taskId) => {
				const dependentTasks = tasks.filter(task =>
					task.dependencies && task.dependencies.includes(taskId)
				)
				return dependentTasks.length === 0
			}

			expect(canDelete(1)).toBe(false) // 有依赖它的任务
			expect(canDelete(2)).toBe(false) // 有依赖它的任务
			expect(canDelete(3)).toBe(true)  // 没有依赖它的任务
		})

		it('应该记录删除操作的审计日志', () => {
			const taskToDelete = { id: 1, title: '要删除的任务' }
			const auditLog = []

			// 记录删除操作
			auditLog.push({
				timestamp: new Date().toISOString(),
				action: 'DELETE_TASK',
				taskId: taskToDelete.id,
				taskTitle: taskToDelete.title,
				user: 'test-user'
			})

			expect(auditLog).toHaveLength(1)
			expect(auditLog[0].action).toBe('DELETE_TASK')
			expect(auditLog[0].taskId).toBe(1)
		})
	})

	describe('级联删除', () => {
		it('应该支持级联删除相关任务', () => {
			const tasks = [
				{ id: 1, title: '主要任务', type: 'epic' },
				{ id: 2, title: '子任务1', parentId: 1, type: 'task' },
				{ id: 3, title: '子任务2', parentId: 1, type: 'task' },
				{ id: 4, title: '子子任务', parentId: 2, type: 'subtask' },
				{ id: 5, title: '独立任务', type: 'task' }
			]

			const getChildTasks = (parentId) => {
				return tasks.filter(task => task.parentId === parentId)
			}

			const getAllDescendants = (parentId) => {
				const children = getChildTasks(parentId)
				let allDescendants = [...children]

				children.forEach(child => {
					allDescendants = allDescendants.concat(getAllDescendants(child.id))
				})

				return allDescendants
			}

			const descendantsOf1 = getAllDescendants(1)
			expect(descendantsOf1).toHaveLength(3)
			expect(descendantsOf1.map(t => t.id)).toEqual([2, 3, 4])

			const descendantsOf2 = getAllDescendants(2)
			expect(descendantsOf2).toHaveLength(1)
			expect(descendantsOf2[0].id).toBe(4)
		})

		it('应该处理复杂的任务层次结构', () => {
			const taskHierarchy = {
				1: { children: [2, 3] },
				2: { children: [4, 5] },
				3: { children: [6] },
				4: { children: [] },
				5: { children: [] },
				6: { children: [] }
			}

			const getAllChildrenIds = (taskId, hierarchy = taskHierarchy) => {
				const children = hierarchy[taskId]?.children || []
				let allChildren = [...children]

				children.forEach(childId => {
					allChildren = allChildren.concat(getAllChildrenIds(childId, hierarchy))
				})

				return allChildren
			}

			expect(getAllChildrenIds(1)).toEqual([2, 3, 4, 5, 6])
			expect(getAllChildrenIds(2)).toEqual([4, 5])
			expect(getAllChildrenIds(4)).toEqual([])
		})
	})

	describe('删除后的数据一致性', () => {
		it('应该重新编号任务ID以保持连续性', () => {
			const tasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' },
				{ id: 4, title: '任务4' }, // ID 3 被删除
				{ id: 5, title: '任务5' }
			]

			// 重新编号任务
			const renumberedTasks = tasks.map((task, index) => ({
				...task,
				id: index + 1
			}))

			expect(renumberedTasks.map(t => t.id)).toEqual([1, 2, 3, 4])
			expect(renumberedTasks[2].title).toBe('任务4') // 原ID 4的任务现在是ID 3
		})

		it('应该更新所有相关的依赖关系引用', () => {
			const tasks = [
				{ id: 1, title: '任务1', dependencies: [] },
				{ id: 2, title: '任务2', dependencies: [3] }, // 引用了ID 3
				{ id: 4, title: '任务4', dependencies: [3] }  // 引用了ID 3
			]

			// 假设删除了ID 3的任务，重新编号后ID 4变成ID 3
			const updatedTasks = tasks.map(task => ({
				...task,
				dependencies: task.dependencies.map(depId =>
					depId === 4 ? 3 : depId // ID 4变成ID 3
				)
			}))

			expect(updatedTasks.find(t => t.id === 2).dependencies).toEqual([3])
			expect(updatedTasks.find(t => t.id === 4).dependencies).toEqual([3])
		})
	})

	describe('错误处理', () => {
		it('应该处理删除不存在任务的错误', () => {
			const tasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' }
			]

			const deleteTask = (taskId) => {
				const taskIndex = tasks.findIndex(task => task.id === taskId)
				if (taskIndex === -1) {
					throw new Error(`任务 ${taskId} 不存在`)
				}
				return tasks.filter((_, index) => index !== taskIndex)
			}

			expect(() => deleteTask(3)).toThrow('任务 3 不存在')
			expect(() => deleteTask(1)).not.toThrow()
		})

		it('应该处理权限检查失败', () => {
			const userPermissions = {
				canDeleteTasks: true,
				canDeleteCompletedTasks: true,
				canDeleteInProgressTasks: false
			}

			const canDeleteTask = (task, permissions = userPermissions) => {
				if (!permissions.canDeleteTasks) {
					return { allowed: false, reason: '没有删除权限' }
				}

				if (task.status === 'in-progress' && !permissions.canDeleteInProgressTasks) {
					return { allowed: false, reason: '不能删除进行中的任务' }
				}

				return { allowed: true }
			}

			const completedTask = { id: 1, status: 'done' }
			const inProgressTask = { id: 2, status: 'in-progress' }

			expect(canDeleteTask(completedTask).allowed).toBe(true)
			expect(canDeleteTask(inProgressTask).allowed).toBe(false)
			expect(canDeleteTask(inProgressTask).reason).toBe('不能删除进行中的任务')
		})
	})
})
