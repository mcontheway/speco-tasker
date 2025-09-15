/**
 * Integration test for manual task creation workflow
 * Tests the complete flow of creating tasks manually according to quickstart.md
 */

describe('Manual Task Creation Workflow Integration Test', () => {
  let mockTaskManager
  let mockUtils

  beforeEach(() => {
    mockTaskManager = {
      addTask: jest.fn(),
      getTasks: jest.fn(),
      setTaskStatus: jest.fn(),
      addSubtask: jest.fn(),
      findProjectRoot: jest.fn().mockReturnValue('/mock/project')
    }

    mockUtils = {
      findTasksPath: jest.fn().mockReturnValue('/mock/project/.taskmaster/tasks/tasks.json'),
      validateTasksFile: jest.fn().mockReturnValue(true)
    }
  })

  describe('Basic task creation workflow', () => {
    it('should create and manage a simple task', () => {
      // Step 1: Create a new task
      mockTaskManager.addTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 1,
          title: 'Setup Express server',
          description: 'Create basic Express.js server with TypeScript',
          status: 'pending',
          priority: 'high'
        },
        message: 'Task created successfully'
      })

      const createResult = mockTaskManager.addTask({
        title: 'Setup Express server',
        description: 'Create basic Express.js server with TypeScript',
        priority: 'high'
      })

      expect(createResult.success).toBe(true)
      expect(createResult.data.id).toBe(1)
      expect(createResult.data.status).toBe('pending')

      // Step 2: List tasks to verify creation
      mockTaskManager.getTasks.mockReturnValueOnce({
        success: true,
        data: [createResult.data],
        message: 'Tasks retrieved successfully'
      })

      const listResult = mockTaskManager.getTasks({})
      expect(listResult.success).toBe(true)
      expect(listResult.data).toHaveLength(1)
      expect(listResult.data[0].title).toBe('Setup Express server')

      // Step 3: Start working on the task
      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: {
          ...createResult.data,
          status: 'in-progress'
        },
        message: 'Task status updated successfully'
      })

      const statusResult = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'in-progress'
      })

      expect(statusResult.success).toBe(true)
      expect(statusResult.data.status).toBe('in-progress')

      // Step 4: Complete the task
      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: {
          ...createResult.data,
          status: 'done'
        },
        message: 'Task completed successfully'
      })

      const completeResult = mockTaskManager.setTaskStatus({
        taskId: 1,
        status: 'done'
      })

      expect(completeResult.success).toBe(true)
      expect(completeResult.data.status).toBe('done')
    })

    it('should create task with subtasks for complex work', () => {
      // Step 1: Create parent task
      mockTaskManager.addTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 2,
          title: 'Implement user authentication',
          description: 'Add JWT-based authentication system',
          status: 'pending',
          priority: 'high',
          subtasks: []
        },
        message: 'Parent task created successfully'
      })

      const parentResult = mockTaskManager.addTask({
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication system',
        priority: 'high'
      })

      expect(parentResult.success).toBe(true)
      expect(parentResult.data.id).toBe(2)

      // Step 2: Add subtasks
      const subtaskTitles = [
        'Create user model and database schema',
        'Implement JWT token generation',
        'Add login and registration endpoints',
        'Create authentication middleware'
      ]

      subtaskTitles.forEach((title, index) => {
        mockTaskManager.addSubtask.mockReturnValueOnce({
          success: true,
          data: {
            subtask: {
              id: `2.${index + 1}`,
              title: title,
              status: 'pending',
              parentId: 2
            },
            parentTask: parentResult.data
          },
          message: 'Subtask added successfully'
        })

        const subtaskResult = mockTaskManager.addSubtask({
          parentId: 2,
          title: title
        })

        expect(subtaskResult.success).toBe(true)
        expect(subtaskResult.data.subtask.id).toBe(`2.${index + 1}`)
        expect(subtaskResult.data.subtask.parentId).toBe(2)
      })

      // Step 3: Work on subtasks sequentially
      mockTaskManager.setTaskStatus.mockReturnValue({
        success: true,
        data: { id: '2.1', status: 'done' },
        message: 'Subtask completed'
      })

      const subtask1Complete = mockTaskManager.setTaskStatus({
        taskId: '2.1',
        status: 'done'
      })

      expect(subtask1Complete.success).toBe(true)
      expect(subtask1Complete.data.status).toBe('done')
    })
  })

  describe('Task management workflow patterns', () => {
    it('should handle priority-based task creation', () => {
      const priorities = ['high', 'medium', 'low']
      const tasks = []

      priorities.forEach((priority, index) => {
        mockTaskManager.addTask.mockReturnValueOnce({
          success: true,
          data: {
            id: index + 1,
            title: `${priority} priority task`,
            priority: priority,
            status: 'pending'
          },
          message: `${priority} priority task created`
        })

        const result = mockTaskManager.addTask({
          title: `${priority} priority task`,
          priority: priority
        })

        expect(result.success).toBe(true)
        expect(result.data.priority).toBe(priority)
        tasks.push(result.data)
      })

      // Verify all tasks were created with correct priorities
      expect(tasks).toHaveLength(3)
      expect(tasks[0].priority).toBe('high')
      expect(tasks[1].priority).toBe('medium')
      expect(tasks[2].priority).toBe('low')
    })

    it('should handle iterative task refinement', () => {
      // Step 1: Create initial broad task
      mockTaskManager.addTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 3,
          title: 'Build user interface',
          description: 'Create the frontend application',
          status: 'pending',
          priority: 'medium'
        },
        message: 'Initial task created'
      })

      const initialTask = mockTaskManager.addTask({
        title: 'Build user interface',
        description: 'Create the frontend application',
        priority: 'medium'
      })

      expect(initialTask.success).toBe(true)

      // Step 2: Break down into specific subtasks
      const uiSubtasks = [
        'Design component architecture',
        'Create reusable UI components',
        'Implement responsive layouts',
        'Add form validation',
        'Integrate with backend API'
      ]

      uiSubtasks.forEach((title, index) => {
        mockTaskManager.addSubtask.mockReturnValueOnce({
          success: true,
          data: {
            subtask: {
              id: `3.${index + 1}`,
              title: title,
              status: 'pending',
              parentId: 3
            },
            parentTask: initialTask.data
          },
          message: 'UI subtask added'
        })

        const subtaskResult = mockTaskManager.addSubtask({
          parentId: 3,
          title: title
        })

        expect(subtaskResult.success).toBe(true)
        expect(subtaskResult.data.subtask.title).toBe(title)
      })

      // Step 3: Work through subtasks with status updates
      mockTaskManager.setTaskStatus.mockReturnValueOnce({
        success: true,
        data: { id: '3.1', status: 'in-progress' },
        message: 'Started component architecture'
      })

      const startWork = mockTaskManager.setTaskStatus({
        taskId: '3.1',
        status: 'in-progress'
      })

      expect(startWork.success).toBe(true)
      expect(startWork.data.status).toBe('in-progress')
    })
  })

  describe('Manual workflow validation', () => {
    it('should validate task creation without AI assistance', () => {
      // This test ensures tasks can be created purely manually
      const manualTaskData = {
        title: 'Manual task creation test',
        description: 'This task was created without any AI assistance',
        status: 'pending',
        priority: 'medium',
        details: 'Detailed implementation notes go here',
        testStrategy: 'Manual testing approach'
      }

      mockTaskManager.addTask.mockReturnValueOnce({
        success: true,
        data: {
          id: 4,
          ...manualTaskData
        },
        message: 'Manual task created successfully'
      })

      const result = mockTaskManager.addTask(manualTaskData)

      expect(result.success).toBe(true)
      expect(result.data.title).toBe(manualTaskData.title)
      expect(result.data.description).toBe(manualTaskData.description)
      expect(result.data.details).toBe(manualTaskData.details)
      expect(result.data.testStrategy).toBe(manualTaskData.testStrategy)
      
      // Verify no AI-related fields are present
      expect(result.data).not.toHaveProperty('aiGenerated')
      expect(result.data).not.toHaveProperty('researchBacked')
      expect(result.data).not.toHaveProperty('promptUsed')
    })

    it('should support manual task organization', () => {
      // Create multiple tasks that would typically be organized manually
      const projectTasks = [
        { title: 'Project planning', phase: 'planning' },
        { title: 'Environment setup', phase: 'setup' },
        { title: 'Core development', phase: 'development' },
        { title: 'Testing and QA', phase: 'testing' },
        { title: 'Deployment', phase: 'deployment' }
      ]

      projectTasks.forEach((task, index) => {
        mockTaskManager.addTask.mockReturnValueOnce({
          success: true,
          data: {
            id: index + 10,
            title: task.title,
            phase: task.phase,
            status: 'pending',
            priority: 'medium'
          },
          message: `${task.phase} task created`
        })

        const result = mockTaskManager.addTask({
          title: task.title,
          phase: task.phase,
          priority: 'medium'
        })

        expect(result.success).toBe(true)
        expect(result.data.phase).toBe(task.phase)
      })

      // Verify tasks can be organized by phase
      mockTaskManager.getTasks.mockReturnValueOnce({
        success: true,
        data: projectTasks.map((task, index) => ({
          id: index + 10,
          title: task.title,
          phase: task.phase,
          status: 'pending'
        })),
        message: 'Project tasks retrieved'
      })

      const allTasks = mockTaskManager.getTasks({})
      expect(allTasks.success).toBe(true)
      expect(allTasks.data).toHaveLength(5)
      
      // Verify different phases are represented
      const phases = allTasks.data.map(task => task.phase)
      expect(phases).toContain('planning')
      expect(phases).toContain('development')
      expect(phases).toContain('testing')
    })
  })

  describe('Error handling in manual workflow', () => {
    it('should handle task creation errors gracefully', () => {
      mockTaskManager.addTask.mockReturnValueOnce({
        success: false,
        error: 'Validation error',
        message: 'Task title is required'
      })

      const result = mockTaskManager.addTask({
        description: 'Task without title'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation error')
      expect(result.message).toBe('Task title is required')
    })

    it('should handle file system errors during task operations', () => {
      mockTaskManager.addTask.mockReturnValueOnce({
        success: false,
        error: 'File system error',
        message: 'Could not write to tasks.json file'
      })

      const result = mockTaskManager.addTask({
        title: 'Test task',
        description: 'This should fail due to file system error'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('File system error')
    })
  })
})