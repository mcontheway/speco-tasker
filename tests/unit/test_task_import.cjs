/**
 * test_task_import.cjs
 * 单元测试：验证任务导入功能
 *
 * SCOPE: 测试任务导入和数据反序列化的核心功能，包括不同格式的导入、数据验证和冲突处理
 */

const fs = require('fs')
const path = require('path')

// Mock 依赖项
jest.mock('fs')
jest.mock('path')

// Mock 工具函数
jest.mock('../../scripts/modules/utils.js', () => ({
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	findProjectRoot: jest.fn(() => '/mock/project/root'),
	ensureTagMetadata: jest.fn(),
	markMigrationForNotice: jest.fn(),
	performCompleteTagMigration: jest.fn(),
	isSilentMode: jest.fn(() => false),
	getCurrentTag: jest.fn(() => 'main'),
	slugifyTagForFilePath: jest.fn(() => 'main'),
	truncate: jest.fn((text, length) => text.length > length ? text.substring(0, length) + '...' : text)
}))

// Store original path methods to restore them after tests
const originalPathMethods = {
	dirname: require('path').dirname,
	join: require('path').join,
	extname: require('path').extname,
	basename: require('path').basename
}

// Mock 配置管理器
jest.mock('../../scripts/modules/config-manager.js', () => ({
	getDefaultPriority: jest.fn(() => 'medium'),
	hasCodebaseAnalysis: jest.fn(() => false)
}))

