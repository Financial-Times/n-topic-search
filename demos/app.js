'use strict';

const nExpress = require('@financial-times/n-express');
const chalk = require('chalk');
const errorHighlight = chalk.bold.red;
const highlight = chalk.bold.green;
const path = require('path');

const app = module.exports = nExpress({
	name: 'public',
	systemCode: 'n-topic-search-demo',
	withFlags: false,
	withConsent: false,
	withServiceMetrics: false,
	withAnonMiddleware: false,
	demo: true,
	withBackendAuthentication: false,
});

app.use('/', nExpress.static(path.join(process.cwd(), '/demos'), { redirect: false }));
app.use('/public', nExpress.static(path.join(process.cwd(), '/public'), { redirect: false }));

app.get('/search-api/suggestions', (req, res) => {
	res.json(require('./fixtures/suggestions'));
});


function runPa11yTests () {
	const spawn = require('child_process').spawn;
	const pa11y = spawn('pa11y-ci');

	pa11y.stdout.on('data', (data) => {
		console.log(highlight(`${data}`)); //eslint-disable-line
	});

	pa11y.stderr.on('data', (error) => {
		console.log(errorHighlight(`${error}`)); //eslint-disable-line
	});

	pa11y.on('close', (code) => {
		process.exit(code);
	});
}

const listen = app.listen(5005);

if (process.env.PA11Y === 'true') {
	listen.then(runPa11yTests);
}
