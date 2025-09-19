// Simple test to verify Jest is working
describe('Simple Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle process.cwd()', () => {
    const cwd = process.cwd();
    expect(typeof cwd).toBe('string');
    expect(cwd.length).toBeGreaterThan(0);
  });
});