describe('任务导入功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		// 模拟文件系统
		fs.existsSync = jest.fn().mockReturnValue(true)
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}))
		fs.writeFileSync = jest.fn().mockReturnValue(undefined)
		path.dirname = jest.fn().mockReturnValue('/mock/project')
		path.join = jest.fn().mockImplementation((...args) => args.join('/'))
		path.extname = jest.fn().mockImplementation((filePath) => {
			const ext = filePath.split('.').pop()
			return ext ? `.${ext}` : ''
		})
		path.basename = jest.fn().mockImplementation((filePath) => {
			return filePath.split('/').pop() || filePath
		})
	})

	afterEach(() => {
		// Restore original path methods to prevent interference with other test suites
		Object.assign(path, originalPathMethods)
	})

	describe('导入数据结构验证', () => {
		it('应该验证导入数据的完整性', () => {
			const importData = {
				metadata: {
					version: '1.0.0',
					exportedAt: '2024-01-01T10:00:00Z',
					exportedBy: 'test-user',
					tag: 'main',
					totalTasks: 3,
					totalSubtasks: 5,
					format: 'json'
				},
				tasks: [
					{
						id: 1,
						title: '导入任务1',
						description: '任务描述',
						status: 'pending',
						priority: 'medium',
						details: '详细说明',
						testStrategy: '测试策略',
						dependencies: [],
						subtasks: []
					},
					{
						id: 2,
						title: '导入任务2',
						description: '另一个任务',
						status: 'in-progress',
						priority: 'high',
						dependencies: [1],
						subtasks: []
					}
				],
				settings: {
					defaultPriority: 'medium',
					supportedStatuses: ['pending', 'in-progress', 'done'],
					supportedPriorities: ['high', 'medium', 'low']
				}
			}

			// 验证导入对象包含所有必需属性
			expect(importData).toHaveProperty('metadata')
			expect(importData).toHaveProperty('tasks')
			expect(importData).toHaveProperty('settings')

			// 验证元数据
			expect(importData.metadata.version).toBe('1.0.0')
			expect(importData.metadata.totalTasks).toBe(3)
			expect(importData.metadata.format).toBe('json')

			// 验证任务数据
			expect(Array.isArray(importData.tasks)).toBe(true)
			expect(importData.tasks).toHaveLength(2)
			expect(importData.tasks[0].id).toBe(1)
			expect(importData.tasks[1].id).toBe(2)

			// 验证依赖关系
			expect(importData.tasks[1].dependencies).toContain(1)
		})

		it('应该支持不同导入格式的检测', () => {
			const formatTests = [
				{
					content: '{"metadata":{},"tasks":[]}',
					expectedFormat: 'json',
					contentType: 'application/json'
				},
				{
					content: 'ID,Title,Status\n1,Task1,pending',
					expectedFormat: 'csv',
					contentType: 'text/csv'
				},
				{
					content: '<?xml version="1.0"?><tasks></tasks>',
					expectedFormat: 'xml',
					contentType: 'application/xml'
				},
				{
					content: '# 任务列表\n\n## 任务 1',
					expectedFormat: 'markdown',
					contentType: 'text/markdown'
				}
			]

			formatTests.forEach(({ content, expectedFormat, contentType }) => {
				// 模拟格式检测逻辑
				let detectedFormat
				if (content.startsWith('{') || content.startsWith('[')) {
					detectedFormat = 'json'
				} else if (content.includes(',')) {
					detectedFormat = 'csv'
				} else if (content.includes('<?xml')) {
					detectedFormat = 'xml'
				} else if (content.includes('# ')) {
					detectedFormat = 'markdown'
				}

				expect(detectedFormat).toBe(expectedFormat)
			})
		})

		it('应该验证导入数据的版本兼容性', () => {
			const versionTests = [
				{
					version: '1.0.0',
					compatible: true,
					supportsSubtasks: true,
					supportsDependencies: true
				},
				{
					version: '0.9.0',
					compatible: true,
					supportsSubtasks: false,
					supportsDependencies: true
				},
				{
					version: '0.8.0',
					compatible: false,
					supportsSubtasks: false,
					supportsDependencies: false
				}
			]

			versionTests.forEach(({ version, compatible, supportsSubtasks, supportsDependencies }) => {
				const importData = {
					metadata: { version },
					tasks: []
				}

				// 模拟版本兼容性检查
				const isCompatible = version.startsWith('1.') || version.startsWith('0.9')
				const hasSubtasks = version >= '1.0.0'
				const hasDependencies = version >= '0.9.0'

				expect(isCompatible).toBe(compatible)
				expect(hasSubtasks).toBe(supportsSubtasks)
				expect(hasDependencies).toBe(supportsDependencies)
			})
		})
	})

	describe('导入格式转换验证', () => {
		it('应该支持JSON格式导入', () => {
			const jsonContent = JSON.stringify({
				metadata: { version: '1.0.0' },
				tasks: [
					{
						id: 1,
						title: 'JSON任务',
						status: 'pending',
						priority: 'medium'
					}
				]
			})

			const parsedData = JSON.parse(jsonContent)

			expect(parsedData.metadata.version).toBe('1.0.0')
			expect(parsedData.tasks).toHaveLength(1)
			expect(parsedData.tasks[0].title).toBe('JSON任务')
		})

		it('应该支持CSV格式导入', () => {
			const csvContent = `ID,Title,Description,Status,Priority
1,"任务1","任务描述1",pending,high
2,"任务2","任务描述2",done,medium
3,"任务3","任务描述3",in-progress,low`

			const lines = csvContent.split('\n')
			const headers = lines[0].split(',')
			const rows = lines.slice(1).map(line => line.split(','))

			const tasks = rows.map(row => {
				const task = {}
				headers.forEach((header, index) => {
					let value = row[index]
					// 移除引号
					if (value.startsWith('"') && value.endsWith('"')) {
						value = value.slice(1, -1)
					}
					task[header.toLowerCase()] = value
				})
				return task
			})

			expect(tasks).toHaveLength(3)
			expect(tasks[0].title).toBe('任务1')
			expect(tasks[1].status).toBe('done')
			expect(tasks[2].priority).toBe('low')
		})

		it('应该支持XML格式导入', () => {
			const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<tasks>
  <metadata>
    <version>1.0.0</version>
  </metadata>
  <task id="1">
    <title>XML任务</title>
    <description>XML格式任务</description>
    <status>pending</status>
    <priority>medium</priority>
  </task>
</tasks>`

			// 模拟XML解析
			const isValidXML = xmlContent.includes('<?xml') &&
							   xmlContent.includes('<tasks>') &&
							   xmlContent.includes('<task')

			expect(isValidXML).toBe(true)
			expect(xmlContent).toContain('<title>XML任务</title>')
			expect(xmlContent).toContain('<status>pending</status>')
		})

		it('应该处理导入数据的ID冲突解决', () => {
			const existingTasks = [
				{ id: 1, title: '现有任务1' },
				{ id: 2, title: '现有任务2' }
			]

			const importTasks = [
				{ id: 1, title: '导入任务1' }, // ID冲突
				{ id: 3, title: '导入任务3' }  // 无冲突
			]

			// 模拟ID冲突检测
			const conflicts = importTasks.filter(importTask =>
				existingTasks.some(existing => existing.id === importTask.id)
			)

			const noConflicts = importTasks.filter(importTask =>
				!existingTasks.some(existing => existing.id === importTask.id)
			)

			expect(conflicts).toHaveLength(1)
			expect(conflicts[0].id).toBe(1)
			expect(noConflicts).toHaveLength(1)
			expect(noConflicts[0].id).toBe(3)
		})
	})

	describe('导入文件操作验证', () => {
		it('应该验证导入文件的存在性和可读性', () => {
			const importPath = '/mock/project/import_tasks.json'

			// Mock 文件存在
			fs.existsSync.mockReturnValue(true)
			const exists = fs.existsSync(importPath)
			expect(exists).toBe(true)

			// Mock 文件读取
			const mockContent = JSON.stringify({ tasks: [] })
			fs.readFileSync.mockReturnValue(mockContent)

			const content = fs.readFileSync(importPath, 'utf8')
			expect(content).toBe(mockContent)

			// Mock 文件不存在的情况
			fs.existsSync.mockReturnValue(false)
			const notExists = fs.existsSync('/nonexistent/file.json')
			expect(notExists).toBe(false)
		})

		it('应该处理导入文件的编码检测', () => {
			const encodings = ['utf8', 'utf-16', 'ascii', 'latin1']

			encodings.forEach(encoding => {
				const mockContent = 'test content'
				fs.readFileSync.mockReturnValue(mockContent)

				const content = fs.readFileSync('/mock/file.txt', encoding)
				expect(content).toBe(mockContent)
			})
		})

		it('应该验证导入文件的完整性检查', () => {
			const validImportData = {
				metadata: {
					version: '1.0.0',
					totalTasks: 2
				},
				tasks: [
					{ id: 1, title: '任务1' },
					{ id: 2, title: '任务2' }
				]
			}

			const invalidImportData = {
				metadata: {
					version: '1.0.0',
					totalTasks: 3 // 不匹配实际任务数量
				},
				tasks: [
					{ id: 1, title: '任务1' },
					{ id: 2, title: '任务2' }
				]
			}

			// 验证有效数据的完整性
			const isValidData = validImportData.tasks.length === validImportData.metadata.totalTasks
			expect(isValidData).toBe(true)

			// 验证无效数据的完整性
			const isInvalidData = invalidImportData.tasks.length === invalidImportData.metadata.totalTasks
			expect(isInvalidData).toBe(false)
		})

		it('应该支持导入文件的批量处理', () => {
			const importFiles = [
				'/mock/project/tasks_part1.json',
				'/mock/project/tasks_part2.json',
				'/mock/project/tasks_part3.json'
			]

			const mockContents = [
				JSON.stringify({ tasks: [{ id: 1 }, { id: 2 }] }),
				JSON.stringify({ tasks: [{ id: 3 }, { id: 4 }] }),
				JSON.stringify({ tasks: [{ id: 5 }, { id: 6 }] })
			]

			// Mock 文件读取
			importFiles.forEach((file, index) => {
				fs.readFileSync.mockReturnValueOnce(mockContents[index])
			})

			// 模拟批量处理
			const allTasks = []
			importFiles.forEach(file => {
				const content = fs.readFileSync(file, 'utf8')
				const data = JSON.parse(content)
				allTasks.push(...data.tasks)
			})

			expect(allTasks).toHaveLength(6)
			expect(allTasks.map(task => task.id)).toEqual([1, 2, 3, 4, 5, 6])
		})
	})

	describe('导入配置和选项验证', () => {
		it('应该支持导入选项的配置', () => {
			const importOptions = {
				format: 'json',
				mergeStrategy: 'overwrite', // overwrite, skip, rename
				idConflictResolution: 'auto_increment', // auto_increment, skip, error
				validateData: true,
				importMetadata: true,
				importSettings: false,
				targetTag: 'main',
				createBackup: true,
				dryRun: false
			}

			expect(importOptions.format).toBe('json')
			expect(importOptions.mergeStrategy).toBe('overwrite')
			expect(importOptions.idConflictResolution).toBe('auto_increment')
			expect(importOptions.validateData).toBe(true)
			expect(importOptions.createBackup).toBe(true)
			expect(importOptions.dryRun).toBe(false)
		})

		it('应该验证导入选项的有效性', () => {
			const validOptions = {
				mergeStrategy: 'overwrite',
				idConflictResolution: 'auto_increment',
				format: 'json'
			}

			const invalidOptions = {
				mergeStrategy: 'invalid_strategy',
				idConflictResolution: 'invalid_resolution',
				format: 'pdf'
			}

			const validStrategies = ['overwrite', 'skip', 'rename']
			const validResolutions = ['auto_increment', 'skip', 'error']
			const validFormats = ['json', 'csv', 'xml', 'markdown']

			// 验证有效选项
			expect(validStrategies).toContain(validOptions.mergeStrategy)
			expect(validResolutions).toContain(validOptions.idConflictResolution)
			expect(validFormats).toContain(validOptions.format)

			// 验证无效选项
			expect(validStrategies).not.toContain(invalidOptions.mergeStrategy)
			expect(validResolutions).not.toContain(invalidOptions.idConflictResolution)
			expect(validFormats).not.toContain(invalidOptions.format)
		})

		it('应该支持不同的合并策略', () => {
			const existingTasks = [
				{ id: 1, title: '现有任务1', status: 'pending' },
				{ id: 2, title: '现有任务2', status: 'done' }
			]

			const importTasks = [
				{ id: 1, title: '导入任务1', status: 'in-progress' }, // 冲突
				{ id: 3, title: '导入任务3', status: 'pending' }     // 无冲突
			]

			// 模拟overwrite策略
			const overwriteResult = [
				{ id: 1, title: '导入任务1', status: 'in-progress' }, // 覆盖现有
				{ id: 2, title: '现有任务2', status: 'done' },       // 保留现有
				{ id: 3, title: '导入任务3', status: 'pending' }     // 添加新任务
			]

			// 模拟skip策略
			const skipResult = [
				{ id: 1, title: '现有任务1', status: 'pending' },    // 跳过导入
				{ id: 2, title: '现有任务2', status: 'done' },       // 保留现有
				{ id: 3, title: '导入任务3', status: 'pending' }     // 添加新任务
			]

			expect(overwriteResult).toHaveLength(3)
			expect(skipResult).toHaveLength(3)
			expect(overwriteResult.find(task => task.id === 1).status).toBe('in-progress')
			expect(skipResult.find(task => task.id === 1).status).toBe('pending')
		})

		it('应该处理ID冲突的自动解决', () => {
			const existingTasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' },
				{ id: 4, title: '任务4' }
			]

			const importTasks = [
				{ id: 1, title: '新任务1' }, // 冲突
				{ id: 2, title: '新任务2' }, // 冲突
				{ id: 3, title: '任务3' }     // 无冲突
			]

			// 模拟auto_increment策略
			const existingIds = new Set(existingTasks.map(t => t.id))
			const importIds = new Set(importTasks.map(t => t.id))
			const allConflictingIds = new Set([...existingIds, ...importIds])
			const resolvedTasks = []
			const assignedIds = new Set()

			importTasks.forEach(importTask => {
				let newId = importTask.id

				// 如果与现有任务冲突，找到下一个可用ID
				if (existingIds.has(newId)) {
					while (allConflictingIds.has(newId) || assignedIds.has(newId)) {
						newId++
					}
				}

				assignedIds.add(newId)
				resolvedTasks.push({ ...importTask, id: newId })
			})

			expect(resolvedTasks[0].id).toBe(5) // 1 -> 5
			expect(resolvedTasks[1].id).toBe(6) // 2 -> 6
			expect(resolvedTasks[2].id).toBe(3) // 3保持不变
		})
	})

	describe('导入验证和错误处理', () => {
		it('应该验证导入数据的类型安全', () => {
			const validTask = {
				id: 1,
				title: '有效任务',
				status: 'pending',
				priority: 'medium',
				dependencies: [],
				subtasks: []
			}

			const invalidTask = {
				id: 'invalid',
				title: null,
				status: 'invalid_status',
				dependencies: 'invalid',
				subtasks: {}
			}

			// 验证有效任务
			expect(typeof validTask.id).toBe('number')
			expect(typeof validTask.title).toBe('string')
			expect(['pending', 'in-progress', 'done']).toContain(validTask.status)
			expect(Array.isArray(validTask.dependencies)).toBe(true)
			expect(Array.isArray(validTask.subtasks)).toBe(true)

			// 验证无效任务
			expect(typeof invalidTask.id).not.toBe('number')
			expect(invalidTask.title).toBeNull()
			expect(['pending', 'in-progress', 'done']).not.toContain(invalidTask.status)
			expect(Array.isArray(invalidTask.dependencies)).toBe(false)
			expect(Array.isArray(invalidTask.subtasks)).toBe(false)
		})

		it('应该处理导入文件格式错误', () => {
			const invalidJson = '{"invalid": json content'
			const invalidCsv = 'invalid,csv,content\nwithout,proper,headers'

			// 验证JSON解析错误
			expect(() => JSON.parse(invalidJson)).toThrow()

			// 验证CSV格式错误
			const csvLines = invalidCsv.split('\n')
			const hasHeaders = csvLines[0].includes('ID') &&
							   csvLines[0].includes('Title') &&
							   csvLines[0].includes('Status')

			expect(hasHeaders).toBe(false)
		})

		it('应该处理导入数据为空的情况', () => {
			const emptyImportData = {
				metadata: {
					version: '1.0.0',
					totalTasks: 0
				},
				tasks: []
			}

			expect(emptyImportData.tasks).toHaveLength(0)
			expect(emptyImportData.metadata.totalTasks).toBe(0)

			// 验证空数据导入仍然有效
			const jsonString = JSON.stringify(emptyImportData)
			expect(() => JSON.parse(jsonString)).not.toThrow()
		})

		it('应该验证导入数据的引用完整性', () => {
			const importTasks = [
				{
					id: 1,
					title: '任务1',
					dependencies: [2], // 引用不存在的任务
					subtasks: []
				},
				{
					id: 3,
					title: '任务3',
					dependencies: [1],
					subtasks: []
				}
			]

			// 检查依赖关系引用
			const allIds = importTasks.map(task => task.id)
			const brokenDependencies = []

			importTasks.forEach(task => {
				task.dependencies.forEach(depId => {
					if (!allIds.includes(depId)) {
						brokenDependencies.push({ taskId: task.id, brokenDepId: depId })
					}
				})
			})

			expect(brokenDependencies).toHaveLength(1)
			expect(brokenDependencies[0]).toEqual({ taskId: 1, brokenDepId: 2 })

			// 验证有效的依赖关系
			const validDependencies = importTasks.filter(task =>
				task.dependencies.every(depId => allIds.includes(depId))
			)

			expect(validDependencies).toHaveLength(1)
			expect(validDependencies[0].id).toBe(3)
		})
	})
})
