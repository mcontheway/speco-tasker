/**
 * Contract test for POST /add-dependency endpoint
 * Tests the dependency creation functionality according to API contract
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
const mockAddDependency = jest.fn()
jest.mock('../../scripts/modules/task-manager.js', () => ({
	addDependency: mockAddDependency
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('POST /add-dependency Endpoint Contract Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset mock implementations
		mockAddDependency.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Basic functionality', () => {
		it('should create dependency between tasks', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 2,
					dependsOn: 1,
					relationship: '2 -> 1'
				},
				message: 'Dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 2,
				dependsOn: 1
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 2,
					dependsOn: 1,
					projectRoot: '/mock/project',
					tasksPath: '/mock/project/.taskmaster/tasks/tasks.json',
					tag: undefined
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should create dependency for subtasks', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: '2.3',
					dependsOn: '2.1',
					relationship: '2.3 -> 2.1'
				},
				message: 'Subtask dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: '2.3',
				dependsOn: '2.1'
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '2.3',
					dependsOn: '2.1'
				})
			)
		})

		it('should create mixed dependencies between tasks and subtasks', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: '1.2',
					dependsOn: 3,
					relationship: '1.2 -> 3'
				},
				message: 'Cross-level dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: '1.2',
				dependsOn: 3
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '1.2',
					dependsOn: 3
				})
			)
		})

		it('should create dependency with tag context', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 4,
					dependsOn: 2,
					tag: 'feature-branch'
				},
				message: 'Tagged dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 4,
				dependsOn: 2,
				tag: 'feature-branch'
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 4,
					dependsOn: 2,
					tag: 'feature-branch'
				})
			)
		})
	})

	describe('ID validation', () => {
		it('should accept numeric IDs', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: { taskId: 42, dependsOn: 24 },
				message: 'Dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 42,
				dependsOn: 24
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 42,
					dependsOn: 24
				})
			)
		})

		it('should accept compound IDs for subtasks', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: { taskId: '3.7', dependsOn: '1.5' },
				message: 'Subtask dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: '3.7',
				dependsOn: '1.5'
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '3.7',
					dependsOn: '1.5'
				})
			)
		})

		it('should handle invalid ID formats', async () => {
			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 'invalid-id',
				dependsOn: 1
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Parameter validation', () => {
		it('should validate required parameters', async () => {
			commands = await import('../../scripts/modules/commands.js')

			// Test missing id
			await commands.addDependencyAction({
				dependsOn: 1
			})
			expect(mockConsoleError).toHaveBeenCalled()

			// Test missing dependsOn
			await commands.addDependencyAction({
				id: 1
			})
			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should prevent self-dependencies', async () => {
			mockAddDependency.mockResolvedValue({
				success: false,
				error: 'Self dependency',
				message: 'Task cannot depend on itself'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 1,
				dependsOn: 1
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Error handling', () => {
		it('should return 404 for non-existent task', async () => {
			mockAddDependency.mockResolvedValue({
				success: false,
				error: 'Task not found',
				message: 'Task with ID 999 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 999,
				dependsOn: 1
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should return 404 for non-existent dependency target', async () => {
			mockAddDependency.mockResolvedValue({
				success: false,
				error: 'Dependency target not found',
				message: 'Task with ID 888 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 1,
				dependsOn: 888
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should prevent circular dependencies', async () => {
			mockAddDependency.mockResolvedValue({
				success: false,
				error: 'Circular dependency',
				message: 'This dependency would create a circular reference: 1 -> 2 -> 1'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 1,
				dependsOn: 2
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle duplicate dependencies', async () => {
			mockAddDependency.mockResolvedValue({
				success: false,
				error: 'Duplicate dependency',
				message: 'Dependency relationship 2 -> 1 already exists'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 2,
				dependsOn: 1
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle dependency creation errors gracefully', async () => {
			mockAddDependency.mockRejectedValue(new Error('Database connection failed'))

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 2,
				dependsOn: 1
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Response format', () => {
		it('should return success message with dependency details', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 3,
					dependsOn: 1,
					relationship: '3 -> 1'
				},
				message: 'Dependency relationship established: Task 3 now depends on Task 1'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 3,
				dependsOn: 1
			})

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('Dependency relationship established')
			)
		})

		it('should provide detailed error messages', async () => {
			mockAddDependency.mockResolvedValue({
				success: false,
				error: 'Validation failed',
				message: 'Cannot create dependency: would create circular reference'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 1,
				dependsOn: 2
			})

			expect(mockConsoleError).toHaveBeenCalledWith(
				expect.stringContaining('circular reference')
			)
		})
	})

	describe('Complex scenarios', () => {
		it('should handle multiple dependencies on same task', async () => {
			mockAddDependency
				.mockResolvedValueOnce({
					success: true,
					data: { taskId: 4, dependsOn: 1 },
					message: 'Dependency 4 -> 1 created'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { taskId: 5, dependsOn: 1 },
					message: 'Dependency 5 -> 1 created'
				})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({ id: 4, dependsOn: 1 })
			await commands.addDependencyAction({ id: 5, dependsOn: 1 })

			expect(mockAddDependency).toHaveBeenCalledTimes(2)
		})

		it('should handle cascading dependencies', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 3,
					dependsOn: 2,
					cascadeInfo: 'Task 2 already depends on Task 1, creating 3 -> 2 -> 1 chain'
				},
				message: 'Cascading dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 3,
				dependsOn: 2
			})

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('Cascading dependency')
			)
		})

		it('should validate dependency chains', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 5,
					dependsOn: 1,
					chainLength: 3,
					chain: '5 -> 3 -> 2 -> 1'
				},
				message: 'Long dependency chain created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 5,
				dependsOn: 1
			})

			expect(mockConsoleLog).toHaveBeenCalled()
		})
	})
})
