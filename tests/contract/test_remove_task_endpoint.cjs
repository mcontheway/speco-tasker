/**
 * Contract test for DELETE /remove-task endpoint
 * Tests the task deletion functionality according to API contract
 */

const { jest } = require('@jest/globals')

// Mock CLI output capture
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock process.exit to prevent test termination
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

// Mock readline for confirmation prompts
const mockReadline = {
	question: jest.fn(),
	close: jest.fn()
}
jest.mock('readline', () => ({
	createInterface: jest.fn(() => mockReadline)
}))

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
const mockRemoveTask = jest.fn()
jest.mock('../../scripts/modules/task-manager.js', () => ({
	removeTask: mockRemoveTask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('DELETE /remove-task Endpoint Contract Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset mock implementations
		mockRemoveTask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
		mockReadline.question.mockReset()
		mockReadline.close.mockReset()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Basic functionality', () => {
		it('should delete task successfully with confirmation', async () => {
			// Mock user confirmation
			mockReadline.question.mockImplementation((query, callback) => {
				callback('y')
			})

			mockRemoveTask.mockResolvedValue({
				success: true,
				data: { id: 1 },
				message: 'Task deleted successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1 })

			expect(mockRemoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 1,
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should delete task immediately with yes flag', async () => {
			mockRemoveTask.mockResolvedValue({
				success: true,
				data: { id: 2 },
				message: 'Task deleted successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 2, yes: true })

			expect(mockRemoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 2,
					yes: true
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
			// Should not prompt for confirmation
			expect(mockReadline.question).not.toHaveBeenCalled()
		})

		it('should delete task with tag context', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('y')
			})

			mockRemoveTask.mockResolvedValue({
				success: true,
				data: { id: 3 },
				message: 'Task deleted successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 3, tag: 'feature-branch' })

			expect(mockRemoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 3,
					tag: 'feature-branch'
				})
			)
		})
	})

	describe('Confirmation handling', () => {
		it('should cancel deletion when user declines', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('n')
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1 })

			expect(mockRemoveTask).not.toHaveBeenCalled()
			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('cancelled')
			)
		})

		it('should handle invalid confirmation responses', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('invalid')
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1 })

			expect(mockRemoveTask).not.toHaveBeenCalled()
			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should skip confirmation with yes flag', async () => {
			mockRemoveTask.mockResolvedValue({
				success: true,
				data: { id: 1 },
				message: 'Task deleted successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1, yes: true })

			expect(mockReadline.question).not.toHaveBeenCalled()
			expect(mockRemoveTask).toHaveBeenCalled()
		})
	})

	describe('ID validation', () => {
		it('should accept numeric task IDs', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('y')
			})

			mockRemoveTask.mockResolvedValue({
				success: true,
				data: { id: 42 },
				message: 'Task deleted successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 42 })

			expect(mockRemoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 42
				})
			)
		})

		it('should handle invalid ID formats', async () => {
			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 'invalid-id' })

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Error handling', () => {
		it('should return 404 for non-existent task', async () => {
			mockRemoveTask.mockResolvedValue({
				success: false,
				error: 'Task not found',
				message: 'Task with ID 999 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 999, yes: true })

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle deletion errors gracefully', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('y')
			})

			mockRemoveTask.mockRejectedValue(new Error('File system error'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1 })

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle missing required parameters', async () => {
			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Response format', () => {
		it('should provide success confirmation', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('y')
			})

			mockRemoveTask.mockResolvedValue({
				success: true,
				data: { id: 1 },
				message: 'Task "Implement user authentication" deleted successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1 })

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('deleted successfully')
			)
		})

		it('should provide detailed error messages', async () => {
			mockRemoveTask.mockResolvedValue({
				success: false,
				error: 'Permission denied',
				message: 'Cannot delete task: insufficient permissions'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1, yes: true })

			expect(mockConsoleError).toHaveBeenCalledWith(
				expect.stringContaining('insufficient permissions')
			)
		})
	})

	describe('Cleanup and side effects', () => {
		it('should clean up task dependencies when deleting', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('y')
			})

			mockRemoveTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					cleanedDependencies: [2, 3],
					cleanedSubtasks: ['1.1', '1.2']
				},
				message: 'Task and dependencies cleaned up successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1 })

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should handle tasks with subtasks', async () => {
			mockReadline.question.mockImplementation((query, callback) => {
				callback('y')
			})

			mockRemoveTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					subtasksRemoved: 3,
					totalItemsRemoved: 4
				},
				message: 'Task and all subtasks removed successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeTaskAction({ id: 1 })

			expect(mockConsoleLog).toHaveBeenCalled()
		})
	})
})
