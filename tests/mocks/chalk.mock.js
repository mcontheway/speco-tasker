// Mock for chalk ESM package
const chalkMock = {
	blue: jest.fn((text) => text),
	green: jest.fn((text) => text),
	red: jest.fn((text) => text),
	yellow: jest.fn((text) => text),
	cyan: jest.fn((text) => text),
	magenta: jest.fn((text) => text),
	white: jest.fn((text) => text),
	gray: jest.fn((text) => text),
	bold: jest.fn((text) => text),
};

// Export as both default and named exports
module.exports = chalkMock;
module.exports.default = chalkMock;
