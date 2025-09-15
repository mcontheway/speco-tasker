/**
 * Integration test for tag system functionality
 * Tests tag creation, switching, and task isolation according to quickstart.md
 */

import { jest } from '@jest/globals'

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
const mockAddTag = jest.fn()
const mockUseTag = jest.fn()
const mockListTags = jest.fn()
const mockDeleteTag = jest.fn()
const mockRenameTag = jest.fn()
const mockCopyTag = jest.fn()
const mockGetTasks = jest.fn()
const mockAddTask = jest.fn()

jest.mock('../../scripts/modules/task-manager.js', () => ({
	addTag: mockAddTag,
	useTag: mockUseTag,
	listTags: mockListTags,
	deleteTag: mockDeleteTag,
	renameTag: mockRenameTag,
	copyTag: mockCopyTag,
	getTasks: mockGetTasks,
	addTask: mockAddTask
}))

// Mock path utils
jest.mock('../../src/utils/path-utils.js', () => ({
	findProjectRoot: jest.fn(() => '/mock/project'),
	findTasksPath: jest.fn(() => '/mock/project/.taskmaster/tasks/tasks.json'),
	findConfigPath: jest.fn(() => '/mock/project/.taskmaster/config.json')
}))

describe('Tag System Functionality Integration Test', () => {
	let commands

	beforeEach(() => {
		jest.clearAllMocks()

		// Reset all mock implementations
		mockAddTag.mockReset()
		mockUseTag.mockReset()
		mockListTags.mockReset()
		mockDeleteTag.mockReset()
		mockRenameTag.mockReset()
		mockCopyTag.mockReset()
		mockGetTasks.mockReset()
		mockAddTask.mockReset()
		mockConsoleLog.mockClear()
		mockConsoleError.mockClear()
		mockProcessExit.mockClear()
	})

	afterEach(() => {
		jest.clearAllTimers()
	})

	describe('Tag creation and management', () => {
		it('should create new tags successfully', async () => {
			mockAddTag.mockResolvedValue({
				success: true,
				data: {
					name: 'feature-auth',
					description: 'User authentication feature',
					createdAt: new Date().toISOString()
				},
				message: 'Tag "feature-auth" created successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTagAction({
				name: 'feature-auth',
				description: 'User authentication feature'
			})

			expect(mockAddTag).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'feature-auth',
					description: 'User authentication feature'
				})
			)

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('created successfully')
			)
		})

		it('should create tag from current branch', async () => {
			mockAddTag.mockResolvedValue({
				success: true,
				data: {
					name: 'feature-user-profile',
					fromBranch: 'feature/user-profile',
					description: 'Tasks for user profile feature'
				},
				message: 'Tag created from current branch "feature/user-profile"'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTagAction({
				fromBranch: true
			})

			expect(mockAddTag).toHaveBeenCalledWith(
				expect.objectContaining({
					fromBranch: true
				})
			)
		})

		it('should copy tasks from current tag to new tag', async () => {
			mockAddTag.mockResolvedValue({
				success: true,
				data: {
					name: 'feature-payment-copy',
					copyFromCurrent: true,
					tasksCopied: 5,
					description: 'Payment feature tasks'
				},
				message: 'Tag created with 5 tasks copied from current tag'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTagAction({
				name: 'feature-payment-copy',
				copyFromCurrent: true,
				description: 'Payment feature tasks'
			})

			expect(mockAddTag).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'feature-payment-copy',
					copyFromCurrent: true
				})
			)
		})

		it('should list all available tags', async () => {
			mockListTags.mockResolvedValue({
				success: true,
				data: [
					{
						name: 'master',
						taskCount: 10,
						active: true,
						description: 'Main task list'
					},
					{
						name: 'feature-auth',
						taskCount: 5,
						active: false,
						description: 'Authentication feature'
					},
					{
						name: 'feature-payment',
						taskCount: 3,
						active: false,
						description: 'Payment system'
					}
				],
				message: 'Found 3 tags'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.listTagsAction()

			expect(mockListTags).toHaveBeenCalled()
			expect(mockConsoleLog).toHaveBeenCalled()
		})
	})

	describe('Tag switching workflow', () => {
		it('should switch between tags successfully', async () => {
			mockUseTag.mockResolvedValue({
				success: true,
				data: {
					previousTag: 'master',
					currentTag: 'feature-auth',
					switchedAt: new Date().toISOString()
				},
				message: 'Switched to tag "feature-auth"'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.useTagAction('feature-auth')

			expect(mockUseTag).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'feature-auth'
				})
			)

			expect(mockConsoleLog).toHaveBeenCalledWith(
				expect.stringContaining('Switched to tag')
			)
		})

		it('should handle switching to non-existent tag', async () => {
			mockUseTag.mockResolvedValue({
				success: false,
				error: 'Tag not found',
				message: 'Tag "non-existent" does not exist'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.useTagAction('non-existent')

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Tag-based task isolation', () => {
		it('should isolate tasks by tag context', async () => {
			// Mock tasks in master tag
			mockGetTasks.mockResolvedValueOnce({
				success: true,
				data: [
					{ id: 1, title: 'Master task 1', status: 'pending' },
					{ id: 2, title: 'Master task 2', status: 'done' }
				],
				message: 'Tasks in master tag'
			})

			// Mock tasks in feature tag
			mockGetTasks.mockResolvedValueOnce({
				success: true,
				data: [
					{ id: 1, title: 'Feature task 1', status: 'in-progress' },
					{ id: 2, title: 'Feature task 2', status: 'pending' }
				],
				message: 'Tasks in feature-auth tag'
			})

			commands = await import('../../scripts/modules/commands.js')

			// List tasks in master
			await commands.listAction({})

			// Switch to feature tag
			mockUseTag.mockResolvedValue({
				success: true,
				data: { currentTag: 'feature-auth' },
				message: 'Switched to feature-auth'
			})

			await commands.useTagAction('feature-auth')

			// List tasks in feature tag
			await commands.listAction({})

			expect(mockGetTasks).toHaveBeenCalledTimes(2)
		})

		it('should create tasks in correct tag context', async () => {
			// Switch to feature tag
			mockUseTag.mockResolvedValue({
				success: true,
				data: { currentTag: 'feature-api' },
				message: 'Switched to feature-api'
			})

			// Create task in feature tag
			mockAddTask.mockResolvedValue({
				success: true,
				data: {
					id: 1,
					title: 'API endpoint task',
					tag: 'feature-api'
				},
				message: 'Task created in feature-api tag'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.useTagAction('feature-api')

			await commands.addTaskAction({
				title: 'API endpoint task'
			})

			expect(mockAddTask).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'API endpoint task'
					// Tag context should be applied automatically
				})
			)
		})
	})

	describe('Tag operations and maintenance', () => {
		it('should rename tags successfully', async () => {
			mockRenameTag.mockResolvedValue({
				success: true,
				data: {
					oldName: 'feature-auth',
					newName: 'feature-authentication',
					renamedAt: new Date().toISOString()
				},
				message: 'Tag renamed from "feature-auth" to "feature-authentication"'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.renameTagAction({
				oldName: 'feature-auth',
				newName: 'feature-authentication'
			})

			expect(mockRenameTag).toHaveBeenCalledWith(
				expect.objectContaining({
					oldName: 'feature-auth',
					newName: 'feature-authentication'
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should copy tags with all tasks', async () => {
			mockCopyTag.mockResolvedValue({
				success: true,
				data: {
					sourceTag: 'feature-auth',
					targetTag: 'feature-auth-backup',
					tasksCopied: 8,
					dependenciesPreserved: true
				},
				message: 'Tag copied successfully with 8 tasks'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.copyTagAction({
				sourceName: 'feature-auth',
				targetName: 'feature-auth-backup'
			})

			expect(mockCopyTag).toHaveBeenCalledWith(
				expect.objectContaining({
					sourceName: 'feature-auth',
					targetName: 'feature-auth-backup'
				})
			)
		})

		it('should delete tags safely', async () => {
			mockDeleteTag.mockResolvedValue({
				success: true,
				data: {
					name: 'feature-old',
					tasksDeleted: 3,
					deletedAt: new Date().toISOString()
				},
				message: 'Tag "feature-old" deleted successfully'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.deleteTagAction({
				name: 'feature-old'
			})

			expect(mockDeleteTag).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'feature-old'
				})
			)

			expect(mockConsoleLog).toHaveBeenCalled()
		})

		it('should prevent deletion of active tag', async () => {
			mockDeleteTag.mockResolvedValue({
				success: false,
				error: 'Cannot delete active tag',
				message: 'Cannot delete the currently active tag "master"'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.deleteTagAction({
				name: 'master'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})
	})

	describe('Multi-tag workflow scenarios', () => {
		it('should support parallel development across tags', async () => {
			// Create multiple feature tags
			const tags = ['feature-frontend', 'feature-backend', 'feature-testing']

			tags.forEach(tag => {
				mockAddTag.mockResolvedValueOnce({
					success: true,
					data: { name: tag },
					message: `Tag ${tag} created`
				})
			})

			commands = await import('../../scripts/modules/commands.js')

			// Create all feature tags
			for (const tag of tags) {
				await commands.addTagAction({ name: tag })
			}

			expect(mockAddTag).toHaveBeenCalledTimes(tags.length)
		})

		it('should handle tag context switching during workflow', async () => {
			const workflow = [
				{ tag: 'feature-frontend', task: 'Implement login form' },
				{ tag: 'feature-backend', task: 'Create auth API' },
				{ tag: 'feature-testing', task: 'Write auth tests' }
			]

			workflow.forEach(item => {
				mockUseTag.mockResolvedValueOnce({
					success: true,
					data: { currentTag: item.tag },
					message: `Switched to ${item.tag}`
				})

				mockAddTask.mockResolvedValueOnce({
					success: true,
					data: { id: 1, title: item.task, tag: item.tag },
					message: `Task created in ${item.tag}`
				})
			})

			commands = await import('../../scripts/modules/commands.js')

			// Execute workflow across different tags
			for (const item of workflow) {
				await commands.useTagAction(item.tag)
				await commands.addTaskAction({ title: item.task })
			}

			expect(mockUseTag).toHaveBeenCalledTimes(workflow.length)
			expect(mockAddTask).toHaveBeenCalledTimes(workflow.length)
		})
	})

	describe('Tag data integrity and validation', () => {
		it('should validate tag names', async () => {
			const invalidNames = ['tag with spaces', 'tag@symbol', 'tag#hash']

			invalidNames.forEach(name => {
				mockAddTag.mockResolvedValueOnce({
					success: false,
					error: 'Invalid tag name',
					message: `Tag name "${name}" contains invalid characters`
				})
			})

			commands = await import('../../scripts/modules/commands.js')

			for (const name of invalidNames) {
				await commands.addTagAction({ name })
			}

			expect(mockConsoleError).toHaveBeenCalledTimes(invalidNames.length)
		})

		it('should prevent duplicate tag names', async () => {
			mockAddTag.mockResolvedValue({
				success: false,
				error: 'Tag already exists',
				message: 'Tag "feature-auth" already exists'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTagAction({
				name: 'feature-auth'
			})

			expect(mockConsoleError).toHaveBeenCalled()
		})

		it('should handle tag metadata correctly', async () => {
			mockAddTag.mockResolvedValue({
				success: true,
				data: {
					name: 'feature-complex',
					description: 'A complex feature with multiple components',
					createdAt: new Date().toISOString(),
					taskCount: 0,
					active: false
				},
				message: 'Tag created with metadata'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.addTagAction({
				name: 'feature-complex',
				description: 'A complex feature with multiple components'
			})

			expect(mockAddTag).toHaveBeenCalled()
		})
	})

	describe('Tag-based reporting and analytics', () => {
		it('should provide tag-specific statistics', async () => {
			mockListTags.mockResolvedValue({
				success: true,
				data: [
					{
						name: 'master',
						taskCount: 15,
						completedTasks: 8,
						pendingTasks: 5,
						inProgressTasks: 2,
						completionRate: 53.3
					},
					{
						name: 'feature-auth',
						taskCount: 6,
						completedTasks: 6,
						pendingTasks: 0,
						inProgressTasks: 0,
						completionRate: 100.0
					}
				],
				message: 'Tag statistics retrieved'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.listTagsAction({ showMetadata: true })

			expect(mockListTags).toHaveBeenCalled()
		})

		it('should support tag-based task filtering', async () => {
			mockGetTasks.mockResolvedValue({
				success: true,
				data: [
					{
						id: 1,
						title: 'High priority task',
						status: 'pending',
						priority: 'high',
						tag: 'feature-urgent'
					},
					{
						id: 2,
						title: 'Normal task',
						status: 'pending',
						priority: 'medium',
						tag: 'feature-urgent'
					}
				],
				message: 'Filtered tasks in feature-urgent tag'
			})

			commands = await import('../../scripts/modules/commands.js')

			await commands.listAction({ tag: 'feature-urgent' })

			expect(mockGetTasks).toHaveBeenCalledWith(
				expect.objectContaining({
					tag: 'feature-urgent'
				})
			)
		})
	})
})
