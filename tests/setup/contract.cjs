// Contract test setup for Speco-Tasker
// SCOPE: API合约测试环境配置，验证接口行为契约

const supertest = require("supertest");
const path = require("node:path");

// Setup contract test environment
beforeAll(() => {
	// Load contract test utilities
	global.contractUtils = {
		// Create API test client
		createApiClient: () => {
			const app = require(path.join(__dirname, "../../src/app.js"));
			return supertest(app);
		},

		// Load API contract specifications
		loadContract: (contractName) => {
			const contractPath = path.join(
				__dirname,
				"../../specs/002-feature-description-ai-taskmaster-speco/contracts",
				contractName,
			);
			return require(contractPath);
		},

		// Validate response against contract
		validateResponse: (response, contract) => {
			// Basic contract validation
			if (contract.response?.status) {
				expect(response.status).toBe(contract.response.status);
			}

			if (contract.response?.schema) {
				// Add JSON schema validation if needed
				expect(response.body).toBeDefined();
			}

			return true;
		},
	};
});

afterAll(() => {
	// Cleanup contract test resources
	global.contractUtils = undefined;
});
