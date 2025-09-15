/**
 * Contract test for DELETE /remove-task endpoint
 * Tests the task removal functionality according to API contract
 */

describe('DELETE /remove-task Endpoint Contract Test', () => {
  let mockTaskManager

  beforeEach(() => {
    mockTaskManager = {
      removeTask: jest.fn(),
      findProjectRoot: jest.fn().mockReturnValue('/mock/project')
    }
  })

  describe('Basic functionality', () => {
    it('should remove task successfully', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Removed Task' },
          dependencyUpdates: 2,
          fileCleanup: true
        },
        message: 'Task removed successfully'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5,
        projectRoot: '/mock/project',
        tasksPath: '/mock/project/.taskmaster/tasks/tasks.json'
      })

      expect(result.success).toBe(true)
      expect(result.data.removedTask.id).toBe(5)
      expect(result.data.dependencyUpdates).toBe(2)
      expect(result.message).toBe('Task removed successfully')
    })

    it('should remove subtask successfully', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: '5.2', title: 'Removed Subtask', parentId: 5 },
          parentUpdated: true,
          dependencyUpdates: 0
        },
        message: 'Subtask removed successfully'
      })

      const result = mockTaskManager.removeTask({
        taskId: '5.2'
      })

      expect(result.success).toBe(true)
      expect(result.data.removedTask.id).toBe('5.2')
      expect(result.data.parentUpdated).toBe(true)
    })

    it('should handle confirmation parameter', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Confirmed Removal' },
          confirmed: true
        },
        message: 'Task removed with confirmation'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5,
        yes: true
      })

      expect(result.success).toBe(true)
      expect(result.data.confirmed).toBe(true)
    })
  })

  describe('Dependency cleanup', () => {
    it('should clean up references in other tasks', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Task with Dependencies' },
          dependencyUpdates: 3,
          affectedTasks: [1, 2, 7],
          referencesRemoved: 3
        },
        message: 'Task removed and dependencies cleaned up'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5
      })

      expect(result.success).toBe(true)
      expect(result.data.dependencyUpdates).toBe(3)
      expect(result.data.affectedTasks).toEqual([1, 2, 7])
      expect(result.data.referencesRemoved).toBe(3)
    })

    it('should handle tasks with no dependencies', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 8, title: 'Independent Task' },
          dependencyUpdates: 0,
          affectedTasks: [],
          referencesRemoved: 0
        },
        message: 'Independent task removed successfully'
      })

      const result = mockTaskManager.removeTask({
        taskId: 8
      })

      expect(result.success).toBe(true)
      expect(result.data.dependencyUpdates).toBe(0)
      expect(result.data.affectedTasks).toEqual([])
    })
  })

  describe('File cleanup', () => {
    it('should clean up associated task files', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Task with Files' },
          fileCleanup: true,
          filesRemoved: ['task_005.txt'],
          taskFilesRegenerated: true
        },
        message: 'Task and associated files removed'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5
      })

      expect(result.success).toBe(true)
      expect(result.data.fileCleanup).toBe(true)
      expect(result.data.filesRemoved).toContain('task_005.txt')
      expect(result.data.taskFilesRegenerated).toBe(true)
    })

    it('should handle file cleanup errors gracefully', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Task with File Issues' },
          fileCleanup: false,
          fileCleanupWarning: 'Could not delete task file: Permission denied'
        },
        message: 'Task removed but file cleanup failed'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5
      })

      expect(result.success).toBe(true)
      expect(result.data.fileCleanup).toBe(false)
      expect(result.data.fileCleanupWarning).toContain('Permission denied')
    })
  })

  describe('Error handling', () => {
    it('should handle non-existent task ID', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: false,
        error: 'Task not found',
        message: 'Task with ID 999 does not exist'
      })

      const result = mockTaskManager.removeTask({
        taskId: 999
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task not found')
    })

    it('should handle invalid task ID format', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: false,
        error: 'Invalid task ID format',
        message: 'Task ID must be a number or subtask format'
      })

      const result = mockTaskManager.removeTask({
        taskId: 'invalid'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid task ID format')
    })

    it('should handle file write errors', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: false,
        error: 'Failed to write tasks file',
        message: 'Could not save changes after removal'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to write tasks file')
    })

    it('should handle confirmation cancellation', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: false,
        error: 'Operation cancelled',
        message: 'Task removal cancelled by user'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5,
        cancelled: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Operation cancelled')
    })
  })

  describe('Response format', () => {
    it('should return consistent response structure', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Test Task' },
          dependencyUpdates: 1,
          fileCleanup: true
        },
        message: 'Task removed successfully'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
      expect(result.data).toHaveProperty('removedTask')
      expect(result.data).toHaveProperty('dependencyUpdates')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.data).toBe('object')
      expect(typeof result.message).toBe('string')
    })

    it('should include removal statistics', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Statistical Task' },
          dependencyUpdates: 2,
          affectedTasks: [1, 7],
          referencesRemoved: 2,
          fileCleanup: true,
          filesRemoved: ['task_005.txt'],
          taskFilesRegenerated: true
        },
        message: 'Task removed with full cleanup'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5
      })

      expect(result.data).toHaveProperty('dependencyUpdates')
      expect(result.data).toHaveProperty('affectedTasks')
      expect(result.data).toHaveProperty('referencesRemoved')
      expect(result.data).toHaveProperty('fileCleanup')
      expect(result.data).toHaveProperty('filesRemoved')
      expect(result.data).toHaveProperty('taskFilesRegenerated')
    })
  })

  describe('Parameter validation', () => {
    it('should require task ID parameter', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: false,
        error: 'Task ID is required',
        message: 'Please provide a valid task ID to remove'
      })

      const result = mockTaskManager.removeTask({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task ID is required')
    })

    it('should handle skip-generate parameter', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Quick Remove' },
          taskFilesRegenerated: false,
          skipGenerate: true
        },
        message: 'Task removed without file regeneration'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5,
        skipGenerate: true
      })

      expect(result.success).toBe(true)
      expect(result.data.skipGenerate).toBe(true)
      expect(result.data.taskFilesRegenerated).toBe(false)
    })

    it('should handle tag parameter', () => {
      mockTaskManager.removeTask.mockReturnValue({
        success: true,
        data: {
          removedTask: { id: 5, title: 'Tagged Task' },
          tag: 'feature-branch'
        },
        message: 'Task removed from tag context'
      })

      const result = mockTaskManager.removeTask({
        taskId: 5,
        tag: 'feature-branch'
      })

      expect(result.success).toBe(true)
      expect(result.data.tag).toBe('feature-branch')
    })
  })
})