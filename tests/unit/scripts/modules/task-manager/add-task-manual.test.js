/**
 * Tests for the add-task.js module - Manual mode functionality
 */
import { jest } from '@jest/globals'

// Mock the dependencies before importing the module under test
jest.unstable_mockModule('../../../../../scripts/modules/utils.js', () => ({
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	isSilentMode: jest.fn(() => false),
	getCurrentTag: jest.fn(() => 'main'),
	ensureTagMetadata: jest.fn((tagObj) => tagObj),
	getStatusWithColor: jest.fn((status) => status),
	findCycles: jest.fn(() => []),
	parseSpecFiles: jest.fn((input) => {
		if (!input) return []
		if (Array.isArray(input)) return input
		if (typeof input === 'string') {
			return input.split(',').map(file => ({ type: 'spec', title: 'Specification Document', file: file.trim() }))
		}
		return []
	}),
	validateSpecFiles: jest.fn(() => ({ isValid: true, errors: [], warnings: [] })),
	parseDependencies: jest.fn((input, tasks) => {
		// Ensure input is always treated as array
		const dependencies = Array.isArray(input) ? input : (input ? [input] : [])
		return {
			dependencies: dependencies,
			errors: [],
			warnings: []
		}
	}),
	parseLogs: jest.fn((input) => input || ''),
	findProjectRoot: jest.fn(() => '/mock/project'),
	validateFieldUpdatePermission: jest.fn(() => ({ isAllowed: true })),
	formatTaskId: jest.fn((id) => id.toString()),
	truncate: jest.fn((text) => text),
	markMigrationForNotice: jest.fn(),
	performCompleteTagMigration: jest.fn()
}))

jest.unstable_mockModule('../../../../../scripts/modules/config-manager.js', () => ({
	getDefaultPriority: jest.fn(() => 'medium')
}))

jest.unstable_mockModule('../../../../../scripts/modules/utils/task-validation.js', () => ({
	formatValidationError: jest.fn(() => 'Validation error'),
	validateTaskData: jest.fn(() => ({ isValid: true, errors: [], warnings: [] }))
}))

jest.unstable_mockModule('../../../../../scripts/modules/ui.js', () => ({
	displayAiUsageSummary: jest.fn(),
	displayBanner: jest.fn(),
	displayContextAnalysis: jest.fn(),
	failLoadingIndicator: jest.fn(),
	getStatusWithColor: jest.fn((status) => status),
	startLoadingIndicator: jest.fn(() => 'loading-indicator'),
	stopLoadingIndicator: jest.fn(),
	succeedLoadingIndicator: jest.fn()
}))

// Import the mocked modules
const { readJSON, writeJSON } = await import('../../../../../scripts/modules/utils.js')

// Mock additional modules
jest.unstable_mockModule('../../../../../scripts/modules/task-manager/generate-task-files.js', () => ({
	default: jest.fn()
}))

jest.unstable_mockModule('../../../../../scripts/modules/utils/contextGatherer.js', () => ({
	default: class ContextGatherer {
		gather() {
			return Promise.resolve({ context: [], tokens: 0 })
		}
	}
}))

// readJSON mock is set up in beforeEach

// Remove duplicate mock - using jest.unstable_mockModule above

// Import the module under test
const { default: addTask } = await import('../../../../../scripts/modules/task-manager/add-task.js')

// Import parseDependencies to spy on it
const utilsModule = await import('../../../../../scripts/modules/utils.js')

// Import task validation module
const taskValidationModule = await import('../../../../../scripts/modules/utils/task-validation.js')

