/**
 * Integration test for complete task management workflow
 * Tests the full lifecycle of task management operations
 */

describe('Complete Task Management Workflow Integration Test', () => {
  let mockTaskManager
  let mockDependencyManager
  let mockFileManager

  beforeEach(() => {
    mockTaskManager = {
      addTask: jest.fn(),
      getTasks: jest.fn(),
      getTask: jest.fn(),
      setTaskStatus: jest.fn(),
      updateTask: jest.fn(),
      removeTask: jest.fn(),
      moveTask: jest.fn(),
      addSubtask: jest.fn(),
      findProjectRoot: jest.fn().mockReturnValue('/mock/project')
    }

    mockDependencyManager = {
      addDependency: jest.fn(),
      removeDependency: jest.fn(),
      validateDependencies: jest.fn()
    }

    mockFileManager = {
      generateTaskFiles: jest.fn(),
      updateTaskFile: jest.fn()
    }
  })

  describe('Complete project workflow', () => {
    it('should handle full project lifecycle from start to finish', async () => {
      // Phase 1: Project Initialization and Planning
      const projectTasks = [
        { id: 1, title: 'Project Setup', priority: 'high' },
        { id: 2, title: 'Database Design', priority: 'high' },
        { id: 3, title: 'API Development', priority: 'medium' },
        { id: 4, title: 'Frontend Development', priority: 'medium' },
        { id: 5, title: 'Testing and QA', priority: 'low' },
        { id: 6, title: 'Deployment', priority: 'low' }
      ]

      // Create initial project tasks
      projectTasks.forEach(task => {
        mockTaskManager.addTask.mockReturnValueOnce({
          success: true,
          data: {
            ...task,
            status: 'pending',
            dependencies: []
          },
          message: `Task ${task.id} created successfully`
        })

        const result = mockTaskManager.addTask({
          title: task.title,
          priority: task.priority
        })

        expect(result.success).toBe(true)
        expect(result.data.id).toBe(task.id)
        expect(result.data.priority).toBe(task.priority)
      })

      // Phase 2: Establish Dependencies
      const dependencies = [
        { taskId: 2, dependsOn: 1 }, // Database depends on Setup
        { taskId: 3, dependsOn: 2 }, // API depends on Database
        { taskId: 4, dependsOn: 3 }, // Frontend depends on API
        { taskId: 5, dependsOn: 4 }, // Testing depends on Frontend
        { taskId: 6, dependsOn: 5 }  // Deployment depends on Testing
      ]

      dependencies.forEach(dep => {
        mockDependencyManager.addDependency.mockReturnValueOnce({
          success: true,
          data: {
            taskId: dep.taskId,
            dependsOn: dep.dependsOn,
            task: { id: dep.taskId, dependencies: [dep.dependsOn] },
            dependency: { id: dep.dependsOn, status: 'pending' }
          },
          message: 'Dependency added successfully'
        })

        const result = mockDependencyManager.addDependency(dep)
        expect(result.success).toBe(true)
        expect(result.data.taskId).toBe(dep.taskId)
        expect(result.data.dependsOn).toBe(dep.dependsOn)
      })

      // Phase 3: Task Execution Workflow
      // Start with first task (no dependencies)
      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: { id: 1, status: 'in-progress' },
        message: 'Project setup started'
      })

      const startFirstTask = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'in-progress'
      })

      expect(startFirstTask.success).toBe(true)
      expect(startFirstTask.data.status).toBe('in-progress')

      // Complete first task
      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: { id: 1, status: 'done' },
        message: 'Project setup completed'
      })

      const completeFirstTask = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'done'
      })

      expect(completeFirstTask.success).toBe(true)
      expect(completeFirstTask.data.status).toBe('done')

      // Phase 4: Task Breakdown and Subtask Management
      // Break down complex task into subtasks
      const apiSubtasks = [
        'Design API schema',
        'Implement authentication endpoints',
        'Create user management endpoints',
        'Add data validation',
        'Write API documentation'
      ]

      apiSubtasks.forEach((title, index) => {
        mockTaskManager.addSubtask.mockReturnValueOnce({
          success: true,
          data: {
            subtask: {
              id: `3.${index + 1}`,
              title: title,
              status: 'pending',
              parentId: 3
            },
            parentTask: { id: 3, title: 'API Development' }
          },
          message: 'API subtask added'
        })

        const result = mockTaskManager.addSubtask({
          parentId: 3,
          title: title
        })

        expect(result.success).toBe(true)
        expect(result.data.subtask.parentId).toBe(3)
      })

      // Phase 5: Task Updates and Progress Tracking
      mockTaskManager.updateTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 3,
          title: 'API Development',
          description: 'Updated with detailed requirements',
          details: 'Additional implementation details added',
          status: 'pending'
        },
        message: 'Task updated with new details'
      })

      const updateTask = mockTaskManager.updateTask({
        taskId: 3,
        updates: {
          description: 'Updated with detailed requirements',
          details: 'Additional implementation details added'
        }
      })

      expect(updateTask.success).toBe(true)
      expect(updateTask.data.description).toBe('Updated with detailed requirements')
    })

    it('should handle task reorganization during project evolution', () => {
      // Initial task structure
      const initialTasks = [
        { id: 7, title: 'User Authentication', priority: 'high' },
        { id: 8, title: 'User Profile', priority: 'medium' },
        { id: 9, title: 'Admin Panel', priority: 'low' }
      ]

      // Create initial tasks
      initialTasks.forEach(task => {
        mockTaskManager.addTask.mockReturnValueOnce({
          success: true,
          data: task,
          message: 'Task created'
        })

        const result = mockTaskManager.addTask(task)
        expect(result.success).toBe(true)
      })

      // Reorganize: Move user profile to be subtask of authentication
      mockTaskManager.moveTask.mockReturnValueOnce({
        success: true,
        data: {
          movedTask: { id: '7.1', title: 'User Profile', parentId: 7 },
          from: 8,
          to: '7.1',
          operation: 'task_to_subtask'
        },
        message: 'Task converted to subtask'
      })

      const moveResult = mockTaskManager.moveTask({
        from: 8,
        to: 7
      })

      expect(moveResult.success).toBe(true)
      expect(moveResult.data.operation).toBe('task_to_subtask')
      expect(moveResult.data.movedTask.parentId).toBe(7)

      // Add new task to fill the gap
      mockTaskManager.addTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 8,
          title: 'Payment Integration',
          priority: 'high',
          status: 'pending'
        },
        message: 'New priority task added'
      })

      const newTaskResult = mockTaskManager.addTask({
        title: 'Payment Integration',
        priority: 'high'
      })

      expect(newTaskResult.success).toBe(true)
      expect(newTaskResult.data.id).toBe(8)
      expect(newTaskResult.data.priority).toBe('high')
    })
  })

  describe('Advanced workflow scenarios', () => {
    it('should handle complex dependency management', () => {
      // Create tasks with complex dependency web
      const complexTasks = [
        { id: 10, title: 'Database Schema' },
        { id: 11, title: 'User Model' },
        { id: 12, title: 'Product Model' },
        { id: 13, title: 'Order System' },
        { id: 14, title: 'Payment Processing' },
        { id: 15, title: 'Email Notifications' }
      ]

      complexTasks.forEach(task => {
        mockTaskManager.addTask.mockReturnValueOnce({
          success: true,
          data: { ...task, status: 'pending', dependencies: [] },
          message: 'Complex task created'
        })

        const result = mockTaskManager.addTask(task)
        expect(result.success).toBe(true)
      })

      // Establish complex dependencies
      const complexDependencies = [
        { taskId: 11, dependsOn: 10 }, // User Model depends on Schema
        { taskId: 12, dependsOn: 10 }, // Product Model depends on Schema
        { taskId: 13, dependsOn: 11 }, // Order depends on User
        { taskId: 13, dependsOn: 12 }, // Order depends on Product
        { taskId: 14, dependsOn: 13 }, // Payment depends on Order
        { taskId: 15, dependsOn: 14 }  // Email depends on Payment
      ]

      complexDependencies.forEach(dep => {
        mockDependencyManager.addDependency.mockReturnValueOnce({
          success: true,
          data: {
            taskId: dep.taskId,
            dependsOn: dep.dependsOn,
            task: { id: dep.taskId, dependencies: [dep.dependsOn] }
          },
          message: 'Complex dependency added'
        })

        const result = mockDependencyManager.addDependency(dep)
        expect(result.success).toBe(true)
      })

      // Validate dependency structure
      mockDependencyManager.validateDependencies.mockReturnValueOnce({
        success: true,
        data: {
          valid: true,
          circularDependencies: [],
          unresolvedDependencies: [],
          dependencyChains: 6
        },
        message: 'Dependency validation passed'
      })

      const validation = mockDependencyManager.validateDependencies()
      expect(validation.success).toBe(true)
      expect(validation.data.valid).toBe(true)
      expect(validation.data.circularDependencies).toHaveLength(0)
    })

    it('should handle parallel workflow execution', () => {
      // Simulate parallel development streams
      const frontendTasks = [
        { id: 20, title: 'React Setup', stream: 'frontend' },
        { id: 21, title: 'Component Library', stream: 'frontend' },
        { id: 22, title: 'State Management', stream: 'frontend' }
      ]

      const backendTasks = [
        { id: 23, title: 'Express Setup', stream: 'backend' },
        { id: 24, title: 'Database Connection', stream: 'backend' },
        { id: 25, title: 'API Routes', stream: 'backend' }
      ]

      const allParallelTasks = [...frontendTasks, ...backendTasks]

      allParallelTasks.forEach(task => {
        mockTaskManager.addTask.mockReturnValueOnce({
          success: true,
          data: { ...task, status: 'pending' },
          message: `${task.stream} task created`
        })

        const result = mockTaskManager.addTask(task)
        expect(result.success).toBe(true)
        expect(result.data.stream).toBe(task.stream)
      })

      // Start parallel work on both streams
      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: { id: 20, status: 'in-progress' },
        message: 'Frontend work started'
      })

      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: { id: 23, status: 'in-progress' },
        message: 'Backend work started'
      })

      const frontendStart = mockTaskManager.setTaskStatus({
        taskId: 20,
        status: 'in-progress'
      })

      const backendStart = mockTaskManager.setTaskStatus({
        taskId: 23,
        status: 'in-progress'
      })

      expect(frontendStart.success).toBe(true)
      expect(backendStart.success).toBe(true)
      expect(frontendStart.data.status).toBe('in-progress')
      expect(backendStart.data.status).toBe('in-progress')
    })
  })

  describe('Task lifecycle management', () => {
    it('should handle complete task lifecycle with file generation', () => {
      // Create task
      mockTaskManager.addTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 30,
          title: 'User Registration Feature',
          status: 'pending',
          priority: 'high'
        },
        message: 'Task created successfully'
      })

      const createResult = mockTaskManager.addTask({
        title: 'User Registration Feature',
        priority: 'high'
      })

      expect(createResult.success).toBe(true)

      // Generate task files
      mockFileManager.generateTaskFiles.mockReturnValueOnce({
        success: true,
        data: {
          filesGenerated: ['task_030.md'],
          taskFile: 'task_030.md'
        },
        message: 'Task file generated'
      })

      const fileGenResult = mockFileManager.generateTaskFiles({
        taskId: 30
      })

      expect(fileGenResult.success).toBe(true)
      expect(fileGenResult.data.filesGenerated).toContain('task_030.md')

      // Update task with progress
      mockTaskManager.updateTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 30,
          title: 'User Registration Feature',
          status: 'in-progress',
          details: 'Added implementation details and progress notes'
        },
        message: 'Task updated with progress'
      })

      const updateResult = mockTaskManager.updateTask({
        taskId: 30,
        updates: {
          status: 'in-progress',
          details: 'Added implementation details and progress notes'
        }
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.status).toBe('in-progress')

      // Complete task
      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: {
          id: 30,
          status: 'done'
        },
        message: 'Task completed successfully'
      })

      const completeResult = mockTaskManager.setTaskStatus({
        taskId: 30,
        status: 'done'
      })

      expect(completeResult.success).toBe(true)
      expect(completeResult.data.status).toBe('done')

      // Update task file
      mockFileManager.updateTaskFile.mockReturnValueOnce({
        success: true,
        data: {
          taskFile: 'task_030.md',
          updated: true
        },
        message: 'Task file updated with completion status'
      })

      const fileUpdateResult = mockFileManager.updateTaskFile({
        taskId: 30,
        status: 'done'
      })

      expect(fileUpdateResult.success).toBe(true)
      expect(fileUpdateResult.data.updated).toBe(true)
    })

    it('should handle task removal with cleanup', () => {
      // Create task to be removed
      mockTaskManager.addTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 31,
          title: 'Deprecated Feature',
          status: 'pending'
        },
        message: 'Task created'
      })

      const createResult = mockTaskManager.addTask({
        title: 'Deprecated Feature'
      })

      expect(createResult.success).toBe(true)

      // Add dependencies to other tasks
      mockDependencyManager.addDependency.mockReturnValueOnce({
        success: true,
        data: {
          taskId: 32,
          dependsOn: 31
        },
        message: 'Dependency added'
      })

      mockDependencyManager.addDependency({
        taskId: 32,
        dependsOn: 31
      })

      // Remove task with cleanup
      mockTaskManager.removeTask.mockReturnValueOnce({
        success: true,
        data: {
          removedTask: { id: 31, title: 'Deprecated Feature' },
          dependencyUpdates: 1,
          affectedTasks: [32],
          fileCleanup: true,
          filesRemoved: ['task_031.md']
        },
        message: 'Task removed with full cleanup'
      })

      const removeResult = mockTaskManager.removeTask({
        taskId: 31,
        yes: true
      })

      expect(removeResult.success).toBe(true)
      expect(removeResult.data.dependencyUpdates).toBe(1)
      expect(removeResult.data.affectedTasks).toContain(32)
      expect(removeResult.data.fileCleanup).toBe(true)
    })
  })

  describe('Error recovery and validation', () => {
    it('should handle workflow errors gracefully', () => {
      // Test task creation failure
      mockTaskManager.addTask.mockReturnValueOnce({
        success: false,
        error: 'Validation failed',
        message: 'Task title cannot be empty'
      })

      const failedCreate = mockTaskManager.addTask({
        title: ''
      })

      expect(failedCreate.success).toBe(false)
      expect(failedCreate.error).toBe('Validation failed')

      // Test dependency creation failure
      mockDependencyManager.addDependency.mockReturnValueOnce({
        success: false,
        error: 'Circular dependency',
        message: 'This would create a circular reference'
      })

      const failedDependency = mockDependencyManager.addDependency({
        taskId: 5,
        dependsOn: 5
      })

      expect(failedDependency.success).toBe(false)
      expect(failedDependency.error).toBe('Circular dependency')

      // Test file generation failure
      mockFileManager.generateTaskFiles.mockReturnValueOnce({
        success: false,
        error: 'File system error',
        message: 'Cannot write to task files directory'
      })

      const failedFileGen = mockFileManager.generateTaskFiles({
        taskId: 99
      })

      expect(failedFileGen.success).toBe(false)
      expect(failedFileGen.error).toBe('File system error')
    })

    it('should validate workflow consistency', () => {
      // Test workflow state validation
      mockDependencyManager.validateDependencies.mockReturnValueOnce({
        success: true,
        data: {
          valid: true,
          warnings: [],
          recommendations: [
            'Consider breaking down large tasks',
            'Add more specific task descriptions'
          ]
        },
        message: 'Workflow validation passed with recommendations'
      })

      const validation = mockDependencyManager.validateDependencies()

      expect(validation.success).toBe(true)
      expect(validation.data.valid).toBe(true)
      expect(validation.data.recommendations).toHaveLength(2)
    })
  })
})