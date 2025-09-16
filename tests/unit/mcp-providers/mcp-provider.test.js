/**
 * tests/unit/mcp-providers/mcp-provider.test.js
 * Unit tests for MCP provider
 */

import { jest } from '@jest/globals'

describe('MCPProvider', () => {
	let MCPProvider
	let provider

	beforeAll(async () => {
		// Dynamic import to avoid circular dependency issues
		const module = await import('../../../mcp-server/src/providers/mcp-provider.js')
		MCPProvider = module.MCPProvider
	})

	beforeEach(() => {
		provider = new MCPProvider()
	})

	describe('constructor', () => {
		it('should initialize with correct name', () => {
			expect(provider.name).toBe('mcp')
		})

		it('should initialize with null session', () => {
			expect(provider.session).toBeNull()
		})
	})

	describe('setSession', () => {
		it('should set session when provided', () => {
			const mockSession = {
				clientCapabilities: { sampling: true }
			}

			provider.setSession(mockSession)
			expect(provider.session).toBe(mockSession)
		})

		it('should handle null session gracefully', () => {
			provider.setSession(null)
			expect(provider.session).toBeNull()
		})
	})

	describe('hasValidSession', () => {
		it('should return false when no session', () => {
			provider.session = null
			expect(provider.hasValidSession()).toBe(false)
		})

		it('should return true with valid session', () => {
			provider.session = { clientCapabilities: { sampling: true } }
			expect(provider.hasValidSession()).toBe(true)
		})
	})
})
