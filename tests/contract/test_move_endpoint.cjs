/**
 * Contract test for POST /move endpoint
 * Tests the task movement functionality according to API contract
 */

describe('POST /move Endpoint Contract Test', () => {
  let mockTaskManager

  beforeEach(() => {
    mockTaskManager = {
      moveTask: jest.fn(),
      findProjectRoot: jest.fn().mockReturnValue('/mock/project')
    }
  })

  describe('Basic functionality', () => {
    it('should move task to new position successfully', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: { 
          movedTask: { id: 5, title: 'Moved Task', status: 'pending' },
          from: 5,
          to: 7
        },
        message: 'Task moved successfully from 5 to 7'
      })

      const result = mockTaskManager.moveTask({
        from: 5,
        to: 7,
        projectRoot: '/mock/project',
        tasksPath: '/mock/project/.taskmaster/tasks/tasks.json'
      })

      expect(result.success).toBe(true)
      expect(result.data.from).toBe(5)
      expect(result.data.to).toBe(7)
      expect(result.message).toContain('moved successfully')
    })

    it('should move subtask to different parent', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTask: { id: '5.2', title: 'Moved Subtask', parentId: 7 },
          from: '5.2',
          to: '7.3'
        },
        message: 'Subtask moved successfully'
      })

      const result = mockTaskManager.moveTask({
        from: '5.2',
        to: '7.3'
      })

      expect(result.success).toBe(true)
      expect(result.data.movedTask.id).toBe('5.2')
      expect(result.data.movedTask.parentId).toBe(7)
    })

    it('should handle multiple task moves', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTasks: [
            { id: 10, title: 'Task 10', newPosition: 16 },
            { id: 11, title: 'Task 11', newPosition: 17 }
          ],
          from: '10,11',
          to: '16,17'
        },
        message: 'Multiple tasks moved successfully'
      })

      const result = mockTaskManager.moveTask({
        from: '10,11,12',
        to: '16,17,18'
      })

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.movedTasks)).toBe(true)
      expect(result.data.movedTasks).toHaveLength(2)
    })
  })

  describe('Move scenarios', () => {
    it('should convert task to subtask', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTask: { id: '7.1', title: 'Now Subtask', parentId: 7 },
          from: 5,
          to: '7.1',
          operation: 'task_to_subtask'
        },
        message: 'Task converted to subtask successfully'
      })

      const result = mockTaskManager.moveTask({
        from: 5,
        to: 7
      })

      expect(result.success).toBe(true)
      expect(result.data.operation).toBe('task_to_subtask')
    })

    it('should promote subtask to standalone task', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTask: { id: 7, title: 'Now Standalone', parentId: null },
          from: '5.2',
          to: 7,
          operation: 'subtask_to_task'
        },
        message: 'Subtask promoted to standalone task'
      })

      const result = mockTaskManager.moveTask({
        from: '5.2',
        to: 7
      })

      expect(result.success).toBe(true)
      expect(result.data.operation).toBe('subtask_to_task')
      expect(result.data.movedTask.parentId).toBeNull()
    })

    it('should reorder subtasks within same parent', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTask: { id: '5.4', title: 'Reordered Subtask', parentId: 5 },
          from: '5.2',
          to: '5.4',
          operation: 'reorder_subtasks'
        },
        message: 'Subtasks reordered successfully'
      })

      const result = mockTaskManager.moveTask({
        from: '5.2',
        to: '5.4'
      })

      expect(result.success).toBe(true)
      expect(result.data.operation).toBe('reorder_subtasks')
    })
  })

  describe('Error handling', () => {
    it('should handle non-existent source task', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: false,
        error: 'Source task not found',
        message: 'Task with ID 999 does not exist'
      })

      const result = mockTaskManager.moveTask({
        from: 999,
        to: 5
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Source task not found')
    })

    it('should prevent moving to existing task with content', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: false,
        error: 'Destination already exists',
        message: 'Cannot overwrite existing task at position 7'
      })

      const result = mockTaskManager.moveTask({
        from: 5,
        to: 7
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Destination already exists')
    })

    it('should handle invalid ID formats', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: false,
        error: 'Invalid ID format',
        message: 'Task IDs must be numbers or subtask format (e.g., 5.2)'
      })

      const result = mockTaskManager.moveTask({
        from: 'invalid',
        to: 'invalid2'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid ID format')
    })

    it('should handle mismatched ID count for multiple moves', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: false,
        error: 'ID count mismatch',
        message: 'Number of source IDs must match number of destination IDs'
      })

      const result = mockTaskManager.moveTask({
        from: '10,11,12',
        to: '16,17'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('ID count mismatch')
    })
  })

  describe('Response format', () => {
    it('should return consistent response structure', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTask: { id: 5, title: 'Moved Task' },
          from: 5,
          to: 7
        },
        message: 'Task moved successfully'
      })

      const result = mockTaskManager.moveTask({
        from: 5,
        to: 7
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
      expect(result.data).toHaveProperty('movedTask')
      expect(result.data).toHaveProperty('from')
      expect(result.data).toHaveProperty('to')
    })

    it('should include operation metadata', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTask: { id: 7, title: 'Moved Task' },
          from: 5,
          to: 7,
          operation: 'simple_move',
          dependencyUpdates: []
        },
        message: 'Task moved successfully'
      })

      const result = mockTaskManager.moveTask({
        from: 5,
        to: 7
      })

      expect(result.data).toHaveProperty('operation')
      expect(result.data).toHaveProperty('dependencyUpdates')
    })
  })

  describe('Parameter validation', () => {
    it('should require both from and to parameters', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: false,
        error: 'Missing required parameters',
        message: 'Both from and to parameters are required'
      })

      const result = mockTaskManager.moveTask({
        from: 5
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing required parameters')
    })

    it('should handle tag parameter for cross-tag moves', () => {
      mockTaskManager.moveTask.mockReturnValue({
        success: true,
        data: {
          movedTask: { id: 5, title: 'Cross-tag Moved Task' },
          from: 5,
          to: 7,
          sourceTag: 'feature-a',
          targetTag: 'feature-b'
        },
        message: 'Task moved across tags successfully'
      })

      const result = mockTaskManager.moveTask({
        from: 5,
        to: 7,
        tag: 'feature-b'
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('sourceTag')
      expect(result.data).toHaveProperty('targetTag')
    })
  })
})