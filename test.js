'use strict';
var assert = require('assert');
var Md = require('markdown-it');
var markdownItAttrs = require('./');

describe('markdown-it-attrs', function() {
  var md;
  beforeEach(function(){
    md = Md().use(markdownItAttrs);
  });

  it('should add attributes when {} in end of last inline', function () {
    var src = 'some text {with=attrs}';
    var expected = '<p with="attrs">some text</p>\n';
    var res = md.render(src);
    assert.equal(expected, res);
  });

  it('should add attributes when {} in last line', function () {
    var src = 'some text\n{with=attrs}';
    var expected = '<p with="attrs">some text\n</p>\n';
    var res = md.render(src);
    assert.equal(expected, res);
  });

  it('should add classes with {.class} dot notation', function () {
    var src = 'some text {.green}';
    var expected = '<p class="green">some text</p>\n';
    var res = md.render(src);
    assert.equal(expected, res);
  });

  it('should add identifiers with {#id} hashtag notation', function () {
    var src = 'some text {#section2}';
    var expected = '<p id="section2">some text</p>\n';
    var res = md.render(src);
    assert.equal(expected, res);
  });

  it('should support classes, identifiers and attributes in same {}', function () {
    var src = 'some text {attr=lorem .class #id}';
    var expected = '<p attr="lorem" class="class" id="id">some text</p>\n';
    var res = md.render(src);
    assert.equal(expected, res);
  });

});
