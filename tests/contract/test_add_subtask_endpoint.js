/**
 * Contract test for POST /add-subtask endpoint
 * Tests the subtask creation functionality according to API contract
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
const mockAddSubtask = jest.fn()
jest.mock('../../scripts/modules/task-manager.js', () => ({
	addSubtask: mockAddSubtask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('POST /add-subtask Endpoint Contract Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset mock implementations
		mockAddSubtask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Basic functionality', () => {
		it('should create subtask with required parameters', async () => {
			mockAddSubtask.mockResolvedValue({
				success: true,
				data: {
					id: '1.1',
					parentId: 1,
					title: 'Implement login form',
					status: 'pending'
				},
				message: 'Subtask created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'Implement login form'
			})

			expect(mockAddSubtask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 1,
					title: 'Implement login form',
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should create subtask with all optional parameters', async () => {
			mockAddSubtask.mockResolvedValue({
				success: true,
				data: {
					id: '2.3',
					parentId: 2,
					title: 'Design database schema',
					description: 'Create ER diagram and define relationships',
					status: 'in-progress'
				},
				message: 'Subtask created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 2,
				title: 'Design database schema',
				description: 'Create ER diagram and define relationships',
				status: 'in-progress'
			})

			expect(mockAddSubtask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 2,
					title: 'Design database schema',
					description: 'Create ER diagram and define relationships',
					status: 'in-progress'
				})
			)
		})

		it('should create subtask with tag context', async () => {
			mockAddSubtask.mockResolvedValue({
				success: true,
				data: {
					id: '3.1',
					parentId: 3,
					title: 'Setup CI/CD pipeline',
					status: 'pending'
				},
				message: 'Subtask created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 3,
				title: 'Setup CI/CD pipeline',
				tag: 'feature-branch'
			})

			expect(mockAddSubtask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 3,
					title: 'Setup CI/CD pipeline',
					tag: 'feature-branch'
				})
			)
		})
	})

	describe('Parameter validation', () => {
		it('should validate required parameters', async () => {
			commands = await import('../../scripts/modules/commands.js')

			// Test missing id
			await commands.addSubtaskAction({
				title: 'Test subtask'
			})
			expect(mockConsoleError).toHaveBeenCalled()

			// Test missing title
			await commands.addSubtaskAction({
				id: 1
			})
			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should validate title length constraints', async () => {
			const longTitle = 'A'.repeat(101) // Exceeds 100 character limit

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: longTitle
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should validate description length constraints', async () => {
			const longDescription = 'A'.repeat(301) // Exceeds 300 character limit

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'Valid title',
				description: longDescription
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should validate status enum values', async () => {
			mockAddSubtask.mockResolvedValue({
				success: false,
				error: 'Invalid status',
				message: 'Status must be one of: pending, in-progress, done, review, deferred, cancelled'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'Test subtask',
				status: 'invalid-status'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should accept valid status values', async () => {
			const validStatuses = ['pending', 'in-progress', 'done', 'review', 'deferred', 'cancelled']

			mockAddSubtask.mockResolvedValue({
				success: true,
				data: { id: '1.1', status: 'pending' },
				message: 'Subtask created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			for (const status of validStatuses) {
				await commands.addSubtaskAction({
					id: 1,
					title: 'Test subtask',
					status
				})
			}

			expect(mockAddSubtask).toHaveBeenCalledTimes(validStatuses.length)
		})
	})

	describe('ID validation', () => {
		it('should accept numeric parent IDs', async () => {
			mockAddSubtask.mockResolvedValue({
				success: true,
				data: { id: '42.1', parentId: 42 },
				message: 'Subtask created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 42,
				title: 'Test subtask'
			})

			expect(mockAddSubtask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 42
				})
			)
		})

		it('should reject non-numeric parent IDs', async () => {
			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 'invalid-id',
				title: 'Test subtask'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Error handling', () => {
		it('should return 404 for non-existent parent task', async () => {
			mockAddSubtask.mockResolvedValue({
				success: false,
				error: 'Parent task not found',
				message: 'Task with ID 999 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 999,
				title: 'Test subtask'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle subtask creation errors gracefully', async () => {
			mockAddSubtask.mockRejectedValue(new Error('Database connection failed'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'Test subtask'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle duplicate subtask titles', async () => {
			mockAddSubtask.mockResolvedValue({
				success: false,
				error: 'Duplicate subtask',
				message: 'A subtask with this title already exists under the parent task'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'Duplicate subtask'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Response format', () => {
		it('should return success message with subtask details', async () => {
			mockAddSubtask.mockResolvedValue({
				success: true,
				data: {
					id: '1.5',
					parentId: 1,
					title: 'New subtask',
					status: 'pending'
				},
				message: 'Subtask "New subtask" created successfully with ID 1.5'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'New subtask'
			})

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('created successfully with ID 1.5')
			)
		})

		it('should provide detailed error messages', async () => {
			mockAddSubtask.mockResolvedValue({
				success: false,
				error: 'Validation failed',
				message: 'Title exceeds maximum length of 100 characters'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'A'.repeat(101)
			})

			expect(mockConsoleError).toHaveBeenCalledWith(
				expect.stringContaining('maximum length of 100 characters')
			)
		})
	})

	describe('Default values', () => {
		it('should use default status when not specified', async () => {
			mockAddSubtask.mockResolvedValue({
				success: true,
				data: { id: '1.1', status: 'pending' },
				message: 'Subtask created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'Test subtask'
			})

			expect(mockAddSubtask).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'pending' // Should default to 'pending'
				})
			)
		})

		it('should handle optional description parameter', async () => {
			mockAddSubtask.mockResolvedValue({
				success: true,
				data: { id: '1.1', description: undefined },
				message: 'Subtask created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addSubtaskAction({
				id: 1,
				title: 'Test subtask'
			})

			expect(mockAddSubtask).toHaveBeenCalledWith(
				expect.objectContaining({
					description: undefined // Should be optional
				})
			)
		})
	})
})
