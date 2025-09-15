/**
 * Contract test for GET /show/{id} endpoint
 * Tests the task detail retrieval functionality according to API contract
 */

const { jest } = require('@jest/globals')

// Mock CLI output capture
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock process.exit to prevent test termination
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

// Mock file system and dependencies
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

// Mock task manager
const mockGetTask = jest.fn()
jest.mock('../../scripts/modules/task-manager.js', () => ({
	getTask: mockGetTask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('GET /show/{id} Endpoint Contract Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset mock implementations
		mockGetTask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Basic functionality', () => {
		it('should retrieve task details by ID', async () => {
			// Mock task data
			const mockTask = {
				id: 1,
				title: 'Test Task',
				status: 'pending',
				description: 'Test description',
				priority: 'high',
				details: 'Detailed implementation notes',
				testStrategy: 'Unit tests and integration tests',
				dependencies: [],
				subtasks: []
			}

			mockGetTask.mockResolvedValue({
				success: true,
				data: mockTask,
				message: 'Task retrieved successfully'
			})

			// Dynamically import commands module after mocks
			commands = await import('../../scripts/modules/commands.js')

			// Execute show command
			await commands.showAction('1')

			// Verify task manager was called correctly
			expect(mockGetTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 1,
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			// Verify output was generated
			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should retrieve subtask details by compound ID', async () => {
			const mockSubtask = {
				id: '1.2',
				title: 'Test Subtask',
				status: 'in-progress',
				description: 'Subtask description',
				details: 'Subtask implementation details',
				dependencies: []
			}

			mockGetTask.mockResolvedValue({
				success: true,
				data: mockSubtask,
				message: 'Subtask retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('1.2')

			expect(mockGetTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '1.2',
					tag: undefined
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should filter by tag when tag parameter is provided', async () => {
			const mockTask = {
				id: 5,
				title: 'Tagged Task',
				status: 'done'
			}

			mockGetTask.mockResolvedValue({
				success: true,
				data: mockTask,
				message: 'Task retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('5', { tag: 'feature-branch' })

			expect(mockGetTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 5,
					tag: 'feature-branch'
				})
			)
		})
	})

	describe('ID validation', () => {
		it('should accept valid numeric IDs', async () => {
			const mockTask = { id: 42, title: 'Valid Task', status: 'pending' }

			mockGetTask.mockResolvedValue({
				success: true,
				data: mockTask,
				message: 'Task retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('42')

			expect(mockGetTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 42
				})
			)
		})

		it('should accept valid compound IDs', async () => {
			const mockSubtask = {
				id: '3.7',
				title: 'Valid Subtask',
				status: 'pending'
			}

			mockGetTask.mockResolvedValue({
				success: true,
				data: mockSubtask,
				message: 'Subtask retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('3.7')

			expect(mockGetTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '3.7'
				})
			)
		})

		it('should handle invalid ID formats gracefully', async () => {
			commands = await import('../../scripts/modules/commands.js')

			// Test with invalid ID format
			await commands.showAction('invalid-id')

			// Should still attempt to call getTask (parsing might happen inside)
			expect(mockGetTask).toHaveBeenCalled()
		})
	})

	describe('Error handling', () => {
		it('should return 404 for non-existent task', async () => {
			mockGetTask.mockResolvedValue({
				success: false,
				error: 'Task not found',
				message: 'Task with ID 999 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('999')

			// Verify error was handled
			expect(mockGetTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 999
				})
			)

			// Verify error output
			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should return 404 for non-existent subtask', async () => {
			mockGetTask.mockResolvedValue({
				success: false,
				error: 'Subtask not found',
				message: 'Subtask 1.99 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('1.99')

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle task retrieval errors gracefully', async () => {
			mockGetTask.mockRejectedValue(new Error('Database connection failed'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('1')

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Response format', () => {
		it('should return formatted text output for task details', async () => {
			const mockTask = {
				id: 1,
				title: 'Formatted Task',
				status: 'pending',
				description: 'Description with details',
				priority: 'medium',
				details: 'Implementation details here',
				testStrategy: 'Unit and integration tests',
				dependencies: [2, 3],
				subtasks: [
					{ id: 1.1, title: 'Subtask 1', status: 'done' },
					{ id: 1.2, title: 'Subtask 2', status: 'pending' }
				]
			}

			mockGetTask.mockResolvedValue({
				success: true,
				data: mockTask,
				message: 'Task retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('1')

			// Verify formatted output was generated
			expect(mockConsoleLog).toHaveBeenCalledTimes(expect.any(Number))
		})

		it('should display parent task context for subtasks', async () => {
			const mockSubtask = {
				id: '2.3',
				title: 'Subtask with Context',
				status: 'in-progress',
				description: 'Subtask description',
				parentId: 2,
				parentTitle: 'Parent Task Title'
			}

			mockGetTask.mockResolvedValue({
				success: true,
				data: mockSubtask,
				message: 'Subtask retrieved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.showAction('2.3')

			expect(mockConsoleLog).toHaveBeenCalled()
		})
	})

	describe('Multiple IDs support', () => {
		it('should handle multiple ID parameters', async () => {
			const mockTask1 = { id: 1, title: 'Task 1', status: 'pending' }
			const mockTask2 = { id: 2, title: 'Task 2', status: 'done' }

			mockGetTask
				.mockResolvedValueOnce({
					success: true,
					data: mockTask1,
					message: 'Task 1 retrieved successfully'
				})
				.mockResolvedValueOnce({
					success: true,
					data: mockTask2,
					message: 'Task 2 retrieved successfully'
				})

			commands = await import('../../scripts/modules/commands.js')

			// Test with multiple IDs (if supported)
			await commands.showAction(['1', '2'])

			expect(mockGetTask).toHaveBeenCalledTimes(2)
		})
	})
})
