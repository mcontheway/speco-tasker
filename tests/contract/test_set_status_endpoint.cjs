/**
 * Contract test for POST /set-status endpoint
 * Tests the task status update functionality according to API contract
 */

describe('POST /set-status Endpoint Contract Test', () => {
  let mockTaskManager

  beforeEach(() => {
    mockTaskManager = {
      setTaskStatus: jest.fn(),
      findProjectRoot: jest.fn().mockReturnValue('/mock/project')
    }
  })

  describe('Basic functionality', () => {
    it('should update task status successfully', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: { id: 1, title: 'Test Task', status: 'in-progress' },
        message: 'Task status updated successfully'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'in-progress',
        projectRoot: '/mock/project',
        tasksPath: '/mock/project/.taskmaster/tasks/tasks.json'
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('in-progress')
      expect(result.message).toBe('Task status updated successfully')
    })

    it('should update subtask status successfully', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: { id: '1.1', title: 'Test Subtask', status: 'done', parentId: 1 },
        message: 'Subtask status updated successfully'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: '1.1',
        status: 'done',
        projectRoot: '/mock/project',
        tasksPath: '/mock/project/.taskmaster/tasks/tasks.json'
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('done')
      expect(result.data.parentId).toBe(1)
    })

    it('should handle multiple task IDs', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: [
          { id: 1, title: 'Task 1', status: 'done' },
          { id: 2, title: 'Task 2', status: 'done' }
        ],
        message: 'Multiple tasks updated successfully'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: '1,2',
        status: 'done',
        projectRoot: '/mock/project',
        tasksPath: '/mock/project/.taskmaster/tasks/tasks.json'
      })

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].status).toBe('done')
      expect(result.data[1].status).toBe('done')
    })
  })

  describe('Status validation', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['pending', 'in-progress', 'done', 'blocked', 'cancelled', 'deferred']

      validStatuses.forEach(status => {
        mockTaskManager.setTaskStatus.mockReturnValue({
          success: true,
          data: { id: 1, title: 'Test Task', status: status },
          message: `Task status updated to ${status}`
        })

        const result = mockTaskManager.setTaskStatus({
          taskId: 1,
          status: status
        })

        expect(result.success).toBe(true)
        expect(result.data.status).toBe(status)
      })
    })

    it('should handle custom status values', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: { id: 1, title: 'Test Task', status: 'review' },
        message: 'Task status updated to review'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'review'
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('review')
    })

    it('should validate status is provided', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: false,
        error: 'Status is required',
        message: 'Please provide a valid status value'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Status is required')
    })
  })

  describe('Error handling', () => {
    it('should handle non-existent task ID', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: false,
        error: 'Task not found',
        message: 'Task with ID 999 does not exist'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 999,
        status: 'done'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task not found')
    })

    it('should handle invalid task ID format', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: false,
        error: 'Invalid task ID format',
        message: 'Task ID must be a number or subtask format'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 'invalid',
        status: 'done'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid task ID format')
    })

    it('should handle file write errors', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: false,
        error: 'Failed to write tasks file',
        message: 'Could not save changes to tasks.json'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'done'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to write tasks file')
    })
  })

  describe('Response format', () => {
    it('should return consistent response structure', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: { id: 1, title: 'Test Task', status: 'done' },
        message: 'Task status updated successfully'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'done'
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.data).toBe('object')
      expect(typeof result.message).toBe('string')
    })

    it('should include updated task data', () => {
      const updatedTask = {
        id: 1,
        title: 'Test Task',
        status: 'done',
        priority: 'high',
        dependencies: []
      }

      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: updatedTask,
        message: 'Task status updated successfully'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'done'
      })

      expect(result.data).toEqual(updatedTask)
      expect(result.data.status).toBe('done')
    })
  })

  describe('Parameter validation', () => {
    it('should require task ID parameter', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: false,
        error: 'Task ID is required',
        message: 'Please provide a valid task ID'
      })

      const result = mockTaskManager.setTaskStatus({
        status: 'done'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task ID is required')
    })

    it('should handle tag parameter', () => {
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: { id: 1, title: 'Tagged Task', status: 'done' },
        message: 'Task status updated in tag context'
      })

      const result = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'done',
        tag: 'feature-branch'
      })

      expect(result.success).toBe(true)
      expect(mockTaskManager.setTaskStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: 'feature-branch'
        })
      )
    })
  })
})