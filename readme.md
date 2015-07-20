# markdown-it-attrs [![Build Status](https://travis-ci.org/arve0/markdown-it-attrs.svg?branch=master)](https://travis-ci.org/arve0/markdown-it-attrs)

Add classes, identifiers and attributes to your markdown with `{.class #identifier attr=value}` curly brackets, similar to [pandoc's header attributes](http://pandoc.org/README.html#extension-header_attributes).

Example input:
```md
# header {.styleMe}
paragraph {data-toggle=modal}
```

Output:
```html
<h1 class="myClass">header</h1>

**Note:** Plugin does not validate any input, so you should validate the attributes in your html output to be secure.

## Install

```
$ npm install --save markdown-it-attrs
```


## Usage

```js
var md = require('markdown-it')();
var markdownItAttrs = require('markdown-it-attrs');

md.use(markdownItAttrs);
console.log(md.render('paragraph {with=attrs .class #id}'));
```


## License

MIT © [Arve Seljebu](https://github.com/arve0/markdown-it-attrs)
