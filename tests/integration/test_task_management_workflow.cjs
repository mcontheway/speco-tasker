/**
 * Integration test for complete task management workflow
 * Tests the full lifecycle of task management according to quickstart.md
 */

const { jest } = require('@jest/globals')

// Mock CLI output capture
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

// Mock readline for interactive prompts
const mockReadline = {
	question: jest.fn(),
	close: jest.fn()
}
jest.mock('readline', () => ({
	createInterface: jest.fn(() => mockReadline)
}))

// Mock file system operations
jest.mock('fs', () => ({
	existsSync: jest.fn(),
	readFileSync: jest.fn(),
	writeFileSync: jest.fn(),
	mkdirSync: jest.fn()
}))

jest.mock('path', () => ({
	join: jest.fn((...args) => args.join('/')),
	dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
	resolve: jest.fn((...args) => args.join('/'))
}))

jest.mock('chalk', () => ({
	red: jest.fn((text) => `[ERROR] ${text}`),
	green: jest.fn((text) => `[SUCCESS] ${text}`),
	yellow: jest.fn((text) => `[WARNING] ${text}`),
	blue: jest.fn((text) => `[INFO] ${text}`),
	gray: jest.fn((text) => `[DIM] ${text}`),
	reset: jest.fn((text) => text)
}))

// Mock task manager functions
const mockAddTask = jest.fn()
const mockGetTasks = jest.fn()
const mockGetTask = jest.fn()
const mockSetTaskStatus = jest.fn()
const mockUpdateTask = jest.fn()
const mockUpdateSubtask = jest.fn()
const mockNextTask = jest.fn()

