'use strict';

module.exports = function attributes(md) {

  // not tab, line feed, form feed, space, solidus, greater than sign, quotation mark, apostrophe and equals sign
  var allowedKeyChars = /[^\t\n\f \/>"'=]/;
  var pairSeparator = ' ';
  var keySeparator = '=';
  var classChar = '.';
  var idChar = '#';

  function curlyAttrs(state){
    var l = state.tokens.length;
    var tokens = state.tokens;
    for (var i = 0; i < l; i++) {
      if (tokens[i].type !== 'inline') {
        continue;
      }

      var inlineTokens = tokens[i].children;
      if (inlineTokens.length <= 0) {
        continue;
      }
      var end = inlineTokens.length - 1;
      var content = inlineTokens[end].content;

      // should end in }
      if (content.charAt(content.length - 1) !== '}') {
        continue;
      }

      var curlyStart = content.indexOf('{');

      // should start with {
      if (curlyStart === -1) {
        continue;
      }

      var key = '';
      var value = '';
      var parsingKey = true;
      var valueInsideQuotes = false;

      // read inside {}, excluding {, including }
      for (var ii = curlyStart + 1; ii < content.length; ii++) {
        var char = content.charAt(ii);

        // switch to reading value if equal sign
        if (char === keySeparator) {
          parsingKey = false;
          continue;
        }

        // {.class}
        if (char === classChar && key === '') {
          key = 'class';
          parsingKey = false;
          continue;
        }

        // {#id}
        if (char === idChar && key === '') {
          key = 'id';
          parsingKey = false;
          continue;
        }

        // {value="inside quotes"}
        if (char === '"' && value === '') {
          valueInsideQuotes = true;
          continue;
        }
        if (char === '"' && valueInsideQuotes) {
          valueInsideQuotes = false;
          continue;
        }

        // read next key/value pair
        if ((char === pairSeparator && !valueInsideQuotes) ||
            char === '}') {
          if (key === 'class' &&
              tokens[i - 1].attrIndex(key) !== -1) {
            var classIdx = tokens[i - 1].attrIndex(key);
            tokens[i - 1].attrs[classIdx][1] += ' ' + value;
          } else {
            tokens[i - 1].attrPush([key, value]);
          }
          key = '';
          value = '';
          parsingKey = true;
          continue;
        }

        // continue if character not allowed
        if (parsingKey && char.search(allowedKeyChars) === -1) {
          continue;
        }

        // no other conditions met; append to key/value
        if (parsingKey) {
          key += char;
          continue;
        }
        value += char;
      }

      inlineTokens[end].content = content.slice(0, curlyStart).trim();

    }
  }
  md.core.ruler.push('curly_attributes', curlyAttrs);
};
