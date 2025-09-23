// Enhanced mock for boxen ESM package
const boxenMock = (text, options) => {
	// Simulate boxen behavior with basic formatting
	const borderStyle = options?.borderStyle || "single";
	const padding = options?.padding || 1;
	const margin = options?.margin || 0;
	const title = options?.title ? ` ${options.title} ` : "";

	let result = text;
	if (title) result = `${title}\n${result}`;

	// Add padding
	const lines = result.split("\n");
	const paddedLines = lines.map(
		(line) => " ".repeat(padding) + line + " ".repeat(padding),
	);

	// Add borders
	const width = Math.max(...paddedLines.map((line) => line.length)) + 2;
	const topBorder = "─".repeat(width);
	const bottomBorder = "─".repeat(width);

	result = `┌${topBorder}┐\n`;
	for (const line of paddedLines) {
		result += `│${line.padEnd(width)}│\n`;
	}
	result += `└${bottomBorder}┘`;

	// Add margin
	const marginStr = "\n".repeat(margin);
	result = marginStr + result + marginStr;

	return result;
};

// Export as both default and named exports for ESM compatibility
export default boxenMock;
export { boxenMock };
