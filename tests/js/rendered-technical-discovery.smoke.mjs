import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const buildRoot = new URL('../../build_production/', import.meta.url);
const html = (path) => readFileSync(new URL(path, buildRoot), 'utf8');
const tags = (page, name) => [...page.matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))].map((match) => match[0]);
const attribute = (tag, name) => tag?.match(new RegExp('\\b' + name + '="([^"]*)"', 'i'))?.[1] ?? null;
const namedTag = (page, element, attributeName, value) =>
  tags(page, element).find((tag) => attribute(tag, attributeName) === value);

test('generated pages have absolute canonical, hreflang and social image URLs', () => {
  for (const path of [
    'index.html',
    'faq/index.html',
    'tecnical-details/index.html',
    'pt-BR/tecnical-details/index.html',
  ]) {
    const page = html(path);
    const canonical = attribute(namedTag(page, 'link', 'rel', 'canonical'), 'href');
    assert.match(canonical ?? '', /^https:\/\//, path + ': canonical must be absolute');
    const canonicalOrigin = new URL(canonical).origin;

    const alternates = tags(page, 'link').filter((tag) =>
      attribute(tag, 'rel') === 'alternate' && attribute(tag, 'hreflang'));
    assert.ok(alternates.length > 0, path + ': missing hreflang');
    for (const alternate of alternates) {
      assert.match(attribute(alternate, 'href') ?? '', /^https:\/\//, path + ': hreflang must be absolute');
    }

    for (const [name, key] of [['og:image', 'property'], ['twitter:image', 'name']]) {
      const image = attribute(namedTag(page, 'meta', key, name), 'content');
      assert.match(image ?? '', /^https:\/\//, path + ': ' + name + ' must be absolute');
      assert.equal(new URL(image).origin, canonicalOrigin, path + ': ' + name + ' must use the site origin');
      assert.match(new URL(image).pathname, /\/assets\/images\/logo\/logo-libresign-large\.png$/);
    }
  }
});

test('rendered technical guide links are styled and external docs open safely', () => {
  for (const path of ['index.html', 'faq/index.html', 'tecnical-details/index.html']) {
    const anchors = tags(html(path), 'a');
    assert.ok(anchors.some((tag) =>
      /posts\/libresign-api-guide/.test(attribute(tag, 'href') ?? '') &&
      /\bud-btn-solid-brand\b/.test(attribute(tag, 'class') ?? '')
    ), path + ': missing styled API guide action');
  }

  for (const path of ['faq/index.html', 'tecnical-details/index.html']) {
    const anchors = tags(html(path), 'a');
    assert.ok(anchors.some((tag) =>
      attribute(tag, 'href') === 'https://docs.libresign.coop/' &&
      /\bud-btn-outline-brand\b/.test(attribute(tag, 'class') ?? '') &&
      attribute(tag, 'target') === '_blank' &&
      attribute(tag, 'rel') === 'noopener noreferrer'
    ), path + ': missing safely opened documentation action');
  }
});
