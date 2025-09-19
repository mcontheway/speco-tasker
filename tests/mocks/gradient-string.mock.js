// Mock for gradient-string ESM package
const gradientMock = jest.fn((colors, text) => text || colors);
const rainbow = jest.fn((text) => text);
const pastel = jest.fn((text) => text);
const atlas = jest.fn((text) => text);
const retro = jest.fn((text) => text);
const summer = jest.fn((text) => text);
const winter = jest.fn((text) => text);
const spring = jest.fn((text) => text);
const autumn = jest.fn((text) => text);
const neon = jest.fn((text) => text);
const bright = jest.fn((text) => text);

// Main gradient function
const gradient = {
	...gradientMock,
	rainbow,
	pastel,
	atlas,
	retro,
	summer,
	winter,
	spring,
	autumn,
	neon,
	bright,
};

// Export as both default and named exports for ESM compatibility
module.exports = gradient;
module.exports.default = gradient;
