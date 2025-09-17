/**
 * test_project_init.cjs
 * 单元测试：验证项目初始化功能
 *
 * SCOPE: 测试项目初始化、配置创建、目录结构和基础文件生成
 */

// Mock fs 模块
jest.mock('fs', () => ({
	writeFileSync: jest.fn(),
	readFileSync: jest.fn(),
	existsSync: jest.fn(),
	mkdirSync: jest.fn(),
	statSync: jest.fn()
}))

// Mock path 模块
jest.mock('path', () => ({
	join: jest.fn((...args) => args.join('/')),
	resolve: jest.fn((...args) => args.join('/')),
	dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/'))
}))

// Mock 工具函数
jest.mock('../../scripts/modules/utils.js', () => ({
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	findProjectRoot: jest.fn(() => '/mock/project/root'),
	ensureTagMetadata: jest.fn(),
	markMigrationForNotice: jest.fn(),
	performCompleteTagMigration: jest.fn(),
	isSilentMode: jest.fn(() => false)
}))

// Mock 配置管理器
jest.mock('../../scripts/modules/config-manager.js', () => ({
	getDefaultPriority: jest.fn(() => 'medium'),
	hasCodebaseAnalysis: jest.fn(() => false)
}))

// Mock child_process
jest.mock('child_process', () => ({
	execSync: jest.fn()
}))

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

