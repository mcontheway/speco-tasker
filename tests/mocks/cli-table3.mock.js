// Mock for cli-table3 ESM package
const TableMock = jest.fn((options) => {
	const table = {
		push: jest.fn((row) => table),
		toString: jest.fn(() => "[Table Mock]"),
		options: options || {},
		rows: [],
	};

	// Override push to store rows for testing
	table.push.mockImplementation((row) => {
		table.rows.push(row);
		return table;
	});

	return table;
});

// Export as both default and named exports for ESM compatibility
export default TableMock;
export { TableMock };
