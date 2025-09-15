/**
 * Contract test for POST /move endpoint
 * Tests the task movement functionality according to API contract
 */

import { jest } from '@jest/globals'

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
const mockMoveTask = jest.fn()
jest.mock('../../scripts/modules/task-manager.js', () => ({
	moveTask: mockMoveTask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('POST /move Endpoint Contract Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset mock implementations
		mockMoveTask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Basic functionality', () => {
		it('should move task to new position successfully', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: 1, to: 3 },
				message: 'Task moved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 1, to: 3 })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: 1,
					to: 3,
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should move subtask to new parent', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: '1.2', to: '3.1' },
				message: 'Subtask moved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: '1.2', to: '3.1' })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: '1.2',
					to: '3.1'
				})
			)
		})

		it('should convert task to subtask', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: 5, to: '2.3' },
				message: 'Task converted to subtask successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 5, to: '2.3' })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: 5,
					to: '2.3'
				})
			)
		})

		it('should convert subtask to standalone task', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: '2.1', to: 6 },
				message: 'Subtask converted to standalone task successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: '2.1', to: 6 })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: '2.1',
					to: 6
				})
			)
		})

		it('should move with tag context', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: 1, to: 2 },
				message: 'Task moved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 1, to: 2, tag: 'feature-branch' })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: 1,
					to: 2,
					tag: 'feature-branch'
				})
			)
		})
	})

	describe('ID validation', () => {
		it('should accept valid numeric IDs', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: 10, to: 20 },
				message: 'Task moved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 10, to: 20 })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: 10,
					to: 20
				})
			)
		})

		it('should accept valid compound IDs', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: '1.5', to: '2.3' },
				message: 'Subtask moved successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: '1.5', to: '2.3' })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: '1.5',
					to: '2.3'
				})
			)
		})

		it('should accept mixed ID formats', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: 3, to: '1.4' },
				message: 'Task converted to subtask successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 3, to: '1.4' })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: 3,
					to: '1.4'
				})
			)
		})
	})

	describe('Error handling', () => {
		it('should return 400 for missing required parameters', async () => {
			commands = await import('../../scripts/modules/commands.js')

			// Test missing from
			await commands.moveAction({ to: 3 })
			expect(mockConsoleError).toHaveBeenCalled()

			// Test missing to
			await commands.moveAction({ from: 1 })
			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should return 404 for non-existent source task', async () => {
			mockMoveTask.mockResolvedValue({
				success: false,
				error: 'Source task not found',
				message: 'Task with ID 999 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 999, to: 1 })

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should return 400 for invalid move operations', async () => {
			mockMoveTask.mockResolvedValue({
				success: false,
				error: 'Invalid move operation',
				message: 'Cannot move task to itself'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 1, to: 1 })

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle move operation errors gracefully', async () => {
			mockMoveTask.mockRejectedValue(new Error('File system error'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 1, to: 2 })

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Complex scenarios', () => {
		it('should handle reordering within same parent', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: '1.2', to: '1.4' },
				message: 'Subtask reordered successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: '1.2', to: '1.4' })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: '1.2',
					to: '1.4'
				})
			)
		})

		it('should handle moving to non-existent target ID', async () => {
			mockMoveTask.mockResolvedValue({
				success: true,
				data: { from: 1, to: 25 },
				message: 'Task moved to new position successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 1, to: 25 })

			expect(mockMoveTask).toHaveBeenCalledWith(
				expect.objectContaining({
					from: 1,
					to: 25
				})
			)
		})

		it('should prevent overwriting existing tasks', async () => {
			mockMoveTask.mockResolvedValue({
				success: false,
				error: 'Target position occupied',
				message: 'Cannot move to position 2 as it already contains content'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: 1, to: 2 })

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Bulk operations', () => {
		it('should handle multiple move operations', async () => {
			mockMoveTask
				.mockResolvedValueOnce({
					success: true,
					data: { from: 1, to: 3 },
					message: 'Task 1 moved'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { from: 2, to: 4 },
					message: 'Task 2 moved'
				})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: [1, 2], to: [3, 4] })

			expect(mockMoveTask).toHaveBeenCalledTimes(2)
		})

		it('should handle partial failures in bulk moves', async () => {
			mockMoveTask
				.mockResolvedValueOnce({
					success: true,
					data: { from: 1, to: 3 },
					message: 'Task 1 moved'
				})
				.mockResolvedValueOnce({
					success: false,
					error: 'Invalid move',
					message: 'Cannot move task 2'
				})

			commands = await import('../../scripts/modules/commands.js')

			await commands.moveAction({ from: [1, 2], to: [3, 4] })

			expect(mockConsoleLog).toHaveBeenCalled()
			expect(mockConsoleError).toHaveBeenCalled()
		})
	})
})
