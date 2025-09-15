/**
 * Standalone test to verify Jest configuration
 * Tests basic functionality without external dependencies
 */

describe('Jest Configuration Test', () => {
  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect([1, 2, 3]).toHaveLength(3)
  })

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success')
    expect(result).toBe('success')
  })

  it('should handle mock functions', () => {
    const mockFn = jest.fn(() => 'mocked')
    expect(mockFn()).toBe('mocked')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  describe('Nested describe blocks', () => {
    it('should work in nested blocks', () => {
      expect(true).toBeTruthy()
    })
  })
})
