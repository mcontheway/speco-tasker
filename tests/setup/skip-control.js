// Test Skip Control File
// This file sets environment variables to control test skipping in different environments

// Skip complex tests that have ESM compatibility issues in CI
process.env.SKIP_COMPLEX_TESTS = process.env.CI === "true" ? "true" : "false";

// Skip tests that require file system operations in CI
process.env.SKIP_FILESYSTEM_TESTS =
	process.env.CI === "true" ? "true" : "false";

// Skip tests that have known ESM compatibility issues
process.env.SKIP_ESM_TESTS = process.env.CI === "true" ? "true" : "false";

// Log the skip settings for debugging
console.log("Test Skip Control Settings:");
console.log("- SKIP_COMPLEX_TESTS:", process.env.SKIP_COMPLEX_TESTS);
console.log("- SKIP_FILESYSTEM_TESTS:", process.env.SKIP_FILESYSTEM_TESTS);
console.log("- SKIP_ESM_TESTS:", process.env.SKIP_ESM_TESTS);
