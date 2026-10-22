#!/usr/bin/env node
// Check repository files and GitHub-style heading anchors without network access.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';

const args = process.argv.slice(2);
const root = path.resolve(args[0] === '--root' ? args[1] : args[0] ?? fileURLToPath(new URL('../', import.meta.url)));
const markdown = new MarkdownIt({ html: true });
const errors = [];

function documentsIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const destination = path.join(directory, entry.name);
    if (entry.isDirectory() && !['.git', 'node_modules'].includes(entry.name)) return documentsIn(destination);
    return entry.isFile() && entry.name.endsWith('.md') ? [destination] : [];
  });
}

function headingText(tokens) {
  return (tokens ?? []).map(token => {
    if (['text', 'code_inline'].includes(token.type)) return token.content;
    if (['softbreak', 'hardbreak'].includes(token.type)) return ' ';
    return token.type === 'image' ? headingText(token.children) || token.content : '';
  }).join('');
}

function inspect(file) {
  const text = fs.readFileSync(file, 'utf8');
  const tokens = markdown.parse(text, {});
  const slugger = new GithubSlugger();
  const ids = new Set();
  const explicit = new Set();
  const links = [];
  const codeRanges = tokens.filter(token => ['fence', 'code_block'].includes(token.type)).map(token => token.map);
  for (const [line, content] of text.split('\n').entries()) {
    if (/^(?:<<<<<<<|>>>>>>>) /.test(content) && !codeRanges.some(([first, last]) => line >= first && line < last)) {
      errors.push(`${path.relative(root, file)}:${line + 1}: unresolved merge marker`);
    }
  }

  function walk(items, parentLine = 1) {
    let lineHint = parentLine;
    for (const [index, token] of items.entries()) {
      if (token.map) lineHint = token.map[0] + 1;
      const line = lineHint;
      if (token.type === 'heading_open') ids.add(slugger.slug(headingText(items[index + 1].children)));
      if (token.type === 'link_open' || token.type === 'image') {
        links.push({ target: token.attrGet(token.type === 'image' ? 'src' : 'href'), line });
      }
      if (token.type.startsWith('html')) {
        for (const tag of token.content.matchAll(/<[a-z][^>]*>/gi)) {
          const tagIds = new Set();
          for (const attribute of tag[0].matchAll(/\b(id|name|href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
            const key = attribute[1].toLowerCase();
            const value = markdown.utils.unescapeAll(attribute[2] ?? attribute[3] ?? attribute[4]);
            if (key === 'id' || key === 'name') {
              if (explicit.has(value) && !tagIds.has(value)) errors.push(`${path.relative(root, file)}:${line}: duplicate anchor ${value}`);
              explicit.add(value);
              tagIds.add(value);
              ids.add(value);
            } else links.push({ target: value, line });
          }
        }
      }
      if (token.children) walk(token.children, line);
    }
  }
  walk(tokens);
  return { ids, links };
}

const documents = new Map(documentsIn(root).map(file => [file, inspect(file)]));
let references = 0;
let local = 0;
let external = 0;
for (const [file, document] of documents) {
  for (const { target, line } of document.links) {
    if (!target) continue;
    references++;
    const fail = reason => errors.push(`${path.relative(root, file)}:${line}: ${reason}: ${target}`);
    let url;
    try { url = new URL(target, pathToFileURL(file)); }
    catch { fail('malformed URL'); continue; }
    let destination;
    if (url.protocol === 'file:') destination = fileURLToPath(url);
    else if (url.hostname === 'github.com' && /^\/RlM100always\/bcs\/(?:blob|tree)\/main\//.test(url.pathname)) {
      destination = path.join(root, decodeURIComponent(url.pathname.replace(/^\/RlM100always\/bcs\/(?:blob|tree)\/main\//, '')));
    } else { external++; continue; }
    local++;
    const relative = path.relative(root, destination);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) { fail('path outside repository'); continue; }
    if (!fs.existsSync(destination)) { fail('missing file'); continue; }
    if (fs.statSync(destination).isDirectory() && fs.existsSync(path.join(destination, 'README.md'))) {
      destination = path.join(destination, 'README.md');
    }
    if (url.hash && documents.has(destination)) {
      let fragment;
      try { fragment = decodeURIComponent(url.hash.slice(1)); }
      catch { fail('malformed fragment'); continue; }
      if (fragment && !documents.get(destination).ids.has(fragment)) fail('missing heading/anchor');
    }
  }
}
console.log(`Markdown documents: ${documents.size}; references: ${references}; local targets checked: ${local}`);
console.log(`External/non-file URLs: ${external} (not checked; require a network-enabled audit)`);
for (const error of errors) console.error(`ERROR: ${error}`);
console.log(`${errors.length ? 'FAIL' : 'PASS'}: Markdown files, anchors and merge markers`);
process.exitCode = errors.length ? 1 : 0;
