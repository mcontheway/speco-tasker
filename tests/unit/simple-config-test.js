/**
 * Simple test to verify config-manager module works
 */

import { getLogLevel } from "../../scripts/modules/config-manager.js";

describe("Config Manager Basic Test", () => {
	test("should be able to import and use getLogLevel", () => {
		const logLevel = getLogLevel("/tmp");
		expect(typeof logLevel).toBe("string");
		expect(logLevel).toBe("info"); // Default value
	});
});
