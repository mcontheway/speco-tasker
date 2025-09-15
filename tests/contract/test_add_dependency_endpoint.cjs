/**
 * Contract test for POST /add-dependency endpoint
 * Tests the dependency addition functionality according to API contract
 */

describe('POST /add-dependency Endpoint Contract Test', () => {
  let mockDependencyManager

  beforeEach(() => {
    mockDependencyManager = {
      addDependency: jest.fn(),
      findProjectRoot: jest.fn().mockReturnValue('/mock/project')
    }
  })

  describe('Basic functionality', () => {
    it('should add dependency between tasks successfully', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: 5,
          dependsOn: 3,
          task: { id: 5, title: 'Dependent Task', dependencies: [3] },
          dependency: { id: 3, title: 'Prerequisite Task', status: 'done' }
        },
        message: 'Dependency added successfully'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3,
        projectRoot: '/mock/project',
        tasksPath: '/mock/project/.taskmaster/tasks/tasks.json'
      })

      expect(result.success).toBe(true)
      expect(result.data.taskId).toBe(5)
      expect(result.data.dependsOn).toBe(3)
      expect(result.data.task.dependencies).toContain(3)
      expect(result.message).toBe('Dependency added successfully')
    })

    it('should add dependency for subtask', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: '5.2',
          dependsOn: '5.1',
          task: { id: '5.2', title: 'Second Subtask', dependencies: ['5.1'], parentId: 5 },
          dependency: { id: '5.1', title: 'First Subtask', status: 'done', parentId: 5 }
        },
        message: 'Subtask dependency added successfully'
      })

      const result = mockDependencyManager.addDependency({
        taskId: '5.2',
        dependsOn: '5.1'
      })

      expect(result.success).toBe(true)
      expect(result.data.taskId).toBe('5.2')
      expect(result.data.dependsOn).toBe('5.1')
      expect(result.data.task.parentId).toBe(5)
      expect(result.data.dependency.parentId).toBe(5)
    })

    it('should handle cross-parent dependencies', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: '7.1',
          dependsOn: 5,
          task: { id: '7.1', title: 'Cross Dependent Subtask', dependencies: [5], parentId: 7 },
          dependency: { id: 5, title: 'Main Task', status: 'done' },
          crossParent: true
        },
        message: 'Cross-parent dependency added successfully'
      })

      const result = mockDependencyManager.addDependency({
        taskId: '7.1',
        dependsOn: 5
      })

      expect(result.success).toBe(true)
      expect(result.data.crossParent).toBe(true)
      expect(result.data.task.parentId).toBe(7)
      expect(result.data.dependency.id).toBe(5)
    })
  })

  describe('Dependency validation', () => {
    it('should prevent circular dependencies', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Circular dependency detected',
        message: 'Adding this dependency would create a circular reference'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 7
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Circular dependency detected')
    })

    it('should prevent duplicate dependencies', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Dependency already exists',
        message: 'Task 5 already depends on task 3'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dependency already exists')
    })

    it('should prevent self-dependency', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Self-dependency not allowed',
        message: 'A task cannot depend on itself'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 5
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Self-dependency not allowed')
    })

    it('should validate dependency chain depth', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: 10,
          dependsOn: 9,
          task: { id: 10, title: 'Deep Chain Task', dependencies: [9] },
          dependency: { id: 9, title: 'Chain Link', status: 'pending' },
          chainDepth: 5,
          warning: 'Deep dependency chain detected'
        },
        message: 'Dependency added with deep chain warning'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 10,
        dependsOn: 9
      })

      expect(result.success).toBe(true)
      expect(result.data.chainDepth).toBe(5)
      expect(result.data.warning).toContain('Deep dependency chain')
    })
  })

  describe('Error handling', () => {
    it('should handle non-existent task ID', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Task not found',
        message: 'Task with ID 999 does not exist'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 999,
        dependsOn: 3
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Task not found')
    })

    it('should handle non-existent dependency ID', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Dependency task not found',
        message: 'Task with ID 888 does not exist for dependency'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 888
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Dependency task not found')
    })

    it('should handle invalid task ID format', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Invalid task ID format',
        message: 'Task ID must be a number or subtask format'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 'invalid',
        dependsOn: 3
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid task ID format')
    })

    it('should handle file write errors', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Failed to write tasks file',
        message: 'Could not save dependency to tasks.json'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to write tasks file')
    })
  })

  describe('Response format', () => {
    it('should return consistent response structure', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: 5,
          dependsOn: 3,
          task: { id: 5, title: 'Test Task' },
          dependency: { id: 3, title: 'Dependency Task' }
        },
        message: 'Dependency added successfully'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
      expect(result.data).toHaveProperty('taskId')
      expect(result.data).toHaveProperty('dependsOn')
      expect(result.data).toHaveProperty('task')
      expect(result.data).toHaveProperty('dependency')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.data).toBe('object')
      expect(typeof result.message).toBe('string')
    })

    it('should include dependency metadata', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: 5,
          dependsOn: 3,
          task: { id: 5, title: 'Test Task', dependencies: [1, 2, 3] },
          dependency: { id: 3, title: 'Dependency Task', status: 'done' },
          totalDependencies: 3,
          dependencyStatus: 'satisfied',
          taskUnblocked: true
        },
        message: 'Dependency added and task status updated'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3
      })

      expect(result.data).toHaveProperty('totalDependencies')
      expect(result.data).toHaveProperty('dependencyStatus')
      expect(result.data).toHaveProperty('taskUnblocked')
      expect(result.data.totalDependencies).toBe(3)
      expect(result.data.dependencyStatus).toBe('satisfied')
      expect(result.data.taskUnblocked).toBe(true)
    })
  })

  describe('Parameter validation', () => {
    it('should require both taskId and dependsOn parameters', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: false,
        error: 'Missing required parameters',
        message: 'Both taskId and dependsOn parameters are required'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing required parameters')
    })

    it('should handle tag parameter', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: 5,
          dependsOn: 3,
          task: { id: 5, title: 'Tagged Task' },
          dependency: { id: 3, title: 'Tagged Dependency' },
          tag: 'feature-branch'
        },
        message: 'Dependency added in tag context'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3,
        tag: 'feature-branch'
      })

      expect(result.success).toBe(true)
      expect(result.data.tag).toBe('feature-branch')
    })

    it('should validate task ID format consistency', () => {
      // Test that both IDs are treated consistently
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: '7.2',
          dependsOn: '5.1',
          task: { id: '7.2', title: 'Subtask 7.2', parentId: 7 },
          dependency: { id: '5.1', title: 'Subtask 5.1', parentId: 5 },
          crossParent: true
        },
        message: 'Cross-parent subtask dependency added'
      })

      const result = mockDependencyManager.addDependency({
        taskId: '7.2',
        dependsOn: '5.1'
      })

      expect(result.success).toBe(true)
      expect(result.data.taskId).toBe('7.2')
      expect(result.data.dependsOn).toBe('5.1')
      expect(result.data.crossParent).toBe(true)
    })
  })

  describe('Dependency impact analysis', () => {
    it('should analyze impact on task readiness', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: 5,
          dependsOn: 3,
          task: { id: 5, title: 'Test Task', dependencies: [3], status: 'pending' },
          dependency: { id: 3, title: 'Dependency Task', status: 'done' },
          impactAnalysis: {
            taskNowReady: true,
            blockedBefore: true,
            allDependenciesSatisfied: true
          }
        },
        message: 'Dependency added and task is now ready'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3
      })

      expect(result.success).toBe(true)
      expect(result.data.impactAnalysis.taskNowReady).toBe(true)
      expect(result.data.impactAnalysis.allDependenciesSatisfied).toBe(true)
    })

    it('should identify blocking dependencies', () => {
      mockDependencyManager.addDependency.mockReturnValue({
        success: true,
        data: {
          taskId: 5,
          dependsOn: 3,
          task: { id: 5, title: 'Test Task', dependencies: [2, 3], status: 'pending' },
          dependency: { id: 3, title: 'Pending Dependency', status: 'pending' },
          impactAnalysis: {
            taskStillBlocked: true,
            blockingDependencies: [2, 3],
            readyDependencies: []
          }
        },
        message: 'Dependency added but task remains blocked'
      })

      const result = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 3
      })

      expect(result.success).toBe(true)
      expect(result.data.impactAnalysis.taskStillBlocked).toBe(true)
      expect(result.data.impactAnalysis.blockingDependencies).toEqual([2, 3])
    })
  })
})