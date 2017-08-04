'use strict';

const utils = require('./utils.js');
const patterns = require('./patterns.js');

module.exports = function attributes(md) {

  function curlyAttrs(state){
    var tokens = state.tokens;

    for (var i = 0; i < tokens.length; ++i) {
      let token = tokens[i];
      let pattern;
      if (token.block) {
        pattern = getMatchingPattern(tokens, i, 'block');
        if (pattern) {
          pattern.transform(tokens, i);
          continue;
        }
        if (token.type === 'inline') {
          let children = tokens[i].children;
          for (let j = 0; j < children.length; ++j) {
            pattern = getMatchingPattern(children, j, 'inline');
            if (pattern) {
              pattern.transform(children, j);
              continue;
            }
          }
        }
      }

      // block tokens contain markup
      // inline tokens contain the text
      if (tokens[i].type !== 'inline') {
        continue;
      }

      var inlineTokens = tokens[i].children;
      if (!inlineTokens || inlineTokens.length <= 0) {
        continue;
      }

      // attributes for blocks
      var lastInlineToken;
      if (utils.hasCurlyInEnd(tokens[i].content)) {
        lastInlineToken = last(inlineTokens);
        var content = lastInlineToken.content;
        var curlyStart = content.lastIndexOf('{');
        var attrs = utils.getAttrs(content, curlyStart + 1, content.length - 1);
        // if list and `\n{#c}` -> apply to bullet list open:
        //
        // - iii
        // {#c}
        //
        // should give
        //
        // <ul id="c">
        //   <li>iii</li>
        // </ul>
        var nextLastInline = nextLast(inlineTokens);
        // some blocks are hidden, example li > paragraph_open
        var correspondingBlock = firstTokenNotHidden(tokens, i - 1);
        if (nextLastInline && nextLastInline.type === 'softbreak' &&
            correspondingBlock && correspondingBlock.type === 'list_item_open') {
          utils.addAttrs(attrs, bulletListOpen(tokens, i - 1));
          // remove softbreak and {} inline tokens
          tokens[i].children = inlineTokens.slice(0, -2);
          tokens[i].content = utils.removeCurly(tokens[i].content);
          if (utils.hasCurlyInEnd(tokens[i].content)) {
            // do once more:
            //
            // - item {.a}
            // {.b} <-- applied this
            i -= 1;
          }
        } else {
          utils.addAttrs(attrs, correspondingBlock);
          lastInlineToken.content = utils.removeCurly(content);
          if (lastInlineToken.content === '') {
            // remove empty inline token
            inlineTokens.pop();
          }
          tokens[i].content = utils.removeCurly(tokens[i].content);
        }
      }

    }
  }
  md.core.ruler.before('linkify', 'curly_attributes', curlyAttrs);
};

/**
 * some blocks are hidden (not rendered)
 */
function firstTokenNotHidden(tokens, i) {
  if (tokens[i] && tokens[i].hidden) {
    return firstTokenNotHidden(tokens, i - 1);
  }
  return tokens[i];
}

/**
 * Find corresponding bullet/ordered list open.
 */
function bulletListOpen(tokens, i) {
  var level = 0;
  var token;
  for (; i >= 0; i -= 1) {
    token = tokens[i];
    // jump past nested lists, level == 0 and open -> correct opening token
    if (token.type === 'bullet_list_close' ||
        token.type === 'ordered_list_close') {
      level += 1;
    }
    if (token.type === 'bullet_list_open' ||
        token.type === 'ordered_list_open') {
      if (level === 0) {
        return token;
      } else {
        level -= 1;
      }
    }
  }
}

/**
 * Returns first pattern that matches `token`-stream
 * at current `i`.
 *
 * @param {array} tokens
 * @param {number} i
 * @param {string} type - pattern type
 */
function getMatchingPattern (tokens, i, type) {
  type = type || 'block';
  for (let pattern of patterns.filter(p => p.type === type)) {
    let match = pattern.tests.every((test) => {
      let j = i + test.shift;
      let token = tokens[j];

      if (token === undefined) { return false; }

      for (let key in test) {
        if (key === 'shift') { continue; }


        if (token[key] === undefined) { return false; }
        switch (typeof test[key]) {
        case 'boolean':
        case 'number':
        case 'string':
          if (token[key] !== test[key]) { return false; }
          break;
        case 'function':
          if (!test[key](token[key])) { return false; }
          break;
        case 'object':
          if (Array.isArray(test[key])) {
            let res = test[key].every(t => t(token[key]));
            if (res === false) { return false; }
            break;
          }
          // fall through for objects that are not arrays
        default:
          throw new Error('Unknown type of pattern test. Test should be of type boolean, number, string, function or array of functions.');
        }
      }
      return true;
    });
    if (match) {
      return pattern;
    }
  }
  return false;
}

function last(arr) {
  return arr.slice(-1)[0];
}

function nextLast(arr) {
  return arr.slice(-2, -1)[0];
}
