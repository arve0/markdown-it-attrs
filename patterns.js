'use strict';
/**
 * If a pattern matches the token stream,
 * then run transform.
 */

const utils = require('./utils.js');

module.exports = [
  {
    /**
     * > quote
     * {.cls}
     */
    name: 'blockquote',
    type: 'block',
    tests: [
      {
        shift: 2,
        type: 'blockquote_close'
      }, {
        shift: 0,
        type: 'inline',
        children: [
          isNonEmptyArray,
          (arr) => {
            let j = arr.length - 2;
            return arr[j] && arr[j].type === 'softbreak';
          },
          (arr) => utils.hasCurlyInStart(arr[arr.length - 1].content)
        ]
      }
    ],
    transform: (tokens, i) => {
      let token = tokens[i];
      let j = token.children.length - 1;
      let attrsText = token.children[j].content;
      let start = attrsText.lastIndexOf('{') + 1;
      let end = attrsText.length - 1;
      let attrs = utils.getAttrs(attrsText, start, end);
      let blockquoteOpen = utils.matchingOpeningToken(tokens, i + 2);
      utils.addAttrs(attrs, blockquoteOpen);
      token.children = token.children.slice(0, -2);
    }
  }, {
    /**
     * ```python {.cls}
     * for i in range(10):
     *     print(i)
     * ```
     */
    name: 'fenced code blocks',
    type: 'block',
    tests: [
      {
        shift: 0,
        block: true,
        info: utils.hasCurlyInEnd
      }
    ],
    transform: (tokens, i) => {
      let token = tokens[i];
      let start = token.info.lastIndexOf('{') + 1;
      let attrs = utils.getAttrs(token.info, start, token.info.length - 1);
      utils.addAttrs(attrs, token);
      token.info = utils.removeCurly(token.info);
    }
  }, {
    /**
     * *emphasis*{.with attrs=1}
     */
    name: 'inline attributes',
    type: 'inline',
    tests: [
      {
        shift: -1,
        nesting: -1  // closing inline tag before text with {.class}
      }, {
        shift: 0,
        type: 'text',
        content: utils.hasCurlyInStart
      }
    ],
    transform: (tokens, i) => {
      let token = tokens[i];
      let endChar = token.content.indexOf('}');
      // which token to add attributes to
      var attrToken = utils.matchingOpeningToken(tokens, i - 1);
      if (!attrToken) { return; }
      var inlineAttrs = utils.getAttrs(token.content, 1, endChar);
      if (inlineAttrs.length !== 0) {
        // remove {}
        token.content = token.content.slice(endChar + 1);
        // add attributes
        utils.addAttrs(inlineAttrs, attrToken);
      }
    }
  }, {
    /**
     * bla `click()`{.c}
     */
    name: 'code inline',
    type: 'inline',
    tests: [
      {
        shift: -1,
        type: 'code_inline'
      }, {
        shift: 0,
        type: 'text',
        content: utils.hasCurlyInStart
      }
    ],
    transform: (tokens, i) => {
      let token = tokens[i];
      let endChar = token.content.indexOf('}');
      var attrToken = tokens[i - 1];
      var inlineAttrs = utils.getAttrs(token.content, 1, endChar);
      if (inlineAttrs.length !== 0) {
        // remove {}
        token.content = token.content.slice(endChar + 1);
        // add attributes
        utils.addAttrs(inlineAttrs, attrToken);
      }
    }
  }
];

function isNonEmptyArray(arr) {
  return arr && arr.length !== 0;
}
