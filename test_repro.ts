import MarkdownIt = require('markdown-it');

// Simulate what index.d.ts does - using MarkdownIt imported via require
// as a type annotation (this should cause TS2709 with some TS versions)
declare function markdownItAttrs(md: MarkdownIt): void;

const md = new MarkdownIt();
markdownItAttrs(md);

export {};
