'use strict';
/**
 * If a pattern matches the token stream,
 * then run transform.
 */

const utils = require('./utils.js');

module.exports = options => ([
  {
    /**
     * ```python {.cls}
     * for i in range(10):
     *     print(i)
     * ```
     */
    name: 'fenced code blocks',
    tests: [
      {
        shift: 0,
        block: true,
        info: utils.hasDelimiter('end', options)
      }
    ],
    transform: (tokens, i) => {
      let token = tokens[i];
      let start = token.info.lastIndexOf(options.leftDelimiter);
      let attrs = utils.getAttrs(token.info, start, null, options);
      utils.addAttrs(attrs, token);
      token.info = utils.removeDelimiter(token.info, options);
    }
  }, {
    /**
     * bla `click()`{.c} ![](img.png){.d}
     *
     * differs from 'inline attributes' as it does
     * not have a closing tag (nesting: -1)
     */
    name: 'inline nesting 0',
    tests: [
      {
        shift: 0,
        type: 'inline',
        children: [
          {
            shift: -1,
            type: (str) => str === 'image' || str === 'code_inline'
          }, {
            shift: 0,
            type: 'text',
            content: utils.hasDelimiter('start', options)
          }
        ]
      }
    ],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let endChar = token.content.indexOf(options.rightDelimiter);
      let attrToken = tokens[i].children[j - 1];
      let attrs = utils.getAttrs(token.content, 0, null, options);
      utils.addAttrs(attrs, attrToken);
      if (token.content.length === (endChar + 1)) {
        tokens[i].children.splice(j, 1);
      } else {
        token.content = token.content.slice(endChar + 1);
      }
    }
  }, {
    /**
     * | h1 |
     * | -- |
     * | c1 |
     * {.c}
     */
    name: 'tables',
    tests: [
      {
        // let this token be i, such that for-loop continues at
        // next token after tokens.splice
        shift: 0,
        type: 'table_close'
      }, {
        shift: 1,
        type: 'paragraph_open'
      }, {
        shift: 2,
        type: 'inline',
        content: utils.hasDelimiter('only', options)
      }
    ],
    transform: (tokens, i) => {
      let token = tokens[i + 2];
      let tableOpen = utils.getMatchingOpeningToken(tokens, i);
      let attrs = utils.getAttrs(token.content, 0, null, options);
      // add attributes
      utils.addAttrs(attrs, tableOpen);
      // remove <p>{.c}</p>
      tokens.splice(i + 1, 3);
    }
  }, {
    /**
     * *emphasis*{.with attrs=1}
     */
    name: 'inline attributes',
    tests: [
      {
        shift: 0,
        type: 'inline',
        children: [
          {
            shift: -1,
            nesting: -1  // closing inline tag, </em>{.a}
          }, {
            shift: 0,
            type: 'text',
            content: utils.hasDelimiter('start', options)
          }
        ]
      }
    ],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils.getAttrs(content, 0, null, options);
      let openingToken = utils.getMatchingOpeningToken(tokens[i].children, j - 1);
      utils.addAttrs(attrs, openingToken);
      token.content = content.slice(content.indexOf(options.rightDelimiter) + 1);
    }
  }, {
    /**
     * - item
     * {.a}
     */
    name: 'list softbreak',
    tests: [
      {
        shift: -2,
        type: 'list_item_open'
      }, {
        shift: 0,
        type: 'inline',
        children: [
          {
            position: -2,
            type: 'softbreak'
          }, {
            position: -1,
            content: utils.hasDelimiter('only', options)
          }
        ]
      }
    ],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils.getAttrs(content, 0, null, options);
      let ii = i - 2;
      while (tokens[ii - 1] &&
        tokens[ii - 1].type !== 'ordered_list_open' &&
        tokens[ii - 1].type !== 'bullet_list_open') { ii--; }
      utils.addAttrs(attrs, tokens[ii - 1]);
      tokens[i].children = tokens[i].children.slice(0, -2);
    }
  }, {
    /**
     * - nested list
     *   - with double \n
     *   {.a} <-- apply to nested ul
     *
     * {.b} <-- apply to root <ul>
     */
    name: 'list double softbreak',
    tests: [
      {
        // let this token be i = 0 so that we can erase
        // the <p>{.a}</p> tokens below
        shift: 0,
        type: (str) =>
          str === 'bullet_list_close' ||
          str === 'ordered_list_close'
      }, {
        shift: 1,
        type: 'paragraph_open'
      }, {
        shift: 2,
        type: 'inline',
        content: utils.hasDelimiter('only', options),
        children: (arr) => arr.length === 1
      }, {
        shift: 3,
        type: 'paragraph_close'
      }
    ],
    transform: (tokens, i) => {
      let token = tokens[i + 2];
      let content = token.content;
      let attrs = utils.getAttrs(content, 0, null, options);
      let openingToken = utils.getMatchingOpeningToken(tokens, i);
      utils.addAttrs(attrs, openingToken);
      tokens.splice(i + 1, 3);
    }
  }, {
    /**
     * - end of {.list-item}
     */
    name: 'list item end',
    tests: [
      {
        shift: -2,
        type: 'list_item_open'
      }, {
        shift: 0,
        type: 'inline',
        children: [
          {
            position: -1,
            content: utils.hasDelimiter('end', options)
          }
        ]
      }
    ],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils.getAttrs(content, content.lastIndexOf(options.leftDelimiter), null, options);
      utils.addAttrs(attrs, tokens[i - 2]);
      let trimmed = content.slice(0, content.lastIndexOf(options.leftDelimiter));
      token.content = last(trimmed) !== ' ' ?
        trimmed : trimmed.slice(0, -1);
    }
  }, {
    /**
     * something with softbreak
     * {.cls}
     */
    name: '\n{.a} softbreak then curly in start',
    tests: [
      {
        shift: 0,
        type: 'inline',
        children: [
          {
            position: -2,
            type: 'softbreak'
          }, {
            position: -1,
            type: 'text',
            content: utils.hasDelimiter('only', options)
          }
        ]
      }
    ],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let attrs = utils.getAttrs(token.content, 0, null, options);
      // find last closing tag
      let ii = i + 1;
      while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) { ii++; }
      let openingToken = utils.getMatchingOpeningToken(tokens, ii);
      utils.addAttrs(attrs, openingToken);
      tokens[i].children = tokens[i].children.slice(0, -2);
    }
  }, {
    /**
     * end of {.block}
     */
    name: 'end of block',
    tests: [
      {
        shift: 0,
        type: 'inline',
        children: [
          {
            position: -1,
            content: utils.hasDelimiter('end', options),
            type: (t) => t !== 'code_inline'
          }
        ]
      }
    ],
    transform: (tokens, i, j) => {
      let token = tokens[i].children[j];
      let content = token.content;
      let attrs = utils.getAttrs(content, content.lastIndexOf(options.leftDelimiter), null, options);
      let ii = i + 1;
      while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) { ii++; }
      let openingToken = utils.getMatchingOpeningToken(tokens, ii);
      utils.addAttrs(attrs, openingToken);
      let trimmed = content.slice(0, content.lastIndexOf(options.leftDelimiter));
      token.content = last(trimmed) !== ' ' ?
        trimmed : trimmed.slice(0, -1);
    }
  }
]);

// get last element of array or string
function last(arr) {
  return arr.slice(-1)[0];
}

