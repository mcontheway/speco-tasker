/**
 * simple_test.cjs
 * 简单的测试文件用于验证Jest配置
 */

describe("Simple Test", () => {
	it("should pass basic assertion", () => {
		expect(1 + 1).toBe(2);
	});

	it("should validate task data structure", () => {
		const task = {
			id: 1,
			title: "Test Task",
			status: "pending",
		};

		expect(task).toHaveProperty("id");
		expect(task).toHaveProperty("title");
		expect(task).toHaveProperty("status");
		expect(task.id).toBe(1);
		expect(task.title).toBe("Test Task");
		expect(task.status).toBe("pending");
	});
});