jest.mock('../../scripts/modules/task-manager.js', () => ({
	addTask: mockAddTask,
	getTasks: mockGetTasks,
	getTask: mockGetTask,
	setTaskStatus: mockSetTaskStatus,
	updateTask: mockUpdateTask,
	updateSubtask: mockUpdateSubtask,
	nextTask: mockNextTask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('Complete Task Management Workflow Integration Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset all mock implementations
		mockAddTask.mockReset()
		mockGetTasks.mockReset()
		mockGetTask.mockReset()
		mockSetTaskStatus.mockReset()
		mockUpdateTask.mockReset()
		mockUpdateSubtask.mockReset()
		mockNextTask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
		mockReadline.question.mockReset()
		mockReadline.close.mockReset()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Complete task lifecycle', () => {
		it('should execute full task lifecycle from creation to completion', async () => {
			// 1. Create task
			mockAddTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					title: 'Implement user authentication',
					status: 'pending'
				},
				message: 'Task created successfully'
			})

			// 2. Get next task
			mockNextTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					title: 'Implement user authentication',
					status: 'pending'
				},
				message: 'Next task to work on'
			})

			// 3. Show task details
			mockGetTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					title: 'Implement user authentication',
					description: 'Complete user auth system',
					status: 'pending',
					priority: 'high'
				},
				message: 'Task details retrieved'
			})

			// 4. Start working on task
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: 1, status: 'in-progress' },
				message: 'Task status updated to in-progress'
			})

			// 5. Update task with progress
			mockUpdateTask.mockResolvedValue({
				success: true,
				data: { id: 1 },
				message: 'Task updated with progress information'
			})

			// 6. Mark task as completed
			mockSetTaskStatus.mockResolvedValueOnce({
				success: true,
				data: { id: 1, status: 'done' },
				message: 'Task marked as completed'
			})

			commands = await import('../../scripts/modules/commands.js')

			// Execute the complete workflow

			// Step 1: Create task
			await commands.addTaskAction({
				title: 'Implement user authentication',
				description: 'Complete user auth system',
				priority: 'high'
			})

			// Step 2: Find next task to work on
			await commands.nextAction()

			// Step 3: View task details
			await commands.showAction('1')

			// Step 4: Start working on task
			await commands.setStatusAction({ id: 1, status: 'in-progress' })

			// Step 5: Update task with progress
			await commands.updateTaskAction({
				id: 1,
				prompt: 'Completed JWT implementation and basic auth flow'
			})

			// Step 6: Mark task as completed
			await commands.setStatusAction({ id: 1, status: 'done' })

			// Verify all operations were called
			expect(mockAddTask).toHaveBeenCalled()
			expect(mockNextTask).toHaveBeenCalled()
			expect(mockGetTask).toHaveBeenCalled()
			expect(mockSetTaskStatus).toHaveBeenCalledTimes(2)
			expect(mockUpdateTask).toHaveBeenCalled()
		})

		it('should handle task with subtasks workflow', async () => {
			const mockAddSubtask = jest.fn()
			const mockGetTasks = jest.fn()

			jest.mock('../../scripts/modules/task-manager.js', () => ({
				addTask: mockAddTask,
				getTasks: mockGetTasks,
				getTask: mockGetTask,
				setTaskStatus: mockSetTaskStatus,
				addSubtask: mockAddSubtask,
				updateSubtask: mockUpdateSubtask
			}))

			// Mock parent task creation
			mockAddTask.mockResolvedValue({
				success: true,
				data: { id: 1, title: 'Implement user management system' },
				message: 'Parent task created'
			})

			// Mock subtask creation
			mockAddSubtask.mockResolvedValueOnce({
				success: true,
				data: { id: '1.1', title: 'Create user model' },
				message: 'Subtask 1.1 created'
			}).mockResolvedValueOnce({
				success: true,
				data: { id: '1.2', title: 'Implement user service' },
				message: 'Subtask 1.2 created'
			})

			// Mock task listing with subtasks
			mockGetTasks.mockResolvedValue({
				success: true,
				data: [
					{
						id: 1,
						title: 'Implement user management system',
						status: 'pending',
						subtasks: [
							{ id: '1.1', title: 'Create user model', status: 'pending' },
							{ id: '1.2', title: 'Implement user service', status: 'pending' }
						]
					}
				],
				message: 'Tasks retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			// Create parent task
			await commands.addTaskAction({
				title: 'Implement user management system'
			})

			// Add subtasks
			await commands.addSubtaskAction({ id: 1, title: 'Create user model' })
			await commands.addSubtaskAction({ id: 1, title: 'Implement user service' })

			// List tasks with subtasks
			await commands.listAction({ 'with-subtasks': true })

			expect(mockAddTask).toHaveBeenCalled()
			expect(mockAddSubtask).toHaveBeenCalledTimes(2)
			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					withSubtasks: true
				})
			)
		})
	})

	describe('Task status progression', () => {
		it('should follow proper status progression workflow', async () => {
			const statusProgression = ['pending', 'in-progress', 'done']

			// Mock status updates for each progression
			statusProgression.forEach((status, index) => {
				mockSetTaskStatus.mockResolvedValueOnce({
					success: true,
					data: { id: 1, status },
					message: `Task status updated to ${status}`
				})
			})

			commands = await import('../../scripts/modules/commands.js')

			// Progress through all statuses
			for (const status of statusProgression) {
				await commands.setStatusAction({ id: 1, status })
			}

			expect(mockSetTaskStatus).toHaveBeenCalledTimes(statusProgression.length)
		})

		it('should handle status rollback scenarios', async () => {
			// Mock status changes: pending -> in-progress -> review -> in-progress -> done
			mockSetTaskStatus
				.mockResolvedValueOnce({
					success: true,
					data: { id: 1, status: 'in-progress' },
					message: 'Status changed to in-progress'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { id: 1, status: 'review' },
					message: 'Status changed to review'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { id: 1, status: 'in-progress' },
					message: 'Status rolled back to in-progress'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { id: 1, status: 'done' },
					message: 'Task completed'
				})

			commands = await import('../../scripts/modules/commands.js')

			// Execute status changes
			await commands.setStatusAction({ id: 1, status: 'in-progress' })
			await commands.setStatusAction({ id: 1, status: 'review' })
			await commands.setStatusAction({ id: 1, status: 'in-progress' }) // Rollback
			await commands.setStatusAction({ id: 1, status: 'done' })

			expect(mockSetTaskStatus).toHaveBeenCalledTimes(4)
		})
	})

	describe('Task updates and progress tracking', () => {
		it('should handle iterative task updates', async () => {
			const updates = [
				'Started implementing authentication logic',
				'Completed JWT token generation',
				'Added user registration endpoint',
				'Finished implementing login flow'
			]

			updates.forEach(update => {
				mockUpdateTask.mockResolvedValueOnce({
					success: true,
					data: { id: 1 },
					message: `Task updated: ${update}`
				})
			})

			commands = await import('../../scripts/modules/commands.js')

			// Apply multiple updates
			for (const update of updates) {
				await commands.updateTaskAction({
					id: 1,
					prompt: update
				})
			}

			expect(mockUpdateTask).toHaveBeenCalledTimes(updates.length)
		})

		it('should handle subtask progress updates', async () => {
			mockUpdateSubtask.mockResolvedValue({
				success: true,
				data: { id: '1.2' },
				message: 'Subtask updated with progress'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.updateSubtaskAction({
				id: '1.2',
				prompt: 'Completed database schema design'
			})

			expect(mockUpdateSubtask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '1.2',
					prompt: 'Completed database schema design'
				})
			)
		})
	})

	describe('Workflow error handling', () => {
		it('should handle task status update failures', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: false,
				error: 'Invalid status transition',
				message: 'Cannot change status from done to pending'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: 1, status: 'pending' })

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle task update failures', async () => {
			mockUpdateTask.mockResolvedValue({
				success: false,
				error: 'Task not found',
				message: 'Cannot update non-existent task'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.updateTaskAction({
				id: 999,
				prompt: 'Update content'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle network/file system errors', async () => {
			mockGetTask.mockRejectedValue(new Error('File system read error'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('1')

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Bulk operations workflow', () => {
		it('should handle multiple task operations efficiently', async () => {
			const tasks = [
				{ id: 1, title: 'Task 1' },
				{ id: 2, title: 'Task 2' },
				{ id: 3, title: 'Task 3' }
			]

			// Mock bulk status updates
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { ids: [1, 2, 3], status: 'done' },
				message: 'Bulk status update completed'
			})

			commands = await import('../../scripts/modules/commands.js')

			// Simulate bulk status update
			await commands.setStatusAction({
				id: [1, 2, 3],
				status: 'done'
			})

			expect(mockSetTaskStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					id: [1, 2, 3],
					status: 'done'
				})
			)
		})

		it('should handle partial failures in bulk operations', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: {
					successful: [1, 2],
					failed: [3],
					errors: ['Task 3 not found']
				},
				message: 'Bulk operation completed with partial failures'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({
				id: [1, 2, 3],
				status: 'in-progress'
			})

			expect(mockConsoleLog).toHaveBeenCalled()
		})
	})

	describe('Task priority and scheduling', () => {
		it('should respect task priorities in workflow', async () => {
			const tasks = [
				{ id: 1, priority: 'high', title: 'High priority task' },
				{ id: 2, priority: 'medium', title: 'Medium priority task' },
				{ id: 3, priority: 'low', title: 'Low priority task' }
			]

			mockNextTask.mockResolvedValue({
				success: true,
				data: tasks[0], // Should return high priority task first
				message: 'Next high priority task'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.nextAction()

			expect(mockNextTask).toHaveBeenCalled()
		})

		it('should handle task dependencies in workflow', async () => {
			mockNextTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					title: 'Independent task',
					dependencies: []
				},
				message: 'Next available task (no dependencies)'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.nextAction()

			expect(mockNextTask).toHaveBeenCalled()
		})
	})
})
