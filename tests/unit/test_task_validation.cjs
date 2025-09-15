/**
 * test_task_validation.cjs
 * 单元测试：验证任务验证功能
 *
 * SCOPE: 测试任务数据的完整性验证、格式验证、业务规则验证和错误处理
 */

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

describe('任务验证功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('任务数据完整性验证', () => {
		it('应该验证必需字段的存在性', () => {
			const validateRequiredFields = (task) => {
				const requiredFields = ['id', 'title', 'status']
				const missingFields = requiredFields.filter(field => !task[field])

				return {
					isValid: missingFields.length === 0,
					missingFields
				}
			}

			const validTask = { id: 1, title: '测试任务', status: 'pending' }
			const invalidTask = { id: 2, title: '', status: 'pending' }
			const incompleteTask = { title: '无ID任务', status: 'done' }

			expect(validateRequiredFields(validTask).isValid).toBe(true)
			expect(validateRequiredFields(validTask).missingFields).toHaveLength(0)

			expect(validateRequiredFields(invalidTask).isValid).toBe(false)
			expect(validateRequiredFields(invalidTask).missingFields).toContain('title')

			expect(validateRequiredFields(incompleteTask).isValid).toBe(false)
			expect(validateRequiredFields(incompleteTask).missingFields).toEqual(['id'])
		})

		it('应该验证字段的数据类型', () => {
			const validateDataTypes = (task) => {
				const typeValidators = {
					id: (value) => typeof value === 'number' && value > 0,
					title: (value) => typeof value === 'string' && value.length > 0 && value.length <= 200,
					description: (value) => typeof value === 'string' && value.length <= 1000,
					status: (value) => ['pending', 'in-progress', 'done', 'blocked', 'cancelled', 'deferred'].includes(value),
					priority: (value) => ['low', 'medium', 'high'].includes(value),
					dependencies: (value) => Array.isArray(value) && value.every(dep => typeof dep === 'number')
				}

				const errors = []

				Object.entries(typeValidators).forEach(([field, validator]) => {
					if (task[field] !== undefined && !validator(task[field])) {
						errors.push(`字段 ${field} 的数据类型或值无效`)
					}
				})

				return {
					isValid: errors.length === 0,
					errors
				}
			}

			const validTask = {
				id: 1,
				title: '有效任务',
				description: '任务描述',
				status: 'pending',
				priority: 'high',
				dependencies: [2, 3]
			}

			const invalidTask = {
				id: 'invalid', // 应该是数字
				title: '', // 不能为空
				status: 'unknown', // 无效状态
				priority: 'urgent', // 无效优先级
				dependencies: 'not-array' // 应该是数组
			}

			expect(validateDataTypes(validTask).isValid).toBe(true)
			expect(validateDataTypes(validTask).errors).toHaveLength(0)

			expect(validateDataTypes(invalidTask).isValid).toBe(false)
			expect(validateDataTypes(invalidTask).errors.length).toBeGreaterThan(0)
		})

		it('应该验证任务ID的唯一性', () => {
			const validateUniqueIds = (tasks) => {
				const ids = tasks.map(task => task.id)
				const uniqueIds = [...new Set(ids)]
				const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)

				return {
					isValid: uniqueIds.length === ids.length,
					duplicates: [...new Set(duplicates)]
				}
			}

			const validTasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' },
				{ id: 3, title: '任务3' }
			]

			const invalidTasks = [
				{ id: 1, title: '任务1' },
				{ id: 2, title: '任务2' },
				{ id: 1, title: '重复ID任务' }, // 重复ID
				{ id: 3, title: '任务3' }
			]

			expect(validateUniqueIds(validTasks).isValid).toBe(true)
			expect(validateUniqueIds(validTasks).duplicates).toHaveLength(0)

			expect(validateUniqueIds(invalidTasks).isValid).toBe(false)
			expect(validateUniqueIds(invalidTasks).duplicates).toContain(1)
		})
	})

	describe('任务格式验证', () => {
		it('应该验证任务标题的格式', () => {
			const validateTitle = (title) => {
				if (!title || typeof title !== 'string') return false

				const trimmed = title.trim()
				if (trimmed.length === 0 || trimmed.length > 100) return false

				// 检查是否只包含空格
				if (trimmed.replace(/\s/g, '').length === 0) return false

				// 检查是否包含控制字符
				if (/[\x00-\x1F\x7F-\x9F]/.test(title)) return false

				return true
			}

			expect(validateTitle('有效的任务标题')).toBe(true)
			expect(validateTitle('')).toBe(false)
			expect(validateTitle('   ')).toBe(false)
			expect(validateTitle('任务标题'.repeat(50))).toBe(false) // 过长
			expect(validateTitle('标题\x00控制字符')).toBe(false)
		})

		it('应该验证任务描述的格式', () => {
			const validateDescription = (description) => {
				if (description === undefined || description === null) return true // 描述是可选的
				if (typeof description !== 'string') return false
				if (description.length > 500) return false

				// 检查是否包含危险的HTML标签（如果允许HTML的话）
				const dangerousTags = ['<script', '<iframe', '<object', '<embed']
				const hasDangerousTags = dangerousTags.some(tag => description.toLowerCase().includes(tag))

				return !hasDangerousTags
			}

			expect(validateDescription('有效的任务描述')).toBe(true)
			expect(validateDescription('')).toBe(true) // 空描述有效
			expect(validateDescription(undefined)).toBe(true) // 未定义有效
			expect(validateDescription('描述'.repeat(300))).toBe(false) // 过长
			expect(validateDescription('包含<script>的描述')).toBe(false) // 危险标签
		})

		it('应该验证时间戳格式', () => {
			const validateTimestamp = (timestamp) => {
				if (!timestamp) return false

				const date = new Date(timestamp)
				if (isNaN(date.getTime())) return false

				// 检查是否为有效的ISO字符串
				const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
				return isoRegex.test(timestamp) || !isNaN(Date.parse(timestamp))
			}

			expect(validateTimestamp('2024-01-01T00:00:00.000Z')).toBe(true)
			expect(validateTimestamp('2024-01-01T00:00:00Z')).toBe(true)
			expect(validateTimestamp('2024-01-01')).toBe(true)
			expect(validateTimestamp('invalid-date')).toBe(false)
			expect(validateTimestamp('')).toBe(false)
			expect(validateTimestamp(null)).toBe(false)
		})
	})

	describe('业务规则验证', () => {
		it('应该验证依赖关系的有效性', () => {
			const validateDependencies = (task, allTasks) => {
				if (!task.dependencies || !Array.isArray(task.dependencies)) {
					return { isValid: true, errors: [] } // 无依赖关系
				}

				const taskIds = allTasks.map(t => t.id)
				const invalidDeps = task.dependencies.filter(depId => !taskIds.includes(depId))
				const selfDeps = task.dependencies.filter(depId => depId === task.id)

				const errors = []
				if (invalidDeps.length > 0) {
					errors.push(`依赖不存在的任务: ${invalidDeps.join(', ')}`)
				}
				if (selfDeps.length > 0) {
					errors.push('任务不能依赖自己')
				}

				return {
					isValid: errors.length === 0,
					errors
				}
			}

			const allTasks = [
				{ id: 1, dependencies: [] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [1, 2] }
			]

			const validTask = { id: 4, dependencies: [1, 2] }
			const invalidTask = { id: 5, dependencies: [1, 999] } // 依赖不存在的任务
			const selfDepTask = { id: 6, dependencies: [6] } // 自依赖

			expect(validateDependencies(validTask, allTasks).isValid).toBe(true)
			expect(validateDependencies(invalidTask, allTasks).isValid).toBe(false)
			expect(validateDependencies(selfDepTask, allTasks).isValid).toBe(false)
		})

		it('应该检测循环依赖', () => {
			const detectCircularDependency = (tasks) => {
				const hasCircular = (taskId, visited = new Set(), path = new Set()) => {
					if (path.has(taskId)) return true // 发现循环
					if (visited.has(taskId)) return false // 已访问，无循环

					visited.add(taskId)
					path.add(taskId)

					const task = tasks.find(t => t.id === taskId)
					if (!task) return false

					for (const depId of task.dependencies) {
						if (hasCircular(depId, visited, path)) return true
					}

					path.delete(taskId)
					return false
				}

				const circularTasks = []

				tasks.forEach(task => {
					const visited = new Set()
					const path = new Set()
					if (hasCircular(task.id, visited, path)) {
						circularTasks.push(task.id)
					}
				})

				return [...new Set(circularTasks)] // 去重
			}

			const circularTasks = [
				{ id: 1, dependencies: [3] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [2] } // 形成循环: 1 -> 3 -> 2 -> 1
			]

			const noCircularTasks = [
				{ id: 1, dependencies: [] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [1, 2] }
			]

			const circularIds = detectCircularDependency(circularTasks)
			const noCircularIds = detectCircularDependency(noCircularTasks)

			expect(circularIds).toContain(1)
			expect(circularIds).toContain(2)
			expect(circularIds).toContain(3)
			expect(noCircularIds).toHaveLength(0)
		})

		it('应该验证状态转换规则', () => {
			const validateStatusTransition = (currentStatus, newStatus) => {
				const validTransitions = {
					'pending': ['in-progress', 'cancelled', 'blocked'],
					'in-progress': ['done', 'blocked', 'pending', 'cancelled'],
					'done': ['pending', 'in-progress'], // 允许重新打开
					'blocked': ['pending', 'in-progress', 'cancelled'],
					'cancelled': ['pending'], // 只允许重新开始
					'deferred': ['pending', 'in-progress', 'cancelled']
				}

				return validTransitions[currentStatus]?.includes(newStatus) || false
			}

			expect(validateStatusTransition('pending', 'in-progress')).toBe(true)
			expect(validateStatusTransition('in-progress', 'done')).toBe(true)
			expect(validateStatusTransition('done', 'cancelled')).toBe(false)
			expect(validateStatusTransition('cancelled', 'done')).toBe(false)
			expect(validateStatusTransition('cancelled', 'pending')).toBe(true)
		})
	})

	describe('批量验证功能', () => {
		it('应该批量验证多个任务', () => {
			const validateTasks = (tasks) => {
				const results = {
					valid: [],
					invalid: [],
					total: tasks.length
				}

				tasks.forEach((task, index) => {
					const taskErrors = []

					// 检查必需字段
					if (!task.id) taskErrors.push('缺少ID')
					if (!task.title) taskErrors.push('缺少标题')
					if (!task.status) taskErrors.push('缺少状态')

					// 检查数据类型
					if (task.id && typeof task.id !== 'number') taskErrors.push('ID必须是数字')
					if (task.title && typeof task.title !== 'string') taskErrors.push('标题必须是字符串')

					if (taskErrors.length === 0) {
						results.valid.push({ index, task })
					} else {
						results.invalid.push({ index, task, errors: taskErrors })
					}
				})

				results.validCount = results.valid.length
				results.invalidCount = results.invalid.length

				return results
			}

			const tasks = [
				{ id: 1, title: '有效任务1', status: 'pending' },
				{ id: 'invalid', title: '无效ID', status: 'pending' },
				{ title: '缺少ID', status: 'done' },
				{ id: 4, title: '', status: 'in-progress' } // 空标题
			]

			const validationResults = validateTasks(tasks)

			expect(validationResults.total).toBe(4)
			expect(validationResults.validCount).toBe(1)
			expect(validationResults.invalidCount).toBe(3)
			expect(validationResults.valid[0].task.id).toBe(1)
			expect(validationResults.invalid.some(r => r.errors.includes('缺少ID'))).toBe(true)
		})

		it('应该生成验证报告', () => {
			const generateValidationReport = (validationResults) => {
				const report = {
					summary: {
						total: validationResults.total,
						valid: validationResults.validCount,
						invalid: validationResults.invalidCount,
						validityRate: Math.round((validationResults.validCount / validationResults.total) * 100)
					},
					details: {
						validTasks: validationResults.valid.map(r => ({ id: r.task.id, title: r.task.title })),
						invalidTasks: validationResults.invalid.map(r => ({
							id: r.task.id,
							title: r.task.title,
							errors: r.errors
						}))
					},
					timestamp: new Date().toISOString(),
					recommendations: []
				}

				// 生成修复建议
				if (validationResults.invalidCount > 0) {
					report.recommendations.push('修复无效任务的错误字段')
				}

				const missingIds = validationResults.invalid.filter(r => r.errors.includes('缺少ID')).length
				if (missingIds > 0) {
					report.recommendations.push(`为${missingIds}个任务分配有效的ID`)
				}

				return report
			}

			const mockResults = {
				total: 10,
				validCount: 7,
				invalidCount: 3,
				valid: [
					{ task: { id: 1, title: '任务1' } },
					{ task: { id: 2, title: '任务2' } }
				],
				invalid: [
					{ task: { id: 3, title: '任务3' }, errors: ['缺少标题'] },
					{ task: { title: '无ID任务' }, errors: ['缺少ID'] }
				]
			}

			const report = generateValidationReport(mockResults)

			expect(report.summary.validityRate).toBe(70)
			expect(report.details.validTasks).toHaveLength(2)
			expect(report.details.invalidTasks).toHaveLength(2)
			expect(report.recommendations).toContain('修复无效任务的错误字段')
			expect(report.recommendations).toContain('为1个任务分配有效的ID')
		})
	})

	describe('验证错误处理', () => {
		it('应该处理验证过程中的异常', () => {
			const safeValidateTask = (task) => {
				try {
					// 模拟可能抛出异常的验证逻辑
					if (!task) throw new Error('任务对象为空')
					if (task.id === undefined) throw new Error('任务ID未定义')

					// 正常验证逻辑
					const errors = []
					if (!task.title) errors.push('缺少标题')
					if (!task.status) errors.push('缺少状态')

					return { isValid: errors.length === 0, errors }
				} catch (error) {
					return {
						isValid: false,
						errors: [`验证失败: ${error.message}`],
						exception: true
					}
				}
			}

			expect(safeValidateTask(null).exception).toBe(true)
			expect(safeValidateTask(null).errors[0]).toContain('任务对象为空')

			expect(safeValidateTask({}).exception).toBe(true)
			expect(safeValidateTask({}).errors[0]).toContain('任务ID未定义')

			expect(safeValidateTask({ id: 1, title: '有效任务', status: 'pending' }).isValid).toBe(true)
		})

		it('应该验证验证规则的配置', () => {
			const validateValidationRules = (rules) => {
				const requiredRules = ['requiredFields', 'dataTypes', 'businessRules']
				const errors = []

				requiredRules.forEach(rule => {
					if (!rules[rule]) {
						errors.push(`缺少必需的验证规则: ${rule}`)
					}
				})

				// 验证规则结构的有效性
				if (rules.dataTypes) {
					Object.entries(rules.dataTypes).forEach(([field, validator]) => {
						if (typeof validator !== 'function') {
							errors.push(`字段 ${field} 的验证器不是函数`)
						}
					})
				}

				return { isValid: errors.length === 0, errors }
			}

			const validRules = {
				requiredFields: ['id', 'title', 'status'],
				dataTypes: {
					id: (value) => typeof value === 'number',
					title: (value) => typeof value === 'string'
				},
				businessRules: ['uniqueIds', 'noCircularDeps']
			}

			const invalidRules = {
				requiredFields: ['id', 'title'],
				// 缺少dataTypes和businessRules
				customRules: ['someRule']
			}

			expect(validateValidationRules(validRules).isValid).toBe(true)
			expect(validateValidationRules(invalidRules).isValid).toBe(false)
			expect(validateValidationRules(invalidRules).errors).toContain('缺少必需的验证规则: dataTypes')
			expect(validateValidationRules(invalidRules).errors).toContain('缺少必需的验证规则: businessRules')
		})

		it('应该提供验证错误的详细诊断信息', () => {
			const createDetailedError = (task, field, errorType, value) => {
				const errorDetails = {
					field,
					errorType,
					value,
					taskId: task.id,
					taskTitle: task.title,
					expected: '',
					actual: value,
					suggestion: ''
				}

				switch (errorType) {
					case 'missing':
						errorDetails.expected = '非空值'
						errorDetails.suggestion = `为任务 "${task.title}" 提供有效的 ${field}`
						break
					case 'invalid_type':
						errorDetails.expected = '正确的数据类型'
						errorDetails.suggestion = `将 ${field} 的值转换为正确的数据类型`
						break
					case 'invalid_value':
						errorDetails.expected = '有效值'
						errorDetails.suggestion = `检查 ${field} 的值是否在允许范围内`
						break
				}

				return errorDetails
			}

			const task = { id: 1, title: '测试任务', status: 'unknown' }

			const error1 = createDetailedError(task, 'status', 'invalid_value', 'unknown')
			const error2 = createDetailedError(task, 'description', 'missing', undefined)

			expect(error1.field).toBe('status')
			expect(error1.errorType).toBe('invalid_value')
			expect(error1.suggestion).toContain('检查 status 的值是否在允许范围内')

			expect(error2.field).toBe('description')
			expect(error2.errorType).toBe('missing')
			expect(error2.suggestion).toContain('为任务 "测试任务" 提供有效的 description')
		})
	})

	describe('验证配置管理', () => {
		it('应该支持自定义验证规则', () => {
			const createCustomValidator = (config) => {
				return (task) => {
					const errors = []

					// 应用配置的验证规则
					if (config.requireDescription && !task.description) {
						errors.push('必须提供任务描述')
					}

					if (config.maxTitleLength && task.title && task.title.length > config.maxTitleLength) {
						errors.push(`标题长度不能超过 ${config.maxTitleLength} 个字符`)
					}

					if (config.allowedPriorities && task.priority && !config.allowedPriorities.includes(task.priority)) {
						errors.push(`优先级必须是: ${config.allowedPriorities.join(', ')}`)
					}

					return { isValid: errors.length === 0, errors }
				}
			}

			const strictConfig = {
				requireDescription: true,
				maxTitleLength: 50,
				allowedPriorities: ['low', 'medium', 'high']
			}

			const lenientConfig = {
				requireDescription: false,
				maxTitleLength: 200,
				allowedPriorities: ['low', 'medium', 'high', 'urgent']
			}

			const strictValidator = createCustomValidator(strictConfig)
			const lenientValidator = createCustomValidator(lenientConfig)

			const task1 = { id: 1, title: '短标题', description: '有描述', priority: 'high' }
			const task2 = { id: 2, title: '很长很长的标题'.repeat(50), description: '', priority: 'urgent' }

			expect(strictValidator(task1).isValid).toBe(true)
			expect(strictValidator(task2).isValid).toBe(false) // 标题过长、无描述、优先级无效

			expect(lenientValidator(task1).isValid).toBe(true)
			expect(lenientValidator(task2).isValid).toBe(false) // 标题过长、无描述但允许
		})

		it('应该支持验证规则的启用/禁用', () => {
			const createConditionalValidator = (enabledRules) => {
				const allRules = {
					checkId: (task) => !task.id ? ['缺少ID'] : [],
					checkTitle: (task) => !task.title ? ['缺少标题'] : [],
					checkStatus: (task) => !task.status ? ['缺少状态'] : [],
					checkDependencies: (task) => {
						if (!task.dependencies) return []
						const invalidDeps = task.dependencies.filter(dep => typeof dep !== 'number')
						return invalidDeps.length > 0 ? ['依赖关系包含无效值'] : []
					}
				}

				return (task) => {
					const errors = []

					Object.entries(allRules).forEach(([ruleName, ruleFn]) => {
						if (enabledRules.includes(ruleName)) {
							errors.push(...ruleFn(task))
						}
					})

					return { isValid: errors.length === 0, errors }
				}
			}

			const minimalValidator = createConditionalValidator(['checkId', 'checkTitle'])
			const fullValidator = createConditionalValidator(['checkId', 'checkTitle', 'checkStatus', 'checkDependencies'])

			const task = { id: 1, title: '测试任务' } // 缺少status和dependencies

			expect(minimalValidator(task).isValid).toBe(true) // 只检查ID和标题
			expect(fullValidator(task).isValid).toBe(false) // 检查所有规则
			expect(fullValidator(task).errors).toContain('缺少状态')
		})
	})
})
