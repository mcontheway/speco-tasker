// Enhanced mock for boxen ESM package
const boxenMock = jest.fn((text, options) => {
	// Simulate boxen behavior with basic formatting
	const borderStyle = options?.borderStyle || 'single';
	const padding = options?.padding || 1;
	const margin = options?.margin || 0;
	const title = options?.title ? ` ${options.title} ` : '';

	let result = text;
	if (title) result = title + '\n' + result;

	// Add padding
	const lines = result.split('\n');
	const paddedLines = lines.map(line => ' '.repeat(padding) + line + ' '.repeat(padding));

	// Add borders
	const width = Math.max(...paddedLines.map(line => line.length)) + 2;
	const topBorder = '─'.repeat(width);
	const bottomBorder = '─'.repeat(width);

	result = `┌${topBorder}┐\n`;
	paddedLines.forEach(line => {
		result += `│${line.padEnd(width)}│\n`;
	});
	result += `└${bottomBorder}┘`;

	// Add margin
	const marginStr = '\n'.repeat(margin);
	result = marginStr + result + marginStr;

	return result;
});

// Export as both default and named exports for ESM compatibility
module.exports = boxenMock;
module.exports.default = boxenMock;
