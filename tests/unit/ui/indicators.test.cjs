/**
 * Unit tests for UI indicators
 */

const {
	getPriorityIndicators,
	getPriorityIndicator,
	getPriorityColors,
	getMcpPriorityIndicators,
	getCliPriorityIndicators,
	getStatusBarPriorityIndicators,
	getComplexityIndicator,
	getComplexityColors,
	getCliComplexityIndicators,
	getStatusBarComplexityIndicators,
} = require("../../../src/ui/indicators.js");

describe("UI Indicators", () => {
	describe("Priority Indicators", () => {
		describe("getPriorityIndicators", () => {
			test("should return CLI indicators by default", () => {
				const indicators = getPriorityIndicators();

				expect(indicators).toBeDefined();
				expect(typeof indicators).toBe("object");
				expect(indicators.high).toBeDefined();
				expect(indicators.medium).toBeDefined();
				expect(indicators.low).toBeDefined();
			});

			test("should return MCP indicators when isMcp is true", () => {
				const cliIndicators = getPriorityIndicators(false);
				const mcpIndicators = getPriorityIndicators(true);

				expect(cliIndicators).not.toEqual(mcpIndicators);
				// MCP indicators should be emoji strings
				expect(mcpIndicators.high).toMatch(/🔴|●/);
			});
		});

		describe("getPriorityIndicator", () => {
			test("should return correct indicator for valid priority", () => {
				const indicator = getPriorityIndicator("high");

				expect(typeof indicator).toBe("string");
				expect(indicator.length).toBeGreaterThan(0);
			});

			test("should return medium indicator for invalid priority", () => {
				const indicator = getPriorityIndicator("invalid");

				expect(typeof indicator).toBe("string");
				expect(indicator.length).toBeGreaterThan(0);
			});

			test("should support MCP context", () => {
				const cliIndicator = getPriorityIndicator("high", false);
				const mcpIndicator = getPriorityIndicator("high", true);

				expect(cliIndicator).not.toBe(mcpIndicator);
			});
		});

		describe("getPriorityColors", () => {
			test("should return color functions for all priorities", () => {
				const colors = getPriorityColors();

				expect(colors).toHaveProperty("high");
				expect(colors).toHaveProperty("medium");
				expect(colors).toHaveProperty("low");

				// Should be chalk color functions
				expect(typeof colors.high).toBe("function");
				expect(typeof colors.medium).toBe("function");
				expect(typeof colors.low).toBe("function");
			});
		});

		describe("getMcpPriorityIndicators", () => {
			test("should return emoji indicators", () => {
				const indicators = getMcpPriorityIndicators();

				expect(indicators.high).toMatch(/🔴|●/);
				expect(indicators.medium).toMatch(/🟠|●/);
				expect(indicators.low).toMatch(/🟢|●/);
			});
		});

		describe("getCliPriorityIndicators", () => {
			test("should return dot-based indicators with colors", () => {
				const indicators = getCliPriorityIndicators();

				expect(typeof indicators.high).toBe("string");
				expect(typeof indicators.medium).toBe("string");
				expect(typeof indicators.low).toBe("string");

				// Should contain colored dots
				expect(indicators.high).toMatch(/●/);
				expect(indicators.medium).toMatch(/●/);
				expect(indicators.low).toMatch(/●/);
			});
		});

		describe("getStatusBarPriorityIndicators", () => {
			test("should return single character indicators", () => {
				const indicators = getStatusBarPriorityIndicators();

				expect(typeof indicators.high).toBe("string");
				expect(typeof indicators.medium).toBe("string");
				expect(typeof indicators.low).toBe("string");

				// Should be single characters
				expect(indicators.high.length).toBeGreaterThan(0);
				expect(indicators.medium.length).toBeGreaterThan(0);
				expect(indicators.low.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Complexity Indicators", () => {
		describe("getComplexityIndicator", () => {
			test("should return indicator for low complexity scores", () => {
				const indicator = getComplexityIndicator(2);

				expect(typeof indicator).toBe("string");
				expect(indicator.length).toBeGreaterThan(0);
			});

			test("should return indicator for medium complexity scores", () => {
				const indicator = getComplexityIndicator(5);

				expect(typeof indicator).toBe("string");
				expect(indicator.length).toBeGreaterThan(0);
			});

			test("should return indicator for high complexity scores", () => {
				const indicator = getComplexityIndicator(8);

				expect(typeof indicator).toBe("string");
				expect(indicator.length).toBeGreaterThan(0);
			});

			test("should support status bar mode", () => {
				const cliIndicator = getComplexityIndicator(7, false);
				const statusBarIndicator = getComplexityIndicator(7, true);

				expect(cliIndicator).not.toBe(statusBarIndicator);
			});
		});

		describe("getComplexityColors", () => {
			test("should return color functions for all complexity levels", () => {
				const colors = getComplexityColors();

				expect(colors).toHaveProperty("high");
				expect(colors).toHaveProperty("medium");
				expect(colors).toHaveProperty("low");

				// Should be chalk color functions
				expect(typeof colors.high).toBe("function");
				expect(typeof colors.medium).toBe("function");
				expect(typeof colors.low).toBe("function");
			});
		});

		describe("getCliComplexityIndicators", () => {
			test("should return dot-based indicators for complexity", () => {
				const indicators = getCliComplexityIndicators();

				expect(typeof indicators.high).toBe("string");
				expect(typeof indicators.medium).toBe("string");
				expect(typeof indicators.low).toBe("string");

				// Should contain dots
				expect(indicators.high).toMatch(/●/);
				expect(indicators.medium).toMatch(/●/);
				expect(indicators.low).toMatch(/●/);
			});
		});

		describe("getStatusBarComplexityIndicators", () => {
			test("should return single character complexity indicators", () => {
				const indicators = getStatusBarComplexityIndicators();

				expect(typeof indicators.high).toBe("string");
				expect(typeof indicators.medium).toBe("string");
				expect(typeof indicators.low).toBe("string");
			});
		});
	});
});
