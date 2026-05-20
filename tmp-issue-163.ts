import MarkdownIt from 'markdown-it';
import markdownItAttrs from './index';

const md = new MarkdownIt();
md.use(markdownItAttrs);
