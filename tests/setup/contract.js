// Contract test setup for Speco-Tasker
// SCOPE: API合约测试环境配置，验证接口行为契约

import path from "node:path";
import supertest from "supertest";

// Setup contract test environment
beforeAll(() => {
	// Load contract test utilities
	global.contractUtils = {
		// Create API test client
		createApiClient: async () => {
			const appModule = await import(path.join(__dirname, "../../src/app.js"));
			const app = appModule.default;
			return supertest(app);
		},

		// Load API contract specifications
		loadContract: async (contractName) => {
			const contractPath = path.join(
				__dirname,
				"../../specs/002-feature-description-ai-taskmaster-speco/contracts",
				contractName,
			);
			const contractModule = await import(contractPath);
			return contractModule.default || contractModule;
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
