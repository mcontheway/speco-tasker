/**
 * Integration test for dependency management workflow
 * Tests dependency creation, validation, and resolution according to quickstart.md
 */

const { jest } = require('@jest/globals')

// Mock CLI output capture
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

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
const mockAddDependency = jest.fn()
const mockRemoveDependency = jest.fn()
const mockValidateDependencies = jest.fn()
const mockFixDependencies = jest.fn()
const mockGetTasks = jest.fn()
const mockNextTask = jest.fn()

jest.mock('../../scripts/modules/task-manager.js', () => ({
	addDependency: mockAddDependency,
	removeDependency: mockRemoveDependency,
	validateDependencies: mockValidateDependencies,
	fixDependencies: mockFixDependencies,
	getTasks: mockGetTasks,
	nextTask: mockNextTask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('Dependency Management Workflow Integration Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset all mock implementations
		mockAddDependency.mockReset()
		mockRemoveDependency.mockReset()
		mockValidateDependencies.mockReset()
		mockFixDependencies.mockReset()
		mockGetTasks.mockReset()
		mockNextTask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Dependency creation workflow', () => {
		it('should create task-to-task dependencies successfully', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 2,
					dependsOn: 1,
					relationship: '2 -> 1'
				},
				message: 'Dependency relationship established: Task 2 now depends on Task 1'
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

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('Dependency relationship established')
			)
		})

		it('should create subtask dependencies', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: '1.2',
					dependsOn: '1.1',
					relationship: '1.2 -> 1.1'
				},
				message: 'Subtask dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: '1.2',
				dependsOn: '1.1'
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '1.2',
					dependsOn: '1.1'
				})
			)
		})

		it('should create mixed dependencies between tasks and subtasks', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: '2.1',
					dependsOn: 1,
					relationship: '2.1 -> 1'
				},
				message: 'Cross-level dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: '2.1',
				dependsOn: 1
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: '2.1',
					dependsOn: 1
				})
			)
		})

		it('should create dependencies with tag context', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 3,
					dependsOn: 1,
					tag: 'feature-auth'
				},
				message: 'Tagged dependency created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 3,
				dependsOn: 1,
				tag: 'feature-auth'
			})

			expect(mockAddDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 3,
					dependsOn: 1,
					tag: 'feature-auth'
				})
			)
		})
	})

	describe('Dependency validation and error handling', () => {
		it('should prevent circular dependencies', async () => {
			mockAddDependency.mockResolvedValue({
				success: false,
				error: 'Circular dependency detected',
				message: 'This dependency would create a circular reference: 1 -> 2 -> 1'
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

			expect(mockConsoleError).toHaveBeenCalledWith(
				expect.stringContaining('depend on itself')
			)
		})

		it('should handle non-existent tasks', async () => {
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

		it('should prevent duplicate dependencies', async () => {
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
	})

	describe('Dependency removal workflow', () => {
		it('should remove task dependencies successfully', async () => {
			mockRemoveDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 2,
					dependsOn: 1,
					relationship: '2 -> 1'
				},
				message: 'Dependency relationship removed successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeDependencyAction({
				id: 2,
				dependsOn: 1
			})

			expect(mockRemoveDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 2,
					dependsOn: 1
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should handle removal of non-existent dependencies', async () => {
			mockRemoveDependency.mockResolvedValue({
				success: false,
				error: 'Dependency not found',
				message: 'Dependency relationship 3 -> 5 does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.removeDependencyAction({
				id: 3,
				dependsOn: 5
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Dependency validation workflow', () => {
		it('should validate dependency integrity successfully', async () => {
			mockValidateDependencies.mockResolvedValue({
				success: true,
				data: {
					totalDependencies: 5,
					validDependencies: 5,
					issues: []
				},
				message: 'All dependency relationships are valid'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.validateDependenciesAction()

			expect(mockValidateDependencies).toHaveBeenCalled()
			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('All dependency relationships are valid')
			)
		})

		it('should detect and report dependency issues', async () => {
			mockValidateDependencies.mockResolvedValue({
				success: true,
				data: {
					totalDependencies: 3,
					validDependencies: 2,
					issues: [
						{
							type: 'missing_task',
							taskId: 4,
							dependsOn: 99,
							message: 'Dependency target task 99 does not exist'
						}
					]
				},
				message: 'Found 1 dependency issue that needs attention'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.validateDependenciesAction()

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Dependency fixing workflow', () => {
		it('should fix dependency issues automatically', async () => {
			mockFixDependencies.mockResolvedValue({
				success: true,
				data: {
					issuesFixed: 2,
					issuesRemaining: 0,
					fixedIssues: [
						'Removed dependency to non-existent task 99',
						'Fixed circular dependency in chain 1 -> 2 -> 3 -> 1'
					]
				},
				message: 'Successfully fixed 2 dependency issues'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.fixDependenciesAction()

			expect(mockFixDependencies).toHaveBeenCalled()
			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should handle unfixable dependency issues', async () => {
			mockFixDependencies.mockResolvedValue({
				success: true,
				data: {
					issuesFixed: 1,
					issuesRemaining: 1,
					fixedIssues: ['Removed dependency to deleted task'],
					unfixableIssues: ['Complex circular dependency requires manual resolution']
				},
				message: 'Fixed 1 issue, 1 issue requires manual attention'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.fixDependenciesAction()

			expect(mockConsoleLog).toHaveBeenCalled()
			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Dependency-aware task scheduling', () => {
		it('should respect dependencies when finding next task', async () => {
			mockNextTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					title: 'Independent task',
					dependencies: [],
					blockedTasks: [2, 3]
				},
				message: 'Next available task (no unresolved dependencies)'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.nextAction()

			expect(mockNextTask).toHaveBeenCalled()
		})

		it('should show dependency blocking information', async () => {
			mockGetTasks.mockResolvedValue({
				success: true,
				data: [
					{
						id: 1,
						title: 'Completed task',
						status: 'done',
						dependencies: []
					},
					{
						id: 2,
						title: 'Blocked task',
						status: 'pending',
						dependencies: [3] // Depends on task 3
					},
					{
						id: 3,
						title: 'Unfinished prerequisite',
						status: 'pending',
						dependencies: []
					}
				],
				message: 'Tasks retrieved with dependency status'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.listAction({})

			expect(mockGetTasks).toHaveBeenCalled()
		})
	})

	describe('Complex dependency scenarios', () => {
		it('should handle cascading dependencies', async () => {
			mockAddDependency.mockResolvedValue({
				success: true,
				data: {
					taskId: 4,
					dependsOn: 2,
					cascadeInfo: {
						affectedTasks: [4, 5, 6],
						newChain: '4 -> 2 -> 1',
						totalChainLength: 3
					}
				},
				message: 'Cascading dependency created: 4 -> 2 -> 1'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addDependencyAction({
				id: 4,
				dependsOn: 2
			})

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should handle dependency chain validation', async () => {
			mockValidateDependencies.mockResolvedValue({
				success: true,
				data: {
					chains: [
						{ length: 2, tasks: [1, 2] },
						{ length: 3, tasks: [2, 3, 4] },
						{ length: 4, tasks: [1, 2, 3, 4] }
					],
					longestChain: 4,
					issues: []
				},
				message: 'Dependency chains validated successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.validateDependenciesAction()

			expect(mockValidateDependencies).toHaveBeenCalled()
		})

		it('should handle bulk dependency operations', async () => {
			mockAddDependency
				.mockResolvedValueOnce({
					success: true,
					data: { taskId: 5, dependsOn: 1 },
					message: 'Dependency 5 -> 1 created'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { taskId: 6, dependsOn: 1 },
					message: 'Dependency 6 -> 1 created'
				})
				.mockResolvedValueOnce({
					success: true,
					data: { taskId: 7, dependsOn: 2 },
					message: 'Dependency 7 -> 2 created'
				})

			commands = await import('../../scripts/modules/commands.js')

			// Simulate bulk dependency creation
			await commands.addDependencyAction({ id: 5, dependsOn: 1 })
			await commands.addDependencyAction({ id: 6, dependsOn: 1 })
			await commands.addDependencyAction({ id: 7, dependsOn: 2 })

			expect(mockAddDependency).toHaveBeenCalledTimes(3)
		})
	})
})
