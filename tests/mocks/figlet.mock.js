// Mock for figlet ESM package
const figletMock = {
	textSync: jest.fn((text, options) => `[Figlet: ${text}]`),
	text: jest.fn((text, options, callback) => {
		if (callback) {
			callback(null, `[Figlet: ${text}]`);
		}
		return `[Figlet: ${text}]`;
	}),
	loadFontSync: jest.fn((font) => {}),
	loadFont: jest.fn((font, callback) => {
		if (callback) callback(null);
	}),
	fonts: jest.fn((callback) => {
		if (callback) {
			callback(null, ["Standard", "Small", "Big"]);
		}
		return ["Standard", "Small", "Big"];
	}),
	fontsSync: jest.fn(() => ["Standard", "Small", "Big"]),
};

// Export as both default and named exports for ESM compatibility
export default figletMock;
export { figletMock };
