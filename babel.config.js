export default {
	presets: [
		[
			"@babel/preset-env",
			{
				targets: {
					node: "current",
				},
				modules: "commonjs", // Convert ES modules to CommonJS for Jest
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
