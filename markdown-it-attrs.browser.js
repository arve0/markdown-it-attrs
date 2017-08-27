(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.markdownItAttrs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var patterns = require('./patterns.js');

module.exports = function attributes(md) {

  function curlyAttrs(state) {
    var tokens = state.tokens;

    var _loop = function _loop(i) {
      for (var p = 0; p < patterns.length; p++) {
        var pattern = patterns[p];
        var j = null; // position of child with offset 0
        var match = pattern.tests.every(function (t) {
          var res = test(tokens, i, t);
          if (res.j !== null) {
            j = res.j;
          }
          return res.match;
        });
        if (match) {
          pattern.transform(tokens, i, j);
          if (pattern.name === 'inline attributes') {
            // retry, may be several inline attributes
            p--;
          }
        }
      }
    };

    for (var i = 0; i < tokens.length; i++) {
      _loop(i);
    }
  }

  md.core.ruler.before('linkify', 'curly_attributes', curlyAttrs);
};

/**
 * Test if t matches token stream.
 *
 * @param {array} tokens
 * @param {number} i
 * @param {object} t Test to match.
 * @return {object} { match: true|false, j: null|number }
 */
function test(tokens, i, t) {
  var res = {
    match: false,
    j: null // position of child
  };

  var ii = t.shift !== undefined ? i + t.shift : t.position;
  var token = get(tokens, ii); // supports negative ii


  if (token === undefined) {
    return res;
  }

  var _loop2 = function _loop2(key) {
    if (key === 'shift' || key === 'position') {
      return 'continue';
    }

    if (token[key] === undefined) {
      return {
        v: res
      };
    }

    if (key === 'children' && isArrayOfObjects(t.children)) {
      var _ret3 = function () {
        if (token.children.length === 0) {
          return {
            v: {
              v: res
            }
          };
        }
        var match = void 0;
        var childTests = t.children;
        var children = token.children;
        if (childTests.every(function (tt) {
          return tt.position !== undefined;
        })) {
          // positions instead of shifts, do not loop all children
          match = childTests.every(function (tt) {
            return test(children, tt.position, tt).match;
          });
          if (match) {
            // we may need position of child in transform
            var j = last(childTests).position;
            res.j = j >= 0 ? j : children.length + j;
          }
        } else {
          var _loop3 = function _loop3(_j) {
            match = childTests.every(function (tt) {
              return test(children, _j, tt).match;
            });
            if (match) {
              res.j = _j;
              // all tests true, continue with next key of pattern t
              return 'break';
            }
          };

          for (var _j = 0; _j < children.length; _j++) {
            var _ret4 = _loop3(_j);

            if (_ret4 === 'break') break;
          }
        }

        if (match === false) {
          return {
            v: {
              v: res
            }
          };
        }

        return {
          v: 'continue'
        };
      }();

      if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
    }

    switch (_typeof(t[key])) {
      case 'boolean':
      case 'number':
      case 'string':
        if (token[key] !== t[key]) {
          return {
            v: res
          };
        }
        break;
      case 'function':
        if (!t[key](token[key])) {
          return {
            v: res
          };
        }
        break;
      case 'object':
        if (isArrayOfFunctions(t[key])) {
          var r = t[key].every(function (tt) {
            return tt(token[key]);
          });
          if (r === false) {
            return {
              v: res
            };
          }
          break;
        }
      // fall through for objects !== arrays of functions
      default:
        throw new Error('Unknown type of pattern test (key: ' + key + '). Test should be of type boolean, number, string, function or array of functions.');
    }
  };

  for (var key in t) {
    var _ret2 = _loop2(key);

    switch (_ret2) {
      case 'continue':
        continue;

      default:
        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
    }
  }

  // no tests returned false -> all tests returns true
  res.match = true;
  return res;
}

function isArrayOfObjects(arr) {
  return Array.isArray(arr) && arr.length && arr.every(function (i) {
    return (typeof i === 'undefined' ? 'undefined' : _typeof(i)) === 'object';
  });
}

function isArrayOfFunctions(arr) {
  return Array.isArray(arr) && arr.length && arr.every(function (i) {
    return typeof i === 'function';
  });
}

/**
 * Get n item of array. Supports negative n, where -1 is last
 * element in array.
 * @param {array} arr
 * @param {number} n
 */
function get(arr, n) {
  return n >= 0 ? arr[n] : arr[arr.length + n];
}

// get last element of array, safe - returns {} if not found
function last(arr) {
  return arr.slice(-1)[0] || {};
}

},{"./patterns.js":2}],2:[function(require,module,exports){
'use strict';
/**
 * If a pattern matches the token stream,
 * then run transform.
 */

var utils = require('./utils.js');

module.exports = [{
  /**
   * ```python {.cls}
   * for i in range(10):
   *     print(i)
   * ```
   */
  name: 'fenced code blocks',
  tests: [{
    shift: 0,
    block: true,
    info: utils.hasCurly('end')
  }],
  transform: function transform(tokens, i) {
    var token = tokens[i];
    var start = token.info.lastIndexOf('{');
    var attrs = utils.getAttrs(token.info, start);
    utils.addAttrs(attrs, token);
    token.info = utils.removeCurly(token.info);
  }
}, {
  /**
   * bla `click()`{.c} ![](img.png){.d}
   *
   * differs from 'inline attributes' as it does
   * not have a closing tag (nesting: -1)
   */
  name: 'inline nesting 0',
  tests: [{
    shift: 0,
    type: 'inline',
    children: [{
      shift: -1,
      type: function type(str) {
        return str === 'image' || str === 'code_inline';
      }
    }, {
      shift: 0,
      type: 'text',
      content: utils.hasCurly('start')
    }]
  }],
  transform: function transform(tokens, i, j) {
    var token = tokens[i].children[j];
    var endChar = token.content.indexOf('}');
    var attrToken = tokens[i].children[j - 1];
    var attrs = utils.getAttrs(token.content, 0);
    utils.addAttrs(attrs, attrToken);
    token.content = token.content.slice(endChar + 1);
  }
}, {
  /**
   * | h1 |
   * | -- |
   * | c1 |
   * {.c}
   */
  name: 'tables',
  tests: [{
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
    content: utils.hasCurly('only')
  }],
  transform: function transform(tokens, i) {
    var token = tokens[i + 2];
    var tableOpen = utils.getMatchingOpeningToken(tokens, i);
    var attrs = utils.getAttrs(token.content, 0);
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
  tests: [{
    shift: 0,
    type: 'inline',
    children: [{
      shift: -1,
      nesting: -1 // closing inline tag, </em>{.a}
    }, {
      shift: 0,
      type: 'text',
      content: utils.hasCurly('start')
    }]
  }],
  transform: function transform(tokens, i, j) {
    var token = tokens[i].children[j];
    var content = token.content;
    var attrs = utils.getAttrs(content, 0);
    var openingToken = utils.getMatchingOpeningToken(tokens[i].children, j - 1);
    utils.addAttrs(attrs, openingToken);
    token.content = content.slice(content.indexOf('}') + 1);
  }
}, {
  /**
   * - item
   * {.a}
   */
  name: 'list softbreak',
  tests: [{
    shift: -2,
    type: 'list_item_open'
  }, {
    shift: 0,
    type: 'inline',
    children: [{
      position: -2,
      type: 'softbreak'
    }, {
      position: -1,
      content: utils.hasCurly('only')
    }]
  }],
  transform: function transform(tokens, i, j) {
    var token = tokens[i].children[j];
    var content = token.content;
    var attrs = utils.getAttrs(content, 0);
    var ii = i - 2;
    while (tokens[ii - 1] && tokens[ii - 1].type !== 'ordered_list_open' && tokens[ii - 1].type !== 'bullet_list_open') {
      ii--;
    }
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
  tests: [{
    // let this token be i = 0 so that we can erase
    // the <p>{.a}</p> tokens below
    shift: 0,
    type: function type(str) {
      return str === 'bullet_list_close' || str === 'ordered_list_close';
    }
  }, {
    shift: 1,
    type: 'paragraph_open'
  }, {
    shift: 2,
    type: 'inline',
    content: utils.hasCurly('only'),
    children: function children(arr) {
      return arr.length === 1;
    }
  }, {
    shift: 3,
    type: 'paragraph_close'
  }],
  transform: function transform(tokens, i) {
    var token = tokens[i + 2];
    var content = token.content;
    var attrs = utils.getAttrs(content, 0);
    var openingToken = utils.getMatchingOpeningToken(tokens, i);
    utils.addAttrs(attrs, openingToken);
    tokens.splice(i + 1, 3);
  }
}, {
  /**
   * - end of {.list-item}
   */
  name: 'list item end',
  tests: [{
    shift: -2,
    type: 'list_item_open'
  }, {
    shift: 0,
    type: 'inline',
    children: [{
      position: -1,
      content: utils.hasCurly('end')
    }]
  }],
  transform: function transform(tokens, i, j) {
    var token = tokens[i].children[j];
    var content = token.content;
    var attrs = utils.getAttrs(content, content.lastIndexOf('{'));
    utils.addAttrs(attrs, tokens[i - 2]);
    var trimmed = content.slice(0, content.lastIndexOf('{'));
    token.content = last(trimmed) !== ' ' ? trimmed : trimmed.slice(0, -1);
  }
}, {
  /**
   * something with softbreak
   * {.cls}
   */
  name: '\n{.a} softbreak then curly in start',
  tests: [{
    shift: 0,
    type: 'inline',
    children: [{
      position: -2,
      type: 'softbreak'
    }, {
      position: -1,
      type: 'text',
      content: utils.hasCurly('only')
    }]
  }],
  transform: function transform(tokens, i, j) {
    var token = tokens[i].children[j];
    var attrs = utils.getAttrs(token.content, 0);
    // find last closing tag
    var ii = i + 1;
    while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) {
      ii++;
    }
    var openingToken = utils.getMatchingOpeningToken(tokens, ii);
    utils.addAttrs(attrs, openingToken);
    tokens[i].children = tokens[i].children.slice(0, -2);
  }
}, {
  /**
   * end of {.block}
   */
  name: 'end of block',
  tests: [{
    shift: 0,
    type: 'inline',
    children: [{
      position: -1,
      content: utils.hasCurly('end')
    }]
  }],
  transform: function transform(tokens, i, j) {
    var token = tokens[i].children[j];
    var content = token.content;
    var attrs = utils.getAttrs(content, content.lastIndexOf('{'));
    var ii = i + 1;
    while (tokens[ii + 1] && tokens[ii + 1].nesting === -1) {
      ii++;
    }
    var openingToken = utils.getMatchingOpeningToken(tokens, ii);
    utils.addAttrs(attrs, openingToken);
    var trimmed = content.slice(0, content.lastIndexOf('{'));
    token.content = last(trimmed) !== ' ' ? trimmed : trimmed.slice(0, -1);
  }
}];

// get last element of array or string
function last(arr) {
  return arr.slice(-1)[0];
}

},{"./utils.js":3}],3:[function(require,module,exports){
'use strict';
/**
 * parse {.class #id key=val} strings
 * @param {string} str: string to parse
 * @param {int} start: where to start parsing (including {)
 * @returns {2d array}: [['key', 'val'], ['class', 'red']]
 */

exports.getAttrs = function (str, start, end) {
  // TODO: do not require `end`, stop when } is found
  // not tab, line feed, form feed, space, solidus, greater than sign, quotation mark, apostrophe and equals sign
  var allowedKeyChars = /[^\t\n\f />"'=]/;
  var pairSeparator = ' ';
  var keySeparator = '=';
  var classChar = '.';
  var idChar = '#';
  var endChar = '}';

  var attrs = [];
  var key = '';
  var value = '';
  var parsingKey = true;
  var valueInsideQuotes = false;

  // read inside {}
  // start + 1 to avoid beginning {
  // breaks when } is found or end of string
  for (var i = start + 1; i < str.length; i++) {
    var char_ = str.charAt(i);
    if (char_ === endChar) {
      if (key !== '') {
        attrs.push([key, value]);
      }
      break;
    }

    // switch to reading value if equal sign
    if (char_ === keySeparator) {
      parsingKey = false;
      continue;
    }

    // {.class}
    if (char_ === classChar && key === '') {
      key = 'class';
      parsingKey = false;
      continue;
    }

    // {#id}
    if (char_ === idChar && key === '') {
      key = 'id';
      parsingKey = false;
      continue;
    }

    // {value="inside quotes"}
    if (char_ === '"' && value === '') {
      valueInsideQuotes = true;
      continue;
    }
    if (char_ === '"' && valueInsideQuotes) {
      valueInsideQuotes = false;
      continue;
    }

    // read next key/value pair
    if (char_ === pairSeparator && !valueInsideQuotes || i === end) {
      if (key === '') {
        // beginning or ending space: { .red } vs {.red}
        continue;
      }
      attrs.push([key, value]);
      key = '';
      value = '';
      parsingKey = true;
      continue;
    }

    // continue if character not allowed
    if (parsingKey && char_.search(allowedKeyChars) === -1) {
      continue;
    }

    // no other conditions met; append to key/value
    if (parsingKey) {
      key += char_;
      continue;
    }
    value += char_;
  }
  return attrs;
};

/**
 * add attributes from [['key', 'val']] list
 * @param {array} attrs: [['key', 'val']]
 * @param {token} token: which token to add attributes
 * @returns token
 */
exports.addAttrs = function (attrs, token) {
  for (var j = 0, l = attrs.length; j < l; ++j) {
    var key = attrs[j][0];
    if (key === 'class') {
      token.attrJoin('class', attrs[j][1]);
    } else {
      token.attrPush(attrs[j]);
    }
  }
  return token;
};

/**
 * Does string have properly formatted curly?
 *
 * start: '{.a} asdf'
 * middle: 'a{.b}c'
 * end: 'asdf {.a}'
 * only: '{.a}'
 *
 * @param {string} where to expect {} curly. start, middle, end or only.
 * @return {function(string)} Function which testes if string has curly.
 */
exports.hasCurly = function (where) {

  if (!where) {
    throw new Error('Parameter `where` not passed. Should be "start", "middle", "end" or "only".');
  }

  /**
   * @param {string} str
   * @return {boolean}
   */
  return function (str) {
    // we need minimum four chars, example {.b}
    if (!str || typeof str !== 'string' || str.length < 4) {
      return false;
    }

    var start = void 0,
        end = void 0;
    switch (where) {
      case 'start':
        // first char should be {, } found in char 3 or more
        return str.charAt(0) === '{' && str.indexOf('}', 3) !== -1;

      case 'middle':
        // 'a{.b}'
        start = str.indexOf('{', 1);
        end = start !== -1 && str.indexOf('}', start + 3);
        return start !== -1 && end !== -1;

      case 'end':
        // last char should be }
        end = str.charAt(str.length - 1) === '}';
        start = end && str.indexOf('{');
        return end && start + 3 < str.length;

      case 'only':
        // '{.a}'
        return str.charAt(0) === '{' &&
        // make sure first occurence is last occurence
        str.indexOf('}', 3) === str.length - 1;
    }
  };
};

/**
 * Removes last curly from string.
 */
exports.removeCurly = function (str) {
  var curly = /[ \n]?{[^{}}]+}$/;
  var pos = str.search(curly);

  return pos !== -1 ? str.slice(0, pos) : str;
};

/**
 * find corresponding opening block
 */
exports.getMatchingOpeningToken = function (tokens, i) {
  if (tokens[i].type === 'softbreak') {
    return false;
  }
  // non closing blocks, example img
  if (tokens[i].nesting === 0) {
    return tokens[i];
  }

  // inline tokens changes level on same token
  // that have .nesting +- 1
  var level = tokens[i].block ? tokens[i].level : tokens[i].level + 1; // adjust for inline tokens

  var type = tokens[i].type.replace('_close', '_open');

  for (; i >= 0; --i) {
    if (tokens[i].type === type && tokens[i].level === level) {
      return tokens[i];
    }
  }
};

/**
 * from https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js
 */
var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

exports.escapeHtml = function (str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
};

},{}]},{},[1])(1)
});