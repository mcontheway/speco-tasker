import fs from 'fs'
import path from 'path'
import { log } from '../utils.js'

/**
 * Validates spec_files field for tasks and subtasks
 * @param {Object} task - Task object to validate
 * @param {boolean} isSubtask - Whether this is a subtask validation
 * @param {string} projectRoot - Project root directory
 * @param {Function} report - Report function for logging
 * @returns {Object} Validation result with isValid boolean and error messages
 */
export function validateSpecFiles(task, projectRoot, report, isSubtask = false) {
	const result = {
		isValid: true,
		errors: [],
		warnings: []
	}

	const taskType = isSubtask ? '子任务' : '任务'
	const taskId = isSubtask ? `${task.parentTaskId}.${task.id}` : task.id

	// Check if spec_files field exists
	if (!task.hasOwnProperty('spec_files')) {
		result.isValid = false
		result.errors.push(`缺少必填字段 'spec_files'，请先完成规范文档`)
		return result
	}

	// Check if spec_files is an array
	if (!Array.isArray(task.spec_files)) {
		result.isValid = false
		result.errors.push(`'spec_files' 字段必须是数组类型`)
		return result
	}

	// Check if spec_files is empty
	if (task.spec_files.length === 0) {
		result.isValid = false
		result.errors.push(`'spec_files' 字段不能为空，请至少关联一个规范文档`)
		return result
	}

	// Validate each spec file entry
	task.spec_files.forEach((specFile, index) => {
		// Check required fields
		if (!specFile.type || typeof specFile.type !== 'string') {
			result.errors.push(`spec_files[${index}] 缺少或无效的 'type' 字段`)
		}

		if (!specFile.title || typeof specFile.title !== 'string') {
			result.errors.push(`spec_files[${index}] 缺少或无效的 'title' 字段`)
		}

		if (!specFile.file || typeof specFile.file !== 'string') {
			result.errors.push(`spec_files[${index}] 缺少或无效的 'file' 字段`)
		} else {
			// Check if file exists
			const filePath = path.resolve(projectRoot, specFile.file)
			if (!fs.existsSync(filePath)) {
				result.warnings.push(`规范文档文件不存在: ${specFile.file}`)
			}
		}
	})

	// Set overall validity
	result.isValid = result.errors.length === 0

	return result
}

/**
 * Validates logs field for tasks and subtasks
 * @param {Object} task - Task object to validate
 * @param {boolean} isSubtask - Whether this is a subtask validation
 * @param {Function} report - Report function for logging
 * @returns {Object} Validation result
 */
export function validateLogs(task, report, isSubtask = false) {
	const result = {
		isValid: true,
		errors: [],
		warnings: []
	}

	// Logs is optional, so only validate if present
	if (task.hasOwnProperty('logs')) {
		if (typeof task.logs !== 'string') {
			result.isValid = false
			result.errors.push(`'logs' 字段必须是字符串类型`)
		}
	}

	return result
}

/**
 * Validates required fields for tasks and subtasks (strict validation)
 * @param {Object} task - Task object to validate
 * @param {boolean} isSubtask - Whether this is a subtask validation
 * @param {Function} report - Report function for logging
 * @returns {Object} Validation result
 */
export function validateRequiredFields(task, report, isSubtask = false) {
	const result = {
		isValid: true,
		errors: [],
		warnings: []
	}

	const taskType = isSubtask ? '子任务' : '任务'

	// Validate description
	if (!task.description || typeof task.description !== 'string' || task.description.trim() === '') {
		result.isValid = false
		result.errors.push(`${taskType}描述不能为空`)
	}

	// Validate priority
	const validPriorities = ['high', 'medium', 'low']
	if (!task.priority || !validPriorities.includes(task.priority)) {
		result.isValid = false
		result.errors.push(`${taskType}优先级必须是 'high', 'medium' 或 'low' 中的一个`)
	}

	// Validate details
	if (!task.details || typeof task.details !== 'string' || task.details.trim() === '') {
		result.isValid = false
		result.errors.push(`${taskType}实现细节不能为空`)
	}

	// Validate testStrategy
	if (
		!task.testStrategy ||
		typeof task.testStrategy !== 'string' ||
		task.testStrategy.trim() === ''
	) {
		result.isValid = false
		result.errors.push(`${taskType}测试策略不能为空`)
	}

	return result
}

/**
 * Comprehensive validation for task data (strict validation for spec-driven development)
 * @param {Object} task - Task object to validate
 * @param {boolean} isSubtask - Whether this is a subtask validation
 * @param {string} projectRoot - Project root directory
 * @param {Function} report - Report function for logging
 * @returns {Object} Complete validation result
 */
export function validateTaskData(task, projectRoot, report, isSubtask = false) {
	const specFilesValidation = validateSpecFiles(task, projectRoot, report, isSubtask)
	const logsValidation = validateLogs(task, report, isSubtask)
	const requiredFieldsValidation = validateRequiredFields(task, report, isSubtask)

	return {
		isValid:
			specFilesValidation.isValid && logsValidation.isValid && requiredFieldsValidation.isValid,
		specFiles: specFilesValidation,
		logs: logsValidation,
		requiredFields: requiredFieldsValidation,
		allErrors: [
			...specFilesValidation.errors,
			...logsValidation.errors,
			...requiredFieldsValidation.errors
		],
		allWarnings: [
			...specFilesValidation.warnings,
			...logsValidation.warnings,
			...requiredFieldsValidation.warnings
		]
	}
}

/**
 * Generates a user-friendly validation error message
 * @param {Object} validationResult - Result from validateTaskData
 * @param {boolean} isSubtask - Whether this is a subtask
 * @param {number|string} taskId - Task ID
 * @returns {string} Formatted error message
 */
export function formatValidationError(validationResult, taskId, isSubtask = false) {
	const taskType = isSubtask ? '子任务' : '任务'
	let message = `${taskType} ${taskId} 验证失败:\n`

	if (validationResult.allErrors.length > 0) {
		message += '\n错误:\n'
		validationResult.allErrors.forEach((error) => {
			message += `  - ${error}\n`
		})
	}

	if (validationResult.allWarnings.length > 0) {
		message += '\n警告:\n'
		validationResult.allWarnings.forEach((warning) => {
			message += `  - ${warning}\n`
		})
	}

	message += '\n请先完成规范文档，然后重试。'

	return message
}