describe('addTask - Manual Mode', () => {
	const sampleTasks = {
		main: {
			tasks: [
				{ id: 1, title: 'Existing Task 1', status: 'done' },
				{ id: 2, title: 'Existing Task 2', status: 'in-progress' },
				{ id: 3, title: 'Existing Task 3', status: 'pending' }
			],
			metadata: { description: 'Main tasks' }
		}
	}

	beforeEach(() => {
		jest.clearAllMocks()
		// Setup readJSON to return the correct tagged structure
		readJSON.mockImplementation((filepath, projectRoot, tag) => {
			return tag === 'main' ? sampleTasks : sampleTasks
		})
		writeJSON.mockResolvedValue()

		// Spy on utility functions and make them return expected objects
		jest.spyOn(utilsModule, 'parseDependencies').mockImplementation((input, tasks) => ({
			dependencies: Array.isArray(input) ? input : (input ? [input] : []),
			errors: [],
			warnings: []
		}))
		jest.spyOn(utilsModule, 'parseSpecFiles').mockImplementation((input) => {
			if (!input) return []
			if (Array.isArray(input)) return input
			if (typeof input === 'string') {
				return input.split(',').map(file => ({ type: 'spec', title: 'Specification Document', file: file.trim() }))
			}
			return []
		})
		jest.spyOn(utilsModule, 'validateSpecFiles').mockReturnValue({
			isValid: true,
			errors: [],
			warnings: []
		})

		// Mock validateTaskData function
		jest.spyOn(taskValidationModule, 'validateTaskData').mockReturnValue({
			isValid: true,
			errors: [],
			warnings: []
		})
	})

	describe('Manual task creation mode', () => {
		test('should create task with all manual fields provided', async () => {
			// Arrange
			const manualTaskData = {
				title: 'User Authentication',
				description: 'Implement JWT-based user authentication',
				details: 'Use bcrypt for password hashing and JWT for tokens',
				testStrategy: 'Unit tests for auth functions, integration tests for login flow',
				spec_files: [{ type: 'spec', title: 'API Specification', file: 'docs/auth-api.md' }]
			}
			const context = {
				projectRoot: '/mock/project/root',
				tag: 'main'
			}

			// Act
			const result = await addTask(
				'tasks/tasks.json',
				[], // dependencies
				'high', // priority
				context,
				'text',
				manualTaskData
			)

			// Assert
			expect(result.newTaskId).toBe(4) // Next ID after existing tasks 1, 2, 3
			expect(result.telemetryData).toBeNull() // No AI usage in manual mode
			expect(writeJSON).toHaveBeenCalledWith(
				'tasks/tasks.json',
				expect.objectContaining({
					main: expect.objectContaining({
						tasks: expect.arrayContaining([
							expect.objectContaining({
								id: 4, // Next ID after existing tasks 1, 2, 3
								title: 'User Authentication',
								description: 'Implement JWT-based user authentication',
								details: 'Use bcrypt for password hashing and JWT for tokens',
								testStrategy: 'Unit tests for auth functions, integration tests for login flow',
								spec_files: [{ type: 'spec', title: 'API Specification', file: 'docs/auth-api.md' }],
								priority: 'high',
								status: 'pending'
							})
						])
					})
				}),
				'/mock/project/root',
				'main'
			)
		})

		test('should handle dependencies parsing correctly', async () => {
			// Arrange
			const manualTaskData = {
				title: 'Database Setup',
				description: 'Setup database connection',
				details: 'Configure PostgreSQL connection',
				testStrategy: 'Test connection and basic queries',
				spec_files: [{ type: 'spec', title: 'Database Schema', file: 'docs/db-schema.md' }]
			}
			const dependencies = [1, 2] // Pre-parsed dependencies
			const context = {
				projectRoot: '/mock/project/root',
				tag: 'main'
			}

			// Act
			await addTask(
				'tasks/tasks.json',
				dependencies,
				'medium',
				context,
				'text',
				manualTaskData
			)

			// Assert
			expect(writeJSON).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					main: expect.objectContaining({
						tasks: expect.arrayContaining([
							expect.objectContaining({
								dependencies: [1, 2]
							})
						])
					})
				}),
				expect.any(String),
				expect.any(String)
			)
		})

		test('should validate required fields in manual mode', async () => {
			// Arrange - missing required description
			const incompleteManualTaskData = {
				title: 'Incomplete Task',
				// missing description
			}
			const context = {
				projectRoot: '/mock/project/root',
				tag: 'main'
			}

			// Act & Assert - should fail at basic validation before schema validation
			await expect(
				addTask(
					'tasks/tasks.json',
					[],
					'medium',
					context,
					'text',
					incompleteManualTaskData
				)
			).rejects.toThrow('Manual task data must include at least a title and description.')
		})

		test('should handle spec_files parsing and validation', async () => {
			// Arrange
			const manualTaskData = {
				title: 'API Documentation',
				description: 'Create API documentation',
				details: 'Document all endpoints with examples',
				testStrategy: 'Verify documentation accuracy',
				spec_files: [
					{ type: 'spec', title: 'API Spec', file: 'docs/api.yaml' },
					{ type: 'design', title: 'UI Mockups', file: 'docs/ui-design.pdf' }
				]
			}
			const context = {
				projectRoot: '/mock/project/root',
				tag: 'main'
			}

			// Act
			await addTask(
				'tasks/tasks.json',
				[],
				'medium',
				context,
				'text',
				manualTaskData
			)

			// Assert
			expect(writeJSON).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					main: expect.objectContaining({
						tasks: expect.arrayContaining([
							expect.objectContaining({
								spec_files: [
									{ type: 'spec', title: 'API Spec', file: 'docs/api.yaml' },
									{ type: 'design', title: 'UI Mockups', file: 'docs/ui-design.pdf' }
								]
							})
						])
					})
				}),
				expect.any(String),
				expect.any(String)
			)
		})
	})

	describe('Error handling', () => {
		test('should handle file read errors', async () => {
			// Arrange
			readJSON.mockImplementation(() => {
				throw new Error('File read failed')
			})
			const manualTaskData = {
				title: 'Test Task',
				description: 'Test description',
				details: 'Test details',
				testStrategy: 'Test strategy'
			}
			const context = {
				projectRoot: '/mock/project/root',
				tag: 'main'
			}

			// Act & Assert
			await expect(
				addTask(
					'tasks/tasks.json',
					[],
					'medium',
					context,
					'text',
					manualTaskData
				)
			).rejects.toThrow('File read failed')
		})

		test('should handle file write errors', async () => {
			// Arrange
			writeJSON.mockImplementation(() => {
				throw new Error('File write failed')
			})
			const manualTaskData = {
				title: 'Test Task',
				description: 'Test description',
				details: 'Test details',
				testStrategy: 'Test strategy',
				spec_files: [{ type: 'spec', title: 'Test Spec', file: 'docs/test.md' }]
			}
			const context = {
				projectRoot: '/mock/project/root',
				tag: 'main'
			}

			// Act & Assert
			await expect(
				addTask(
					'tasks/tasks.json',
					[],
					'medium',
					context,
					'text',
					manualTaskData
				)
			).rejects.toThrow('File write failed')
		})
	})
})
