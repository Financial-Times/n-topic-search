/*
This is all the config that is shared amongst an n-ui build as well as an app
build.

If something is required for both, please add it here.
*/


module.exports = {
	// Abort the compilation on first error
	bail: true,

	// Generate source maps
	devtool: 'source-map',
	entry: {
		'./public/main.js': './demos/src/demo.js'
	},
	resolve: {

		// In which folders the resolver look for modules relative paths are
		// looked up in every parent folder (like node_modules) absolute
		// paths are looked up directly the order is respected
		modules: [
			'node_modules',
		],

		// These JSON files are read in directories
		descriptionFiles: ['package.json'],

		// These fields in the description files are looked up when trying to resolve the package directory
		mainFields: ['main', 'browser'],

		// These files are tried when trying to resolve a directory
		mainFiles: [
			'index',
			'main'
		],

		// These fields in the description files offer aliasing in this package
		// The content of these fields is an object where requests to a key are mapped to the corresponding value
		aliasFields: ['browser'],
	},

	output: {
		filename: '[name]',
		devtoolModuleFilenameTemplate: 'n-topic-search//[resource-path]?[loaders]'
	}

};
