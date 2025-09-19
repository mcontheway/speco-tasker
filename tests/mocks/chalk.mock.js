// Enhanced mock for chalk ESM package
const createColorFunction = (colorName) => jest.fn((text) => text);

const chalkMock = {
	// Basic colors
	black: createColorFunction('black'),
	red: createColorFunction('red'),
	green: createColorFunction('green'),
	yellow: createColorFunction('yellow'),
	blue: createColorFunction('blue'),
	magenta: createColorFunction('magenta'),
	cyan: createColorFunction('cyan'),
	white: createColorFunction('white'),
	gray: createColorFunction('gray'),
	grey: createColorFunction('grey'),

	// Bright colors
	blackBright: createColorFunction('blackBright'),
	redBright: createColorFunction('redBright'),
	greenBright: createColorFunction('greenBright'),
	yellowBright: createColorFunction('yellowBright'),
	blueBright: createColorFunction('blueBright'),
	magentaBright: createColorFunction('magentaBright'),
	cyanBright: createColorFunction('cyanBright'),
	whiteBright: createColorFunction('whiteBright'),

	// Background colors
	bgBlack: createColorFunction('bgBlack'),
	bgRed: createColorFunction('bgRed'),
	bgGreen: createColorFunction('bgGreen'),
	bgYellow: createColorFunction('bgYellow'),
	bgBlue: createColorFunction('bgBlue'),
	bgMagenta: createColorFunction('bgMagenta'),
	bgCyan: createColorFunction('bgCyan'),
	bgWhite: createColorFunction('bgWhite'),

	// Text styles
	reset: createColorFunction('reset'),
	bold: createColorFunction('bold'),
	dim: createColorFunction('dim'),
	italic: createColorFunction('italic'),
	underline: createColorFunction('underline'),
	inverse: createColorFunction('inverse'),
	hidden: createColorFunction('hidden'),
	strikethrough: createColorFunction('strikethrough'),

	// RGB and hex colors
	rgb: jest.fn((r, g, b) => createColorFunction('rgb')),
	hex: jest.fn((hex) => createColorFunction('hex')),
	hsl: jest.fn((h, s, l) => createColorFunction('hsl')),
	hsv: jest.fn((h, s, v) => createColorFunction('hsv')),
	hwb: jest.fn((h, w, b) => createColorFunction('hwb')),
	ansi: jest.fn((ansi) => createColorFunction('ansi')),
	ansi256: jest.fn((ansi) => createColorFunction('ansi256')),

	// Color levels
	level: 3,
	hasColor: true,
	supportsColor: true,
};

// Export as both default and named exports for ESM compatibility
module.exports = chalkMock;
module.exports.default = chalkMock;
