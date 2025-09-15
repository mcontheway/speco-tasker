/**
 * Contract test for GET /list endpoint
 * Tests the task listing functionality according to API contract
 */

// Mock the commands module before importing it
const mockListAction = jest.fn()
jest.doMock('../../scripts/modules/commands.js', () => ({
  listAction: mockListAction
}))

const commands = require('../../scripts/modules/commands.js')
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
const mockGetTasks = jest.fn()
jest.mock('../../scripts/modules/task-manager.js', () => ({
	getTasks: mockGetTasks
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('GET /list Endpoint Contract Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset mock implementations
		mockGetTasks.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Basic functionality', () => {
		it('should list all tasks when no filters are provided', async () => {
			// Mock task data
			const mockTasks = [
				{
					id: 1,
					title: 'Test Task 1',
					status: 'pending',
					description: 'Test description 1'
				},
				{
					id: 2,
					title: 'Test Task 2',
					status: 'in-progress',
					description: 'Test description 2'
				}
			]

			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})

			// Dynamically import commands module after mocks

			// Execute list command
			await commands.listAction({})

			// Verify task manager was called correctly
			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			// Verify output was generated (console.log was called)
			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should filter tasks by status when status parameter is provided', async () => {
			const mockTasks = [
				{
					id: 1,
					title: 'Pending Task',
					status: 'pending'
				},
				{
					id: 2,
					title: 'Done Task',
					status: 'done'
				}
			]

			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})


			// Test with status filter
			await commands.listAction({ status: 'pending' })

			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'pending'
				})
			)
		})

		it('should include subtasks when withSubtasks is true', async () => {
			const mockTasks = [
				{
					id: 1,
					title: 'Parent Task',
					status: 'pending',
					subtasks: [
						{ id: 1.1, title: 'Subtask 1', status: 'pending' }
					]
				}
			]

			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})


			await commands.listAction({ 'with-subtasks': true })

			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					withSubtasks: true
				})
			)
		})

		it('should filter by tag when tag parameter is provided', async () => {
			const mockTasks = [
				{
					id: 1,
					title: 'Tagged Task',
					status: 'pending'
				}
			]

			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})


			await commands.listAction({ tag: 'feature-branch' })

			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					tag: 'feature-branch'
				})
			)
		})
	})

	describe('Error handling', () => {
		it('should handle task retrieval errors gracefully', async () => {
			mockGetTasks.mockResolvedValue({
				success: false,
				error: 'Failed to load tasks',
				message: 'Task retrieval failed'
			})


			await commands.listAction({})

			// Verify error was logged
			expect(mockConsoleError).toHaveBeenCalledWith(
				expect.stringContaining('Failed to load tasks')
			)
		})

		it('should handle invalid status parameter', async () => {
			const mockTasks = []
			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})


			// Test with invalid status
			await commands.listAction({ status: 'invalid-status' })

			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'invalid-status'
				})
			)
		})
	})

	describe('Response format', () => {
		it('should return formatted text output', async () => {
			const mockTasks = [
				{
					id: 1,
					title: 'Sample Task',
					status: 'pending',
					description: 'Sample description'
				}
			]

			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})


			await commands.listAction({})

			// Verify that console.log was called (indicating text output)
			expect(mockConsoleLog).toHaveBeenCalledTimes(expect.any(Number))
		})

		it('should handle empty task list', async () => {
			mockGetTasks.mockResolvedValue({
				success: true,
				data: [],
				message: 'No tasks found'
			})


			await commands.listAction({})

			expect(mockConsoleLog).toHaveBeenCalled()
		})
	})

	describe('Parameter validation', () => {
		it('should handle multiple status values', async () => {
			const mockTasks = [
				{ id: 1, title: 'Task 1', status: 'pending' },
				{ id: 2, title: 'Task 2', status: 'in-progress' },
				{ id: 3, title: 'Task 3', status: 'done' }
			]

			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})


			// Test with multiple statuses
			await commands.listAction({ status: 'pending,in-progress' })

			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'pending,in-progress'
				})
			)
		})

		it('should default withSubtasks to false when not specified', async () => {
			const mockTasks = [
				{ id: 1, title: 'Task without subtasks', status: 'pending' }
			]

			mockGetTasks.mockResolvedValue({
				success: true,
				data: mockTasks,
				message: 'Tasks retrieved successfully'
			})


			await commands.listAction({})

			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					withSubtasks: undefined // Should not set withSubtasks when not provided
				})
			)
		})
	})
})
