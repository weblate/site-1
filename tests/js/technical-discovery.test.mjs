import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (name) => readFileSync(new URL('../../source/' + name, import.meta.url), 'utf8');
const header = read('_layouts/header.blade.php');
const home = read('index.blade.php');
const technical = read('tecnical-details.blade.php');
const faq = read('faq.blade.php');
const layout = read('_layouts/main.blade.php');

test('primary discovery paths reference the API guide and documentation chooser', () => {
  for (const [name, source] of [['header', header], ['home', home], ['technical', technical], ['FAQ', faq]]) {
    assert.match(source, /posts\/libresign-api-guide/, name + ' lacks an API guide link');
  }
  for (const [name, source] of [['header', header], ['technical', technical], ['FAQ', faq]]) {
    assert.match(source, /https:\/\/docs\.libresign\.coop\//, name + ' lacks a documentation chooser');
  }
  assert.doesNotMatch(technical, /docs\.libresign\.coop\/(?:developer_manual|admin_manual)\//);
});

test('social image URLs use the origin resolver even with production baseUrl="/"', () => {
  assert.match(layout, /property="og:image" content="\{\{\s*\$absoluteSeoUrl\(/);
  assert.match(layout, /name="twitter:image" content="\{\{\s*\$absoluteSeoUrl\(/);
});

test('new technical links use the Weblate extraction helper', () => {
  assert.match(technical, /id="it-requirements-heading">\{\{\s*\$page->t\(/);
  assert.match(faq, /https:\/\/docs\.libresign\.coop\/"[^>]*>\{\{\s*\$page->t\(/);
});
