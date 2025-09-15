/**
 * Contract test for POST /set-status endpoint
 * Tests the task status update functionality according to API contract
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
const mockSetTaskStatus = jest.fn()
jest.mock('../../scripts/modules/task-manager.js', () => ({
	setTaskStatus: mockSetTaskStatus
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('POST /set-status Endpoint Contract Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset mock implementations
		mockSetTaskStatus.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Basic functionality', () => {
		it('should update task status successfully', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: 1, status: 'in-progress' },
				message: 'Task status updated successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			// Execute set-status command
			await commands.setStatusAction({ id: 1, status: 'in-progress' })

			expect(mockSetTaskStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 1,
					status: 'in-progress',
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should update subtask status successfully', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: '1.2', status: 'done' },
				message: 'Subtask status updated successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: '1.2', status: 'done' })

			expect(mockSetTaskStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '1.2',
					status: 'done'
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should update status with tag context', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: 3, status: 'review' },
				message: 'Task status updated successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({
				id: 3,
				status: 'review',
				tag: 'feature-branch'
			})

			expect(mockSetTaskStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 3,
					status: 'review',
					tag: 'feature-branch'
				})
			)
		})
	})

	describe('Status validation', () => {
		const validStatuses = ['pending', 'in-progress', 'done', 'review', 'deferred', 'cancelled']

		validStatuses.forEach(status => {
			it(`should accept valid status: ${status}`, async () => {
				mockSetTaskStatus.mockResolvedValue({
					success: true,
					data: { id: 1, status },
					message: `Task status updated to ${status}`
				})

				commands = await import('../../scripts/modules/commands.js')

				await commands.setStatusAction({ id: 1, status })

				expect(mockSetTaskStatus).toHaveBeenCalledWith(
					expect.objectContaining({
						id: 1,
						status
					})
				)
			})
		})

		it('should handle invalid status values', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: false,
				error: 'Invalid status',
				message: 'Status "invalid-status" is not valid'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: 1, status: 'invalid-status' })

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('ID validation', () => {
		it('should accept numeric IDs', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: 42, status: 'pending' },
				message: 'Task status updated successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: 42, status: 'pending' })

			expect(mockSetTaskStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 42
				})
			)
		})

		it('should accept compound IDs for subtasks', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: '2.5', status: 'done' },
				message: 'Subtask status updated successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: '2.5', status: 'done' })

			expect(mockSetTaskStatus).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '2.5'
				})
			)
		})
	})

	describe('Error handling', () => {
		it('should return 400 for missing required parameters', async () => {
			commands = await import('../../scripts/modules/commands.js')

			// Test missing id
			await commands.setStatusAction({ status: 'pending' })
			expect(mockConsoleError).toHaveBeenCalled()

			// Test missing status
			await commands.setStatusAction({ id: 1 })
			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should return 404 for non-existent task', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: false,
				error: 'Task not found',
				message: 'Task with ID 999 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: 999, status: 'done' })

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should return 404 for non-existent subtask', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: false,
				error: 'Subtask not found',
				message: 'Subtask 1.99 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: '1.99', status: 'done' })

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle status update errors gracefully', async () => {
			mockSetTaskStatus.mockRejectedValue(new Error('Database update failed'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: 1, status: 'done' })

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Response format', () => {
		it('should return success message for successful updates', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: 1, status: 'done' },
				message: 'Task status updated successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: 1, status: 'done' })

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('Task status updated successfully')
			)
		})

		it('should provide detailed feedback for status changes', async () => {
			mockSetTaskStatus.mockResolvedValue({
				success: true,
				data: { id: 2, status: 'in-progress', previousStatus: 'pending' },
				message: 'Task 2 status changed from pending to in-progress'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: 2, status: 'in-progress' })

			expect(mockConsoleLog).toHaveBeenCalled()
		})
	})

	describe('Bulk operations', () => {
		it('should handle multiple ID parameters', async () => {
			mockSetTaskStatus
				.mockResolvedValueOnce({
					success: true,
					data: { id: 1, status: 'done' },
					message: 'Task 1 updated'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { id: 2, status: 'done' },
					message: 'Task 2 updated'
				})

			commands = await import('../../scripts/modules/commands.js')

			// Test bulk status update
			await commands.setStatusAction({ id: [1, 2], status: 'done' })

			expect(mockSetTaskStatus).toHaveBeenCalledTimes(2)
		})

		it('should handle partial failures in bulk operations', async () => {
			mockSetTaskStatus
				.mockResolvedValueOnce({
					success: true,
					data: { id: 1, status: 'done' },
					message: 'Task 1 updated'
				})
				.mockResolvedValueOnce({
					success: false,
					error: 'Task not found',
					message: 'Task 3 does not exist'
				})

			commands = await import('../../scripts/modules/commands.js')

			await commands.setStatusAction({ id: [1, 3], status: 'done' })

			expect(mockConsoleLog).toHaveBeenCalled()
			expect(mockConsoleError).toHaveBeenCalled()
		})
	})
})
