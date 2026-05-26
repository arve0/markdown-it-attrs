import MarkdownIt = require('markdown-it');

declare namespace markdownItAttrs {
  type AllowedAttribute = string | RegExp;

  interface Options {
    leftDelimiter?: string;
    rightDelimiter?: string;
    allowedAttributes?: AllowedAttribute[];
    allowedAttributeValues?: AllowedAttribute[];
    fenceAttrsOnPre?: boolean;
  }
}

declare function markdownItAttrs(md: MarkdownIt, options?: markdownItAttrs.Options): void;

export = markdownItAttrs;
