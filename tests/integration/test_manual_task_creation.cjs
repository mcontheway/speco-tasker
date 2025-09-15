/**
 * Integration test for manual task creation workflow
 * Tests the complete flow of creating tasks manually according to quickstart.md
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

jest.mock('../../scripts/modules/task-manager.js', () => ({
	addTask: mockAddTask,
	getTasks: mockGetTasks,
	getTask: mockGetTask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('Manual Task Creation Workflow Integration Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset all mock implementations
		mockAddTask.mockReset()
		mockGetTasks.mockReset()
		mockGetTask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
		mockReadline.question.mockReset()
		mockReadline.close.mockReset()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Complete task creation workflow', () => {
		it('should create a task with all required and optional parameters', async () => {
			// Mock successful task creation
			mockAddTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					title: 'Implement user authentication module',
					description: 'Add complete user authentication system',
					priority: 'high',
					status: 'pending'
				},
				message: 'Task created successfully with ID 1'
			})

			commands = await import('../../scripts/modules/commands.js')

			// Execute add-task command with all parameters
			await commands.addTaskAction({
				title: 'Implement user authentication module',
				description: 'Add complete user authentication system',
				priority: 'high',
				details: 'Use JWT token, frontend form validation',
				testStrategy: 'Unit tests + integration tests'
			})

			// Verify task manager was called with correct parameters
			expect(mockAddTask).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Implement user authentication module',
					description: 'Add complete user authentication system',
					priority: 'high',
					details: 'Use JWT token, frontend form validation',
					testStrategy: 'Unit tests + integration tests',
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('Task created successfully with ID 1')
			)
		})

		it('should create a task with minimal required parameters', async () => {
			mockAddTask.mockResolvedValue({
				success: true,
				data: {
					id: 2,
					title: 'Setup project structure',
					status: 'pending'
				},
				message: 'Task created successfully with ID 2'
			})

			commands = await import('../../scripts/modules/commands.js')

			// Execute add-task with only title
			await commands.addTaskAction({
				title: 'Setup project structure'
			})

			expect(mockAddTask).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Setup project structure',
					priority: 'medium', // Should default to medium
					status: 'pending'   // Should default to pending
				})
			)
		})

		it('should create task with tag context', async () => {
			mockAddTask.mockResolvedValue({
				success: true,
				data: {
					id: 3,
					title: 'Implement payment gateway',
					tag: 'feature-payment'
				},
				message: 'Task created successfully in feature-payment tag'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTaskAction({
				title: 'Implement payment gateway',
				tag: 'feature-payment'
			})

			expect(mockAddTask).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Implement payment gateway',
					tag: 'feature-payment'
				})
			)
		})

		it('should create task with dependencies', async () => {
			mockAddTask.mockResolvedValue({
				success: true,
				data: {
					id: 4,
					title: 'Deploy to production',
					dependencies: [1, 2, 3]
				},
				message: 'Task created with dependencies'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTaskAction({
				title: 'Deploy to production',
				dependencies: [1, 2, 3]
			})

			expect(mockAddTask).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Deploy to production',
					dependencies: [1, 2, 3]
				})
			)
		})
	})

	describe('Task creation validation', () => {
		it('should validate required title parameter', async () => {
			commands = await import('../../scripts/modules/commands.js')

			// Test missing title
			await commands.addTaskAction({
				description: 'Test description'
			})

			expect(mockConsoleError).toHaveBeenCalledWith(
				expect.stringContaining('Title is required')
			)
			expect(mockAddTask).not.toHaveBeenCalled()
		})

		it('should validate title length constraints', async () => {
			const longTitle = 'A'.repeat(101) // Exceeds typical length limit

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTaskAction({
				title: longTitle
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should validate priority enum values', async () => {
			mockAddTask.mockResolvedValue({
				success: false,
				error: 'Invalid priority',
				message: 'Priority must be one of: high, medium, low'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTaskAction({
				title: 'Test task',
				priority: 'urgent' // Invalid priority
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should accept valid priority values', async () => {
			const validPriorities = ['high', 'medium', 'low']

			mockAddTask.mockResolvedValue({
				success: true,
				data: { id: 1, priority: 'high' },
				message: 'Task created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			for (const priority of validPriorities) {
				await commands.addTaskAction({
					title: 'Test task',
					priority
				})
			}

			expect(mockAddTask).toHaveBeenCalledTimes(validPriorities.length)
		})
	})

	describe('Workflow integration', () => {
		it('should create task and immediately retrieve it', async () => {
			// Mock task creation
			mockAddTask.mockResolvedValue({
				success: true,
				data: {
					id: 5,
					title: 'New test task',
					status: 'pending'
				},
				message: 'Task created successfully'
			})

			// Mock task retrieval
			mockGetTask.mockResolvedValue({
				success: true,
				data: {
					id: 5,
					title: 'New test task',
					status: 'pending',
					description: 'Test description'
				},
				message: 'Task retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			// Create task
			await commands.addTaskAction({
				title: 'New test task',
				description: 'Test description'
			})

			// Retrieve the created task
			await commands.showAction('5')

			expect(mockAddTask).toHaveBeenCalled()
			expect(mockGetTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 5
				})
			)
		})

		it('should handle task creation in sequence', async () => {
			const tasks = [
				{ id: 1, title: 'Task 1' },
				{ id: 2, title: 'Task 2' },
				{ id: 3, title: 'Task 3' }
			]

			// Mock sequential task creation
			tasks.forEach((task, index) => {
				mockAddTask.mockResolvedValueOnce({
					success: true,
					data: { id: task.id, title: task.title },
					message: `Task ${task.title} created successfully`
				})
			})

			commands = await import('../../scripts/modules/commands.js')

			// Create tasks in sequence
			for (const task of tasks) {
				await commands.addTaskAction({
					title: task.title
				})
			}

			expect(mockAddTask).toHaveBeenCalledTimes(tasks.length)
		})
	})

	describe('Error handling and recovery', () => {
		it('should handle task creation failures gracefully', async () => {
			mockAddTask.mockResolvedValue({
				success: false,
				error: 'Validation failed',
				message: 'Title cannot be empty'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTaskAction({
				title: ''
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle file system errors during creation', async () => {
			mockAddTask.mockRejectedValue(new Error('File system write failed'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTaskAction({
				title: 'Test task'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle duplicate task creation attempts', async () => {
			mockAddTask
				.mockResolvedValueOnce({
					success: true,
					data: { id: 1, title: 'Duplicate task' },
					message: 'Task created successfully'
				})
				.mockResolvedValueOnce({
					success: false,
					error: 'Duplicate task',
					message: 'Task with this title already exists'
				})

			commands = await import('../../scripts/modules/commands.js')

			// First creation should succeed
			await commands.addTaskAction({
				title: 'Duplicate task'
			})

			// Second creation should fail
			await commands.addTaskAction({
				title: 'Duplicate task'
			})

			expect(mockConsoleLog).toHaveBeenCalledTimes(1)
			expect(mockConsoleError).toHaveBeenCalledTimes(1)
		})
	})

	describe('Data persistence verification', () => {
		it('should verify task data is properly persisted', async () => {
			const taskData = {
				id: 6,
				title: 'Persistent task',
				description: 'This task should persist',
				priority: 'high',
				status: 'pending'
			}

			mockAddTask.mockResolvedValue({
				success: true,
				data: taskData,
				message: 'Task created and persisted successfully'
			})

			// Mock file system to verify write operations
			const mockWriteFile = jest.fn()
			jest.mocked(require('fs')).writeFileSync = mockWriteFile

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTaskAction({
				title: taskData.title,
				description: taskData.description,
				priority: taskData.priority
			})

			// Verify that file write was attempted
			expect(mockWriteFile).toHaveBeenCalled()
		})

		it('should handle concurrent task creation', async () => {
			const concurrentTasks = [
				{ title: 'Concurrent Task 1' },
				{ title: 'Concurrent Task 2' },
				{ title: 'Concurrent Task 3' }
			]

			concurrentTasks.forEach((task, index) => {
				mockAddTask.mockResolvedValueOnce({
					success: true,
					data: { id: index + 1, title: task.title },
					message: `Task ${task.title} created`
				})
			})

			commands = await import('../../scripts/modules/commands.js')

			// Create tasks concurrently (in sequence for testing)
			const promises = concurrentTasks.map(task =>
				commands.addTaskAction({ title: task.title })
			)

			await Promise.all(promises)

			expect(mockAddTask).toHaveBeenCalledTimes(concurrentTasks.length)
		})
	})
})
