/* eslint-env mocha, es6 */
'use strict';
const assert = require('assert');
const Md = require('markdown-it');
const implicitFigures = require('markdown-it-implicit-figures');
const attrs = require('./');
const utils = require('./utils.js');

describe('markdown-it-attrs.utils', () => {
  it('should parse {.class ..css-module #id key=val}', () => {
    let src = '{.red ..mod #head key=val}';
    let expected = [['class', 'red'], ['css-module', 'mod'], ['id', 'head'], ['key', 'val']];
    let res = utils.getAttrs(src, 0);
    assert.deepEqual(res, expected);
  });
});

describe('markdown-it-attrs', () => {
  let md, src, expected;
  beforeEach(() => {
    md = Md().use(attrs);
  });

  it('should add attributes when {} in end of last inline', () => {
    src = 'some text {with=attrs}';
    expected = '<p with="attrs">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add attributes when {} in last line', () => {
    src = 'some text\n{with=attrs}';
    expected = '<p with="attrs">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add classes with {.class} dot notation', () => {
    src = 'some text {.green}';
    expected = '<p class="green">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add css-modules with {..css-module} double dot notation', () => {
    src = 'some text {..green}';
    expected = '<p css-module="green">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add identifiers with {#id} hashtag notation', () => {
    src = 'some text {#section2}';
    expected = '<p id="section2">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support classes, css-modules, identifiers and attributes in same {}', () => {
    src = 'some text {attr=lorem .class ..css-module #id}';
    expected = '<p attr="lorem" class="class" css-module="css-module" id="id">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support attributes inside " {attr="lorem ipsum"}', () => {
    src = 'some text {attr="lorem ipsum"}';
    expected = '<p attr="lorem ipsum">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add classes in same class attribute {.c1 .c2} -> class="c1 c2"', () => {
    src = 'some text {.c1 .c2}';
    expected = '<p class="c1 c2">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add css-modules in same css-modules attribute {..c1 ..c2} -> css-module="c1 c2"', () => {
    src = 'some text {..c1 ..c2}';
    expected = '<p css-module="c1 c2">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add nested css-modules {..c1.c2} -> css-module="c1.c2"', () => {
    src = 'some text {..c1.c2}';
    expected = '<p css-module="c1.c2">some text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support empty inline tokens', () => {
    src = ' 1 | 2 \n --|-- \n a | ';
    md.render(src);  // should not crash / throw error
  });

  it('should add classes to inline elements', () => {
    src = 'paragraph **bold**{.red} asdf';
    expected = '<p>paragraph <strong class="red">bold</strong> asdf</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should only remove last {}', () => {
    src = '{{.red}';
    expected = '<p class="red">{</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add classes for list items', () => {
    src = '- item 1{.red}\n- item 2';
    expected = '<ul>\n';
    expected += '<li class="red">item 1</li>\n';
    expected += '<li>item 2</li>\n';
    expected += '</ul>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add classes in nested lists', () => {
    src =  '- item 1{.a}\n';
    src += '  - nested item {.b}\n';
    src += '  {.c}\n';
    src += '    1. nested nested item {.d}\n';
    src += '    {.e}\n';
    // Adding class to top ul not supported
    //    src += '{.f}';
    //    expected = '<ul class="f">\n';
    expected = '<ul>\n';
    expected += '<li class="a">item 1\n';
    expected += '<ul class="c">\n';
    expected += '<li class="b">nested item\n';
    expected += '<ol class="e">\n';
    expected += '<li class="d">nested nested item</li>\n';
    expected += '</ol>\n';
    expected += '</li>\n';
    expected += '</ul>\n';
    expected += '</li>\n';
    expected += '</ul>\n';
    assert.equal(md.render(src), expected);
  });

  it('should work with nested inline elements', () => {
    src = '- **bold *italics*{.blue}**{.green}';
    expected = '<ul>\n';
    expected += '<li><strong class="green">bold <em class="blue">italics</em></strong></li>\n';
    expected += '</ul>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add class to inline code block', () => {
    src = 'bla `click()`{.c}';
    expected = '<p>bla <code class="c">click()</code></p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should not trim unrelated white space', () => {
    src = '- **bold** text {.red}';
    expected = '<ul>\n';
    expected += '<li class="red"><strong>bold</strong> text</li>\n';
    expected += '</ul>\n';
    assert.equal(md.render(src), expected);
  });

  it('should not create empty attributes', () => {
    src = 'text { .red }';
    expected = '<p class="red">text</p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add attributes to ul when below last bullet point', () => {
    src = '- item1\n- item2\n{.red}';
    expected = '<ul class="red">\n<li>item1</li>\n<li>item2</li>\n</ul>\n';
    assert.equal(md.render(src), expected);
  });

  it('should add classes for both last list item and ul', () => {
    src = '- item{.red}\n{.blue}';
    expected = '<ul class="blue">\n';
    expected += '<li class="red">item</li>\n';
    expected += '</ul>\n';
    assert.equal(md.render(src), expected);
  });

  it('should work with ordered lists', () => {
    src = '1. item\n{.blue}';
    expected = '<ol class="blue">\n';
    expected += '<li>item</li>\n';
    expected += '</ol>\n';
    assert.equal(md.render(src), expected);
  });

  it('should work with typography enabled', () => {
    src = 'text {key="val with spaces"}';
    expected = '<p key="val with spaces">text</p>\n';
    let res = md.set({ typographer: true }).render(src);
    assert.equal(res, expected);
  });

  it('should support code blocks', () => {
    src = '```{.c a=1 #ii}\nfor i in range(10):\n```';
    expected = '<pre><code class="c" a="1" id="ii">for i in range(10):\n</code></pre>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support code blocks with language defined', () => {
    src = '```python {.c a=1 #ii}\nfor i in range(10):\n```';
    expected = '<pre><code class="c language-python" a="1" id="ii">for i in range(10):\n</code></pre>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support blockquotes', () => {
    src = '> quote\n{.c}';
    expected = '<blockquote class="c">\n<p>quote</p>\n</blockquote>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support tables', () => {
    src = '| h1 | h2 |\n';
    src += '| -- | -- |\n';
    src += '| c1 | c1 |\n';
    src += '{.c}';
    expected = '<table class="c">\n';
    expected += '<thead>\n';
    expected += '<tr>\n';
    expected += '<th>h1</th>\n';
    expected += '<th>h2</th>\n';
    expected += '</tr>\n';
    expected += '</thead>\n';
    expected += '<tbody>\n';
    expected += '<tr>\n';
    expected += '<td>c1</td>\n';
    expected += '<td>c1</td>\n';
    expected += '</tr>\n';
    expected += '</tbody>\n';
    expected += '</table>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support nested lists', () => {
    src =  '- item\n';
    src += '  - nested\n';
    src += '  {.red}\n';
    src += '\n';
    src += '{.blue}\n';
    expected = '<ul class="blue">\n';
    expected += '<li>item\n';
    expected += '<ul class="red">\n';
    expected += '<li>nested</li>\n';
    expected += '</ul>\n';
    expected += '</li>\n';
    expected += '</ul>\n';
    assert.equal(md.render(src), expected);
  });

  it('should support images', () => {
    src =  '![alt](img.png){.a}';
    expected = '<p><img src="img.png" alt="alt" class="a"></p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should work with plugin implicit-figures', () => {
    md = md.use(implicitFigures);
    src =  '![alt](img.png){.a}';
    expected = '<figure><img src="img.png" alt="alt" class="a"></figure>\n';
    assert.equal(md.render(src), expected);
  });

  it('should not apply inside `code{.red}`', () => {
    src =  'paragraph `code{.red}`';
    expected = '<p>paragraph <code>code{.red}</code></p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should work with multiple inline code blocks in same paragraph', () => {
    src = 'bla `click()`{.c} blah `release()`{.cpp}';
    expected = '<p>bla <code class="c">click()</code> blah <code class="cpp">release()</code></p>\n';
    assert.equal(md.render(src), expected);
  });

  it('should not remove {} curlies with length < 4', () => {
    src = 'do not remove the curlies {1}{2}';
    expected = '<p>do not remove the curlies {1}{2}</p>\n';
    assert.equal(md.render(src), expected);
  });
});