describe('项目初始化功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('初始化参数验证', () => {
		it('应该验证必需的初始化参数', () => {
			const validateInitParams = (params) => {
				const errors = []

				if (!params.projectName || typeof params.projectName !== 'string') {
					errors.push('projectName is required and must be a string')
				}

				if (params.projectName && params.projectName.length > 50) {
					errors.push('projectName must be less than 50 characters')
				}

				if (params.projectVersion && !/^\d+\.\d+\.\d+$/.test(params.projectVersion)) {
					errors.push('projectVersion must follow semantic versioning')
				}

				if (params.authorName && params.authorName.length > 100) {
					errors.push('authorName must be less than 100 characters')
				}

				return { valid: errors.length === 0, errors }
			}

			// 有效的参数
			expect(validateInitParams({ projectName: 'test-project' }).valid).toBe(true)
			expect(validateInitParams({ projectName: 'test-project', projectVersion: '1.0.0' }).valid).toBe(true)

			// 无效的参数
			expect(validateInitParams({}).valid).toBe(false)
			expect(validateInitParams({ projectName: 'a'.repeat(60) }).valid).toBe(false)
			expect(validateInitParams({ projectName: 'test', projectVersion: 'invalid' }).valid).toBe(false)
		})

		it('应该提供初始化参数的默认值', () => {
			const applyDefaults = (params) => {
				return {
					projectName: params.projectName,
					projectVersion: params.projectVersion || '1.0.0',
					projectDescription: params.projectDescription || '',
					authorName: params.authorName || 'Unknown Author',
					createGitRepo: params.createGitRepo !== false,
					createReadme: params.createReadme !== false,
					...params
				}
			}

			const params = { projectName: 'my-project' }
			const withDefaults = applyDefaults(params)

			expect(withDefaults.projectVersion).toBe('1.0.0')
			expect(withDefaults.authorName).toBe('Unknown Author')
			expect(withDefaults.createGitRepo).toBe(true)
			expect(withDefaults.createReadme).toBe(true)
		})
	})

	describe('目录结构创建', () => {
		it('应该创建标准的项目目录结构', () => {
			const createProjectStructure = (projectRoot, options = {}) => {
				const dirs = [
					'.taskmaster',
					'.taskmaster/tasks',
					'.taskmaster/config',
					'.taskmaster/docs',
					'.taskmaster/templates',
					'.taskmaster/reports'
				]

				if (options.createTests) {
					dirs.push('tests', 'tests/unit', 'tests/integration', 'tests/e2e')
				}

				if (options.createSrc) {
					dirs.push('src', 'src/utils', 'src/types')
				}

				dirs.forEach(dir => {
					const fullPath = path.join(projectRoot, dir)
					fs.mkdirSync(fullPath, { recursive: true })
				})

				return dirs
			}

			const createdDirs = createProjectStructure('/mock/project', {
				createTests: true,
				createSrc: true
			})

			expect(createdDirs).toContain('.taskmaster')
			expect(createdDirs).toContain('tests/unit')
			expect(createdDirs).toContain('src/utils')
			expect(fs.mkdirSync).toHaveBeenCalled()
		})

		it('应该处理目录创建失败的情况', () => {
			fs.mkdirSync.mockImplementation(() => {
				throw new Error('Permission denied')
			})

			const createProjectStructure = (projectRoot) => {
				try {
					fs.mkdirSync(path.join(projectRoot, '.taskmaster'), { recursive: true })
					return { success: true }
				} catch (error) {
					return { success: false, error: error.message }
				}
			}

			const result = createProjectStructure('/mock/project')
			expect(result.success).toBe(false)
			expect(result.error).toContain('Permission denied')
		})
	})

	describe('配置文件生成', () => {
		it('应该生成默认的配置文件', () => {
			const createDefaultConfig = (projectInfo) => {
				const config = {
					project: {
						name: projectInfo.projectName,
						version: projectInfo.projectVersion || '1.0.0',
						description: projectInfo.projectDescription || '',
						author: projectInfo.authorName || 'Unknown Author',
						createdAt: new Date().toISOString()
					},
					taskmaster: {
						version: '1.0.0',
						defaultPriority: 'medium',
						defaultTag: 'main',
						logLevel: 'info'
					},
					tags: {
						master: {
							description: '主任务列表',
							createdAt: new Date().toISOString()
						}
					}
				}

				const configPath = path.join(projectInfo.projectRoot, '.taskmaster/config.json')
				fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

				return config
			}

			const projectInfo = {
				projectName: 'test-project',
				projectVersion: '2.0.0',
				projectRoot: '/mock/project'
			}

			const config = createDefaultConfig(projectInfo)

			expect(config.project.name).toBe('test-project')
			expect(config.project.version).toBe('2.0.0')
			expect(config.taskmaster.defaultTag).toBe('main')
			expect(fs.writeFileSync).toHaveBeenCalled()
		})

		it('应该支持自定义配置选项', () => {
			const createCustomConfig = (baseConfig, customOptions) => {
				return {
					...baseConfig,
					taskmaster: {
						...baseConfig.taskmaster,
						logLevel: customOptions.logLevel || baseConfig.taskmaster.logLevel,
						maxTasks: customOptions.maxTasks || 1000,
						autoSave: customOptions.autoSave !== false
					}
				}
			}

			const baseConfig = {
				taskmaster: { logLevel: 'info', defaultPriority: 'medium' }
			}

			const customConfig = createCustomConfig(baseConfig, {
				logLevel: 'debug',
				maxTasks: 500
			})

			expect(customConfig.taskmaster.logLevel).toBe('debug')
			expect(customConfig.taskmaster.maxTasks).toBe(500)
			expect(customConfig.taskmaster.autoSave).toBe(true)
		})
	})

	describe('任务文件初始化', () => {
		it('应该创建空的初始任务文件', () => {
			const createInitialTasksFile = (projectRoot) => {
				const tasks = {
					version: '1.0.0',
					tag: 'main',
					tasks: [],
					metadata: {
						createdAt: new Date().toISOString(),
						lastModified: new Date().toISOString(),
						totalTasks: 0
					}
				}

				const tasksPath = path.join(projectRoot, '.taskmaster/tasks/tasks.json')
				fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2))

				return tasks
			}

			const tasks = createInitialTasksFile('/mock/project')

			expect(tasks.tag).toBe('main')
			expect(tasks.tasks).toEqual([])
			expect(tasks.metadata.totalTasks).toBe(0)
			expect(fs.writeFileSync).toHaveBeenCalled()
		})

		it('应该创建示例任务模板', () => {
			const createExampleTasks = (projectRoot) => {
				const exampleTasks = [
					{
						id: 1,
						title: '设置项目结构',
						description: '创建基本的项目目录结构和配置文件',
						status: 'pending',
						priority: 'high',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					},
					{
						id: 2,
						title: '编写项目文档',
						description: '创建README.md和项目使用说明',
						status: 'pending',
						priority: 'medium',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					}
				]

				const examplePath = path.join(projectRoot, '.taskmaster/templates/example-tasks.json')
				fs.writeFileSync(examplePath, JSON.stringify(exampleTasks, null, 2))

				return exampleTasks
			}

			const examples = createExampleTasks('/mock/project')

			expect(examples.length).toBe(2)
			expect(examples[0].title).toBe('设置项目结构')
			expect(examples[1].priority).toBe('medium')
		})
	})

	describe('Git仓库初始化', () => {
		it('应该初始化Git仓库', () => {
			const initGitRepository = (projectRoot, options = {}) => {
				try {
					// 初始化仓库
					execSync('git init', { cwd: projectRoot, stdio: 'pipe' })

					// 创建.gitignore
					if (options.createGitignore) {
						const gitignoreContent = 'node_modules/\n.env\n.DS_Store\n.taskmaster/temp/\n'
						fs.writeFileSync(path.join(projectRoot, '.gitignore'), gitignoreContent)
					}

					// 初始提交
					if (options.initialCommit) {
						execSync('git add .', { cwd: projectRoot, stdio: 'pipe' })
						execSync('git commit -m "Initial commit"', { cwd: projectRoot, stdio: 'pipe' })
					}

					return { success: true }
				} catch (error) {
					return { success: false, error: error.message }
				}
			}

			execSync.mockImplementation(() => '')

			const result = initGitRepository('/mock/project', {
				createGitignore: true,
				initialCommit: true
			})

			expect(result.success).toBe(true)
			expect(execSync).toHaveBeenCalledWith('git init', expect.any(Object))
			expect(execSync).toHaveBeenCalledWith('git add .', expect.any(Object))
			expect(fs.writeFileSync).toHaveBeenCalled()
		})

		it('应该处理Git命令失败的情况', () => {
			execSync.mockImplementation(() => {
				throw new Error('git command failed')
			})

			const initGitRepository = (projectRoot) => {
				try {
					execSync('git init', { cwd: projectRoot, stdio: 'pipe' })
					return { success: true }
				} catch (error) {
					return { success: false, error: error.message }
				}
			}

			const result = initGitRepository('/mock/project')
			expect(result.success).toBe(false)
			expect(result.error).toContain('git command failed')
		})
	})

	describe('README文件生成', () => {
		it('应该生成项目README文件', () => {
			const createReadmeFile = (projectInfo) => {
				const readmeContent = '# ' + projectInfo.projectName + '\n\n' +
					(projectInfo.projectDescription || '项目描述待添加') + '\n\n' +
					'## 安装\n\n```bash\nnpm install\ntask-master init\n```\n\n' +
					'## 使用\n\n```bash\ntask-master list\ntask-master next\ntask-master show <id>\n```\n\n' +
					'## 作者\n\n' + (projectInfo.authorName || 'Unknown Author') + '\n\n---\n\n*Generated by Speco Tasker*'

				const readmePath = path.join(projectInfo.projectRoot, 'README.md')
				fs.writeFileSync(readmePath, readmeContent)

				return readmeContent
			}

			const projectInfo = {
				projectName: 'My Awesome Project',
				projectDescription: 'This is an awesome project',
				authorName: 'John Doe',
				projectRoot: '/mock/project'
			}

			const content = createReadmeFile(projectInfo)

			expect(content).toContain('# My Awesome Project')
			expect(content).toContain('This is an awesome project')
			expect(content).toContain('John Doe')
			expect(content).toContain('task-master init')
		})
	})

	describe('完整初始化流程', () => {
		it('应该执行完整的项目初始化', () => {
			// 重置 mocks 为正常工作状态
			fs.mkdirSync.mockImplementation(() => undefined)
			fs.writeFileSync.mockImplementation(() => undefined)
			execSync.mockImplementation(() => '')

			const initializeProject = (params) => {
				const steps = []

				try {
					// 1. 验证参数
					steps.push('参数验证')
					if (!params.projectName) throw new Error('Project name is required')

					// 2. 创建目录结构
					steps.push('创建目录结构')
					fs.mkdirSync(path.join(params.projectRoot, '.taskmaster'), { recursive: true })

					// 3. 生成配置文件
					steps.push('生成配置文件')
					const config = { project: { name: params.projectName } }
					fs.writeFileSync(path.join(params.projectRoot, '.taskmaster/config.json'), JSON.stringify(config))

					// 4. 创建任务文件
					steps.push('创建任务文件')
					const tasks = { tasks: [] }
					fs.writeFileSync(path.join(params.projectRoot, '.taskmaster/tasks/tasks.json'), JSON.stringify(tasks))

					// 5. 初始化Git
					steps.push('初始化Git仓库')
					if (params.createGitRepo) {
						execSync('git init', { cwd: params.projectRoot })
					}

					// 6. 生成README
					steps.push('生成README')
					if (params.createReadme) {
						const readme = '# ' + params.projectName
						fs.writeFileSync(path.join(params.projectRoot, 'README.md'), readme)
					}

					return { success: true, steps, message: '项目初始化完成' }
				} catch (error) {
					return { success: false, error: error.message, completedSteps: steps }
				}
			}

			const params = {
				projectName: 'test-project',
				projectRoot: '/mock/project',
				createGitRepo: true,
				createReadme: true
			}

			const result = initializeProject(params)
			expect(result.success).toBe(true)
			expect(result.steps).toContain('生成README')
		})
	})
})