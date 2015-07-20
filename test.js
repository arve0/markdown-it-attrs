'use strict';
var assert = require('assert');
var markdownItAttrs = require('./');

it('should ', function () {
	assert.strictEqual(markdownItAttrs('unicorns'), 'unicorns & rainbows');
});
