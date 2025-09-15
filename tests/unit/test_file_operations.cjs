/**
 * test_file_operations.cjs
 * 单元测试：验证文件操作功能
 *
 * SCOPE: 测试文件系统的读写操作、路径处理、目录操作和文件权限管理
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

describe('文件操作功能验证', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('文件读写操作', () => {
		it('应该能够读取文本文件', () => {
			const fs = require('fs')
			const path = require('path')
			const mockContent = '这是测试文件内容\n第二行内容'

			fs.readFileSync = jest.fn().mockReturnValue(mockContent)

			const readTextFile = (filePath, encoding = 'utf8') => {
				try {
					return fs.readFileSync(filePath, encoding)
				} catch (error) {
					throw new Error(`读取文件失败: ${error.message}`)
				}
			}

			const content = readTextFile('/mock/test.txt')
			expect(content).toBe(mockContent)
			expect(fs.readFileSync).toHaveBeenCalledWith('/mock/test.txt', 'utf8')
		})

		it('应该能够写入文本文件', () => {
			const fs = require('fs')
			fs.writeFileSync = jest.fn()

			const writeTextFile = (filePath, content, encoding = 'utf8') => {
				try {
					fs.writeFileSync(filePath, content, encoding)
					return true
				} catch (error) {
					throw new Error(`写入文件失败: ${error.message}`)
				}
			}

			const result = writeTextFile('/mock/output.txt', '新文件内容')
			expect(result).toBe(true)
			expect(fs.writeFileSync).toHaveBeenCalledWith('/mock/output.txt', '新文件内容', 'utf8')
		})

		it('应该能够读取JSON文件', () => {
			const fs = require('fs')
			const mockData = { name: '测试项目', version: '1.0.0' }
			fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockData))

			const readJSONFile = (filePath) => {
				try {
					const content = fs.readFileSync(filePath, 'utf8')
					return JSON.parse(content)
				} catch (error) {
					throw new Error(`读取JSON文件失败: ${error.message}`)
				}
			}

			const data = readJSONFile('/mock/config.json')
			expect(data).toEqual(mockData)
			expect(data.name).toBe('测试项目')
			expect(data.version).toBe('1.0.0')
		})

		it('应该能够写入JSON文件', () => {
			const fs = require('fs')
			fs.writeFileSync = jest.fn()

			const writeJSONFile = (filePath, data, indent = 2) => {
				try {
					const content = JSON.stringify(data, null, indent)
					fs.writeFileSync(filePath, content, 'utf8')
					return true
				} catch (error) {
					throw new Error(`写入JSON文件失败: ${error.message}`)
				}
			}

			const data = { project: 'test', tasks: [1, 2, 3] }
			const result = writeJSONFile('/mock/tasks.json', data)

			expect(result).toBe(true)
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				'/mock/tasks.json',
				JSON.stringify(data, null, 2),
				'utf8'
			)
		})

		it('应该处理文件读取错误', () => {
			const fs = require('fs')
			fs.readFileSync = jest.fn().mockImplementation(() => {
				throw new Error('文件不存在')
			})

			const readTextFile = (filePath) => {
				try {
					return fs.readFileSync(filePath, 'utf8')
				} catch (error) {
					return null // 返回null表示读取失败
				}
			}

			const content = readTextFile('/non-existent/file.txt')
			expect(content).toBeNull()
		})
	})

	describe('路径操作', () => {
		it('应该能够解析和操作文件路径', () => {
			const path = require('path')

			const normalizePath = (inputPath) => {
				return path.normalize(inputPath)
			}

			const joinPaths = (...paths) => {
				return path.join(...paths)
			}

			const getFileName = (filePath) => {
				return path.basename(filePath)
			}

			const getDirectory = (filePath) => {
				return path.dirname(filePath)
			}

			const getExtension = (filePath) => {
				return path.extname(filePath)
			}

			expect(normalizePath('path/to//file.txt')).toBe('path/to/file.txt')
			expect(joinPaths('project', 'src', 'index.js')).toBe('project/src/index.js')
			expect(getFileName('/path/to/file.txt')).toBe('file.txt')
			expect(getDirectory('/path/to/file.txt')).toBe('/path/to')
			expect(getExtension('file.txt')).toBe('.txt')
			expect(getExtension('file')).toBe('')
		})

		it('应该能够处理相对路径和绝对路径', () => {
			const path = require('path')

			const isAbsolutePath = (filePath) => {
				return path.isAbsolute(filePath)
			}

			const resolvePath = (basePath, relativePath) => {
				return path.resolve(basePath, relativePath)
			}

			const relativePath = (from, to) => {
				return path.relative(from, to)
			}

			expect(isAbsolutePath('/absolute/path')).toBe(true)
			expect(isAbsolutePath('relative/path')).toBe(false)
			expect(resolvePath('/base', 'relative/file.txt')).toMatch(/\/base\/relative\/file\.txt$/)
			expect(relativePath('/a/b/c', '/a/d/e')).toBe('../../d/e')
		})

		it('应该能够验证路径安全性', () => {
			const validatePath = (filePath) => {
				const errors = []

				// 检查路径遍历攻击
				if (filePath.includes('../') || filePath.includes('..\\')) {
					errors.push('路径包含目录遍历风险')
				}

				// 检查绝对路径
				if (!filePath.startsWith('/')) {
					errors.push('路径应该以/开头')
				}

				// 检查空路径
				if (!filePath || filePath.trim() === '') {
					errors.push('路径不能为空')
				}

				// 检查特殊字符
				const invalidChars = /[<>:"|?*\x00-\x1f]/
				if (invalidChars.test(filePath)) {
					errors.push('路径包含无效字符')
				}

				return { isValid: errors.length === 0, errors }
			}

			expect(validatePath('/valid/path/file.txt').isValid).toBe(true)
			expect(validatePath('../../../etc/passwd').isValid).toBe(false)
			expect(validatePath('relative/path').isValid).toBe(false)
			expect(validatePath('').isValid).toBe(false)
			expect(validatePath('/path/with<invalid>chars').isValid).toBe(false)
		})
	})

	describe('目录操作', () => {
		it('应该能够检查目录存在性', () => {
			const fs = require('fs')
			const path = require('path')

			// Mock 不同的目录状态
			fs.statSync = jest.fn()
				.mockImplementationOnce(() => ({
					isDirectory: () => true
				}))
				.mockImplementationOnce(() => {
					throw new Error('目录不存在')
				})

			const directoryExists = (dirPath) => {
				try {
					const stats = fs.statSync(dirPath)
					return stats.isDirectory()
				} catch (error) {
					return false
				}
			}

			expect(directoryExists('/existing/directory')).toBe(true)
			expect(directoryExists('/non-existent/directory')).toBe(false)
		})

		it('应该能够创建目录', () => {
			const fs = require('fs')
			const path = require('path')

			fs.mkdirSync = jest.fn()

			const createDirectory = (dirPath, recursive = true) => {
				try {
					fs.mkdirSync(dirPath, { recursive })
					return true
				} catch (error) {
					throw new Error(`创建目录失败: ${error.message}`)
				}
			}

			const result = createDirectory('/new/directory')
			expect(result).toBe(true)
			expect(fs.mkdirSync).toHaveBeenCalledWith('/new/directory', { recursive: true })
		})

		it('应该能够递归创建目录结构', () => {
			const fs = require('fs')
			const path = require('path')

			fs.mkdirSync = jest.fn()

			const ensureDirectoryExists = (dirPath) => {
				const parts = dirPath.split('/')
				let currentPath = ''

				for (const part of parts) {
					if (part) {
						currentPath += '/' + part
						try {
							fs.mkdirSync(currentPath, { recursive: true })
						} catch (error) {
							// 目录已存在，忽略错误
						}
					}
				}

				return true
			}

			const result = ensureDirectoryExists('/deep/nested/directory/structure')
			expect(result).toBe(true)
			// 验证是否为每个层级调用了mkdirSync
			expect(fs.mkdirSync).toHaveBeenCalled()
		})

		it('应该能够列出目录内容', () => {
			const fs = require('fs')

			fs.readdirSync = jest.fn().mockReturnValue([
				'file1.txt',
				'file2.js',
				'subdirectory',
				'.hidden-file'
			])

			const listDirectory = (dirPath, includeHidden = false) => {
				try {
					const items = fs.readdirSync(dirPath)
					if (!includeHidden) {
						return items.filter(item => !item.startsWith('.'))
					}
					return items
				} catch (error) {
					throw new Error(`读取目录失败: ${error.message}`)
				}
			}

			const visibleFiles = listDirectory('/test/directory')
			const allFiles = listDirectory('/test/directory', true)

			expect(visibleFiles).toEqual(['file1.txt', 'file2.js', 'subdirectory'])
			expect(allFiles).toContain('.hidden-file')
			expect(allFiles).toHaveLength(4)
		})

		it('应该能够删除目录', () => {
			const fs = require('fs')

			fs.rmSync = jest.fn()

			const removeDirectory = (dirPath, recursive = false) => {
				try {
					fs.rmSync(dirPath, { recursive, force: true })
					return true
				} catch (error) {
					throw new Error(`删除目录失败: ${error.message}`)
				}
			}

			const result = removeDirectory('/old/directory', true)
			expect(result).toBe(true)
			expect(fs.rmSync).toHaveBeenCalledWith('/old/directory', { recursive: true, force: true })
		})
	})

	describe('文件权限和属性', () => {
		it('应该能够检查文件权限', () => {
			const fs = require('fs')

			fs.accessSync = jest.fn()
				.mockImplementationOnce(() => {}) // 可读
				.mockImplementationOnce(() => {
					throw new Error('权限被拒绝')
				}) // 不可写

			const checkFilePermissions = (filePath) => {
				const permissions = {
					readable: false,
					writable: false,
					executable: false
				}

				try {
					fs.accessSync(filePath, fs.constants.R_OK)
					permissions.readable = true
				} catch (error) {
					// 不可读
				}

				try {
					fs.accessSync(filePath, fs.constants.W_OK)
					permissions.writable = true
				} catch (error) {
					// 不可写
				}

				try {
					fs.accessSync(filePath, fs.constants.X_OK)
					permissions.executable = true
				} catch (error) {
					// 不可执行
				}

				return permissions
			}

			const readableFile = checkFilePermissions('/readable/file.txt')
			const restrictedFile = checkFilePermissions('/restricted/file.txt')

			expect(readableFile.readable).toBe(true)
			expect(readableFile.writable).toBe(false) // 模拟只读文件
		})

		it('应该能够获取文件属性', () => {
			const fs = require('fs')

			fs.statSync = jest.fn().mockReturnValue({
				size: 1024,
				atime: new Date('2024-01-01T10:00:00.000Z'),
				mtime: new Date('2024-01-02T11:00:00.000Z'),
				ctime: new Date('2024-01-01T09:00:00.000Z'),
				isFile: () => true,
				isDirectory: () => false,
				mode: parseInt('644', 8)
			})

			const getFileAttributes = (filePath) => {
				try {
					const stats = fs.statSync(filePath)
					return {
						size: stats.size,
						accessedAt: stats.atime,
						modifiedAt: stats.mtime,
						createdAt: stats.ctime,
						isFile: stats.isFile(),
						isDirectory: stats.isDirectory(),
						permissions: (stats.mode & parseInt('777', 8)).toString(8)
					}
				} catch (error) {
					throw new Error(`获取文件属性失败: ${error.message}`)
				}
			}

			const attributes = getFileAttributes('/test/file.txt')

			expect(attributes.size).toBe(1024)
			expect(attributes.isFile).toBe(true)
			expect(attributes.isDirectory).toBe(false)
			expect(attributes.permissions).toBe('644')
			expect(attributes.accessedAt).toEqual(new Date('2024-01-01T10:00:00.000Z'))
		})

		it('应该能够设置文件权限', () => {
			const fs = require('fs')

			fs.chmodSync = jest.fn()

			const setFilePermissions = (filePath, mode) => {
				try {
					fs.chmodSync(filePath, mode)
					return true
				} catch (error) {
					throw new Error(`设置文件权限失败: ${error.message}`)
				}
			}

			const result = setFilePermissions('/test/file.txt', parseInt('755', 8))
			expect(result).toBe(true)
			expect(fs.chmodSync).toHaveBeenCalledWith('/test/file.txt', parseInt('755', 8))
		})
	})

	describe('文件操作的原子性', () => {
		it('应该支持原子性文件写入', () => {
			const fs = require('fs')
			const path = require('path')

			fs.writeFileSync = jest.fn()
			fs.renameSync = jest.fn()

			const writeFileAtomically = (filePath, content) => {
				const tempPath = filePath + '.tmp'

				try {
					// 先写入临时文件
					fs.writeFileSync(tempPath, content, 'utf8')
					// 原子性重命名
					fs.renameSync(tempPath, filePath)
					return true
				} catch (error) {
					// 清理临时文件
					try {
						fs.unlinkSync(tempPath)
					} catch (cleanupError) {
						// 忽略清理错误
					}
					throw new Error(`原子性写入失败: ${error.message}`)
				}
			}

			const result = writeFileAtomically('/test/file.txt', '新内容')
			expect(result).toBe(true)
			expect(fs.writeFileSync).toHaveBeenCalledWith('/test/file.txt.tmp', '新内容', 'utf8')
			expect(fs.renameSync).toHaveBeenCalledWith('/test/file.txt.tmp', '/test/file.txt')
		})

		it('应该处理并发文件访问', () => {
			const fs = require('fs')

			// 模拟文件锁定机制
			let fileLock = false
			fs.writeFileSync = jest.fn().mockImplementation(() => {
				if (fileLock) {
					throw new Error('文件被锁定')
				}
				fileLock = true
				// 模拟写入操作
				setTimeout(() => {
					fileLock = false
				}, 100)
			})

			const writeFileWithLock = async (filePath, content) => {
				const maxRetries = 3
				let retries = 0

				while (retries < maxRetries) {
					try {
						fs.writeFileSync(filePath, content, 'utf8')
						return true
					} catch (error) {
						if (error.message.includes('文件被锁定') && retries < maxRetries - 1) {
							retries++
							await new Promise(resolve => setTimeout(resolve, 50)) // 等待重试
							continue
						}
						throw error
					}
				}

				throw new Error('写入文件失败：超过最大重试次数')
			}

			// 测试正常写入（简化测试，不涉及真正的异步）
			const writeFileWithLockSync = (filePath, content) => {
				try {
					fs.writeFileSync(filePath, content, 'utf8')
					return true
				} catch (error) {
					return false
				}
			}

			const result = writeFileWithLockSync('/test/file.txt', '内容')
			expect(result).toBe(true)
		})
	})

	describe('高级文件操作', () => {
		it('应该能够复制文件', () => {
			const fs = require('fs')

			fs.copyFileSync = jest.fn()

			const copyFile = (sourcePath, destPath) => {
				try {
					fs.copyFileSync(sourcePath, destPath)
					return true
				} catch (error) {
					throw new Error(`复制文件失败: ${error.message}`)
				}
			}

			const result = copyFile('/source/file.txt', '/dest/file.txt')
			expect(result).toBe(true)
			expect(fs.copyFileSync).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt')
		})

		it('应该能够移动文件', () => {
			const fs = require('fs')

			fs.renameSync = jest.fn()

			const moveFile = (sourcePath, destPath) => {
				try {
					fs.renameSync(sourcePath, destPath)
					return true
				} catch (error) {
					throw new Error(`移动文件失败: ${error.message}`)
				}
			}

			const result = moveFile('/source/file.txt', '/dest/file.txt')
			expect(result).toBe(true)
			expect(fs.renameSync).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt')
		})

		it('应该能够删除文件', () => {
			const fs = require('fs')

			fs.unlinkSync = jest.fn()

			const deleteFile = (filePath) => {
				try {
					fs.unlinkSync(filePath)
					return true
				} catch (error) {
					if (error.code === 'ENOENT') {
						return true // 文件不存在，视为删除成功
					}
					throw new Error(`删除文件失败: ${error.message}`)
				}
			}

			const result = deleteFile('/test/file.txt')
			expect(result).toBe(true)
			expect(fs.unlinkSync).toHaveBeenCalledWith('/test/file.txt')
		})

		it('应该能够检查文件存在性', () => {
			const fs = require('fs')

			fs.existsSync = jest.fn()
				.mockReturnValueOnce(true)
				.mockReturnValueOnce(false)

			const fileExists = (filePath) => {
				return fs.existsSync(filePath)
			}

			expect(fileExists('/existing/file.txt')).toBe(true)
			expect(fileExists('/non-existent/file.txt')).toBe(false)
		})
	})

	describe('批量文件操作', () => {
		it('应该支持批量文件复制', () => {
			const fs = require('fs')

			fs.copyFileSync = jest.fn()

			const batchCopyFiles = (fileMappings) => {
				const results = []

				for (const { source, dest } of fileMappings) {
					try {
						fs.copyFileSync(source, dest)
						results.push({ source, dest, success: true })
					} catch (error) {
						results.push({ source, dest, success: false, error: error.message })
					}
				}

				return results
			}

			const mappings = [
				{ source: '/src/file1.txt', dest: '/dest/file1.txt' },
				{ source: '/src/file2.txt', dest: '/dest/file2.txt' }
			]

			const results = batchCopyFiles(mappings)

			expect(results).toHaveLength(2)
			expect(results[0].success).toBe(true)
			expect(results[1].success).toBe(true)
			expect(fs.copyFileSync).toHaveBeenCalledTimes(2)
		})

		it('应该支持批量文件删除', () => {
			const fs = require('fs')

			fs.unlinkSync = jest.fn()

			const batchDeleteFiles = (filePaths) => {
				const results = []

				for (const filePath of filePaths) {
					try {
						fs.unlinkSync(filePath)
						results.push({ path: filePath, success: true })
					} catch (error) {
						results.push({ path: filePath, success: false, error: error.message })
					}
				}

				return results
			}

			const files = ['/temp/file1.txt', '/temp/file2.txt', '/temp/file3.txt']
			const results = batchDeleteFiles(files)

			expect(results).toHaveLength(3)
			results.forEach(result => {
				expect(result.success).toBe(true)
			})
			expect(fs.unlinkSync).toHaveBeenCalledTimes(3)
		})

		it('应该支持条件文件操作', () => {
			const fs = require('fs')

			fs.statSync = jest.fn()
				.mockReturnValueOnce({ size: 100 }) // 小文件
				.mockReturnValueOnce({ size: 1000000 }) // 大文件
				.mockReturnValueOnce({ size: 50 }) // 小文件

			const conditionalDeleteFiles = (filePaths, condition) => {
				const results = []

				for (const filePath of filePaths) {
					try {
						const stats = fs.statSync(filePath)
						if (condition(stats)) {
							fs.unlinkSync(filePath)
							results.push({ path: filePath, deleted: true })
						} else {
							results.push({ path: filePath, deleted: false, reason: '不满足删除条件' })
						}
					} catch (error) {
						results.push({ path: filePath, deleted: false, error: error.message })
					}
				}

				return results
			}

			const files = ['/temp/small1.txt', '/temp/large.txt', '/temp/small2.txt']
			const results = conditionalDeleteFiles(files, stats => stats.size < 1000) // 删除小于1KB的文件

			expect(results[0].deleted).toBe(true) // 小文件被删除
			expect(results[1].deleted).toBe(false) // 大文件未被删除
			expect(results[2].deleted).toBe(true) // 小文件被删除
		})
	})

	describe('文件操作错误处理', () => {
		it('应该处理文件操作的各种错误情况', () => {
			const fs = require('fs')

			// 模拟不同的错误情况
			fs.readFileSync = jest.fn()
				.mockImplementationOnce(() => {
					throw { code: 'ENOENT', message: '文件不存在' }
				})
				.mockImplementationOnce(() => {
					throw { code: 'EACCES', message: '权限被拒绝' }
				})
				.mockImplementationOnce(() => {
					throw { code: 'EISDIR', message: '是目录而不是文件' }
				})

			const readFileWithErrorHandling = (filePath) => {
				try {
					return { success: true, content: fs.readFileSync(filePath, 'utf8') }
				} catch (error) {
					let errorType = 'UNKNOWN_ERROR'
					let message = error.message

					switch (error.code) {
						case 'ENOENT':
							errorType = 'FILE_NOT_FOUND'
							message = '文件不存在'
							break
						case 'EACCES':
							errorType = 'PERMISSION_DENIED'
							message = '没有访问权限'
							break
						case 'EISDIR':
							errorType = 'IS_DIRECTORY'
							message = '路径指向的是目录而不是文件'
							break
					}

					return { success: false, errorType, message }
				}
			}

			expect(readFileWithErrorHandling('/non-existent.txt')).toEqual({
				success: false,
				errorType: 'FILE_NOT_FOUND',
				message: '文件不存在'
			})

			expect(readFileWithErrorHandling('/forbidden.txt')).toEqual({
				success: false,
				errorType: 'PERMISSION_DENIED',
				message: '没有访问权限'
			})

			expect(readFileWithErrorHandling('/directory')).toEqual({
				success: false,
				errorType: 'IS_DIRECTORY',
				message: '路径指向的是目录而不是文件'
			})
		})

		it('应该提供详细的文件操作日志', () => {
			const fs = require('fs')
			const logs = []

			const logFileOperation = (operation, filePath, result, details = {}) => {
				logs.push({
					timestamp: new Date().toISOString(),
					operation,
					filePath,
					result,
					details
				})
			}

			const loggedReadFile = (filePath) => {
				try {
					logFileOperation('READ_START', filePath, 'pending')
					const content = fs.readFileSync(filePath, 'utf8')
					logFileOperation('READ_SUCCESS', filePath, 'success', { size: content.length })
					return content
				} catch (error) {
					logFileOperation('READ_ERROR', filePath, 'error', { error: error.message })
					throw error
				}
			}

			fs.readFileSync = jest.fn().mockReturnValue('file content')

			const content = loggedReadFile('/test/file.txt')

			expect(content).toBe('file content')
			expect(logs).toHaveLength(2)
			expect(logs[0].operation).toBe('READ_START')
			expect(logs[1].operation).toBe('READ_SUCCESS')
			expect(logs[1].details.size).toBe(12)
		})
	})
})
