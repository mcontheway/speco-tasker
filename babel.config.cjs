module.exports = {
	presets: [
		[
			"@babel/preset-env",
			{
				targets: {
					node: "current",
				},
				modules: "auto", // Let Jest decide module format based on ESM settings
				useBuiltIns: false,
			},
		],
	],
	plugins: [
		// Support for import.meta.url
		["@babel/plugin-syntax-import-meta"],
		// Transform import.meta.url to a string
		[
			"babel-plugin-transform-import-meta",
			{
				module: "ES6",
			},
		],
		// Support for dynamic imports
		["@babel/plugin-syntax-dynamic-import"],
	],
};
