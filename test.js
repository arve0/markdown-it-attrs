/* eslint-env mocha, es6 */
'use strict';
const assert = require('assert');
const Md = require('markdown-it');
const implicitFigures = require('markdown-it-implicit-figures');
const attrs = require('./');
const utils = require('./utils.js');


describeTestsWithOptions({
  leftDelimiter: '{',
  rightDelimiter: '}'
}, '');

describeTestsWithOptions({
  leftDelimiter: '[',
  rightDelimiter: ']'
}, ' with [ ] delimiters');

describeTestsWithOptions({
  leftDelimiter: '[[',
  rightDelimiter: ']]'
}, ' with [[ ]] delimiters');

describe('markdown-it-attrs', () => {
  let md, src, expected;

  it('should not throw when getting only allowedAttributes option', () => {
    md = Md().use(attrs, { allowedAttributes: [/^(class|attr)$/] });
    src = 'text {.someclass #someid attr=allowed}';
    expected = '<p class="someclass" attr="allowed">text</p>\n';
    assert.equal(md.render(src), expected);
  });
});

function describeTestsWithOptions(options, postText) {
  describe('markdown-it-attrs.utils' + postText, () => {
    it(replaceDelimiters('should parse {.class ..css-module #id key=val .class.with.dot}', options), () => {
      let src = '{.red ..mod #head key=val .class.with.dot}';
      let expected = [['class', 'red'], ['css-module', 'mod'], ['id', 'head'], ['key', 'val'], ['class', 'class.with.dot']];
      let res = utils.getAttrs(replaceDelimiters(src, options), 0, options);
      assert.deepEqual(res, expected);
    });

    it(replaceDelimiters('should parse attributes with = {attr=/id=1}', options), () => {
      let src = '{link=/some/page/in/app/id=1}';
      let expected = [['link', '/some/page/in/app/id=1']];
      let res = utils.getAttrs(replaceDelimiters(src, options), 0, options);
      assert.deepEqual(res, expected);
    });
  });

  describe('markdown-it-attrs' + postText, () => {
    let md, src, expected;
    beforeEach(() => {
      md = Md().use(attrs, options);
    });

    it(replaceDelimiters('should add attributes when {} in end of last inline', options), () => {
      src = 'some text {with=attrs}';
      expected = '<p with="attrs">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should not add attributes when it has too many delimiters {{}}', options), () => {
      src = 'some text {{with=attrs}}';
      expected = '<p>some text {{with=attrs}}</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), replaceDelimiters(expected, options));
    });

    it(replaceDelimiters('should add attributes when {} in last line', options), () => {
      src = 'some text\n{with=attrs}';
      expected = '<p with="attrs">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add classes with {.class} dot notation', options), () => {
      src = 'some text {.green}';
      expected = '<p class="green">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add css-modules with {..css-module} double dot notation', options), () => {
      src = 'some text {..green}';
      expected = '<p css-module="green">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add identifiers with {#id} hashtag notation', options), () => {
      src = 'some text {#section2}';
      expected = '<p id="section2">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support classes, css-modules, identifiers and attributes in same {}', options), () => {
      src = 'some text {attr=lorem .class ..css-module #id}';
      expected = '<p attr="lorem" class="class" css-module="css-module" id="id">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support attributes inside " {attr="lorem ipsum"}', options), () => {
      src = 'some text {attr="lorem ipsum"}';
      expected = '<p attr="lorem ipsum">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add classes in same class attribute {.c1 .c2} -> class="c1 c2"', options), () => {
      src = 'some text {.c1 .c2}';
      expected = '<p class="c1 c2">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add css-modules in same css-modules attribute {..c1 ..c2} -> css-module="c1 c2"', options), () => {
      src = 'some text {..c1 ..c2}';
      expected = '<p css-module="c1 c2">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add nested css-modules {..c1.c2} -> css-module="c1.c2"', options), () => {
      src = 'some text {..c1.c2}';
      expected = '<p css-module="c1.c2">some text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support empty inline tokens', options), () => {
      src = ' 1 | 2 \n --|-- \n a | ';
      md.render(replaceDelimiters(src, options));  // should not crash / throw error
    });

    it(replaceDelimiters('should add classes to inline elements', options), () => {
      src = 'paragraph **bold**{.red} asdf';
      expected = '<p>paragraph <strong class="red">bold</strong> asdf</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should not add classes to inline elements with too many {{}}', options), () => {
      src = 'paragraph **bold**{{.red}} asdf';
      expected = '<p>paragraph <strong>bold</strong>{{.red}} asdf</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), replaceDelimiters(expected, options));
    });

    it(replaceDelimiters('should only remove last {}', options), () => {
      src = '{{.red}';
      expected = replaceDelimiters('<p class="red">{</p>\n', options);
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add classes for list items', options), () => {
      src = '- item 1{.red}\n- item 2';
      expected = '<ul>\n';
      expected += '<li class="red">item 1</li>\n';
      expected += '<li>item 2</li>\n';
      expected += '</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add classes in nested lists', options), () => {
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
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should work with nested inline elements', options), () => {
      src = '- **bold *italics*{.blue}**{.green}';
      expected = '<ul>\n';
      expected += '<li><strong class="green">bold <em class="blue">italics</em></strong></li>\n';
      expected += '</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add class to inline code block', options), () => {
      src = 'bla `click()`{.c}';
      expected = '<p>bla <code class="c">click()</code></p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should not trim unrelated white space', options), () => {
      src = '- **bold** text {.red}';
      expected = '<ul>\n';
      expected += '<li class="red"><strong>bold</strong> text</li>\n';
      expected += '</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should not create empty attributes', options), () => {
      src = 'text { .red }';
      expected = '<p class="red">text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add attributes to ul when below last bullet point', options), () => {
      src = '- item1\n- item2\n{.red}';
      expected = '<ul class="red">\n<li>item1</li>\n<li>item2</li>\n</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add classes for both last list item and ul', options), () => {
      src = '- item{.red}\n{.blue}';
      expected = '<ul class="blue">\n';
      expected += '<li class="red">item</li>\n';
      expected += '</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should add class ul after a "softbreak"', options), () => {
      src = '- item\n{.blue}';
      expected = '<ul class="blue">\n';
      expected += '<li>item</li>\n';
      expected += '</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should ignore non-text "attr-like" text after a "softbreak"', options), () => {
      src = '- item\n*{.blue}*';
      expected = '<ul>\n';
      expected += '<li>item\n<em>{.blue}</em></li>\n';
      expected += '</ul>\n';
      assert.equal(md.render(src), expected);
    });

    it(replaceDelimiters('should work with ordered lists', options), () => {
      src = '1. item\n{.blue}';
      expected = '<ol class="blue">\n';
      expected += '<li>item</li>\n';
      expected += '</ol>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should work with typography enabled', options), () => {
      src = 'text {key="val with spaces"}';
      expected = '<p key="val with spaces">text</p>\n';
      let res = md.set({ typographer: true }).render(replaceDelimiters(src, options));
      assert.equal(res, expected);
    });

    it(replaceDelimiters('should support code blocks', options), () => {
      src = '```{.c a=1 #ii}\nfor i in range(10):\n```';
      expected = '<pre><code class="c" a="1" id="ii">for i in range(10):\n</code></pre>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support code blocks with language defined', options), () => {
      src = '```python {.c a=1 #ii}\nfor i in range(10):\n```';
      expected = '<pre><code class="c language-python" a="1" id="ii">for i in range(10):\n</code></pre>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support containers with default delimiter', options), () => {
      src = ':::info {.c a=1 #ii}\nWell, hello!\n:::';
      expected = '<div class="info c" a="1" id="ii">Well, hello!</div>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });
    
    it(replaceDelimiters('should support blockquotes', options), () => {
      src = '> quote\n{.c}';
      expected = '<blockquote class="c">\n<p>quote</p>\n</blockquote>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support tables', options), () => {
      src = '| h1 | h2 |\n';
      src += '| -- | -- |\n';
      src += '| c1 | c1 |\n';
      src += '\n';
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
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support nested lists', options), () => {
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
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support images', options), () => {
      src =  '![alt](img.png){.a}';
      expected = '<p><img src="img.png" alt="alt" class="a"></p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should work with plugin implicit-figures', options), () => {
      md = md.use(implicitFigures);
      src =  '![alt](img.png){.a}';
      expected = '<figure><img src="img.png" alt="alt" class="a"></figure>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should not apply inside `code{.red}`', options), () => {
      src =  'paragraph `code{.red}`';
      expected = '<p>paragraph <code>code{.red}</code></p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), replaceDelimiters(expected, options));
    });

    it(replaceDelimiters('should not apply inside item lists with trailing `code{.red}`', options), () => {
      src = '- item with trailing `code = {.red}`';
      expected = '<ul>\n<li>item with trailing <code>code = {.red}</code></li>\n</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), replaceDelimiters(expected, options));
    });

    it(replaceDelimiters('should not apply inside item lists with trailing non-text, eg *{.red}*', options), () => {
      src = '- item with trailing *{.red}*';
      expected = '<ul>\n<li>item with trailing <em>{.red}</em></li>\n</ul>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), replaceDelimiters(expected, options));
    });

    it(replaceDelimiters('should work with multiple inline code blocks in same paragraph', options), () => {
      src = 'bla `click()`{.c} blah `release()`{.cpp}';
      expected = '<p>bla <code class="c">click()</code> blah <code class="cpp">release()</code></p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should support {} curlies with length == 3', options), () => {
      src = 'text {1}';
      expected = '<p 1="">text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it(replaceDelimiters('should do nothing with empty classname {.}', options), () => {
      src = 'text {.}';
      expected = '<p>text {.}</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), replaceDelimiters(expected, options));
    });

    it(replaceDelimiters('should do nothing with empty id {#}', options), () => {
      src = 'text {#}';
      expected = '<p>text {#}</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), replaceDelimiters(expected, options));
    });

    it(replaceDelimiters('should support horizontal rules ---{#id}', options), () => {
      src = '---{#id}';
      expected = '<hr id="id">\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it('should restrict attributes by allowedAttributes (string)', () => {
      md = Md().use(attrs, Object.assign({ allowedAttributes: ['id', 'class'] }, options));
      src = 'text {.someclass #someid attr=notAllowed}';
      expected = '<p class="someclass" id="someid">text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });

    it('should restrict attributes by allowedAttributes (regex)', () => {
      md = Md().use(attrs, Object.assign({ allowedAttributes: [/^(class|attr)$/] }, options));
      src = 'text {.someclass #someid attr=allowed}';
      expected = '<p class="someclass" attr="allowed">text</p>\n';
      assert.equal(md.render(replaceDelimiters(src, options)), expected);
    });
  });
}

function replaceDelimiters(text, options) {
  return text.replace(/{/g, options.leftDelimiter).replace(/}/g, options.rightDelimiter);
}
