// Unit test setup for Speco-Tasker
// SCOPE: 单元测试环境配置，测试独立的函数和模块

// Setup unit test environment
beforeAll(() => {
	// Create unit test utilities
	global.unitUtils = {
		// Create mock objects
		createMock: (implementation = {}) => {
			return {
				...jest.fn(),
				...implementation,
			};
		},

		// Create spy objects
		createSpy: (object, method) => {
			return jest.spyOn(object, method);
		},

		// Mock modules
		mockModule: (modulePath, mockImplementation = {}) => {
			jest.mock(modulePath, () => mockImplementation, { virtual: true });
		},

		// Generate test data
		generateTestData: (type, overrides = {}) => {
			const baseData = {
				pathConfig: {
					id: "test-path-1",
					name: "Test Path",
					path: "/test/path",
					enabled: true,
					...overrides,
				},
				brandInfo: {
					id: "test-brand-1",
					name: "Test Brand",
					description: "Test brand description",
					version: "1.0.0",
					...overrides,
				},
				cleanupRule: {
					id: "test-rule-1",
					name: "Test Rule",
					pattern: "**/*.test",
					enabled: true,
					...overrides,
				},
			};

			return baseData[type] || {};
		},

		// Test assertion helpers
		assertValidEntity: (entity, requiredFields) => {
			requiredFields.forEach((field) => {
				expect(entity).toHaveProperty(field);
				expect(entity[field]).toBeDefined();
			});
		},

		// Performance testing helpers
		measureExecutionTime: async (fn, ...args) => {
			const start = process.hrtime.bigint();
			const result = await fn(...args);
			const end = process.hrtime.bigint();
			const executionTime = Number(end - start) / 1_000_000; // Convert to milliseconds

			return { result, executionTime };
		},
	};
});

afterAll(() => {
	// Cleanup unit test resources
	delete global.unitUtils;
});
