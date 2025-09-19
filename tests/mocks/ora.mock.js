// Mock for ora ESM package
const oraMock = jest.fn((options) => {
	const spinner = {
		start: jest.fn(() => spinner),
		stop: jest.fn(() => spinner),
		succeed: jest.fn(() => spinner),
		fail: jest.fn(() => spinner),
		warn: jest.fn(() => spinner),
		info: jest.fn(() => spinner),
		stopAndPersist: jest.fn(() => spinner),
		clear: jest.fn(() => spinner),
		render: jest.fn(() => spinner),
		frame: jest.fn(() => spinner),
		text: options?.text || '',
		color: options?.color || 'cyan',
		spinner: options?.spinner || 'dots',
		indent: options?.indent || 0,
	};

	return spinner;
});

// Export as both default and named exports for ESM compatibility
module.exports = oraMock;
module.exports.default = oraMock;
