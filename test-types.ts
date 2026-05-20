import MarkdownIt = require('markdown-it');
import markdownItAttrs = require('./index.js');

// Verify that the plugin can be used with md.use() without type errors.
// This was broken when using @types/markdown-it-attrs because it ships its own
// nested @types/markdown-it, causing a "Type 'markdownit' is not assignable to
// type '...'" error.
const md = new MarkdownIt();

// Should compile without errors: basic usage
md.use(markdownItAttrs);

// Should compile without errors: usage with options
md.use(markdownItAttrs, {
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: ['class', 'id', /^data-/],
  allowedAttributeValues: [],
});

// Should compile without errors: partial options
md.use(markdownItAttrs, { leftDelimiter: '[', rightDelimiter: ']' });

// Verify Options type is exported and usable
const options: markdownItAttrs.Options = {
  leftDelimiter: '[[',
  rightDelimiter: ']]',
};
md.use(markdownItAttrs, options);

// Verify the plugin function signature is compatible with MarkdownIt.PluginWithOptions
const plugin: MarkdownIt.PluginWithOptions<markdownItAttrs.Options> = markdownItAttrs;
md.use(plugin, options);

export {};
