import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMenuLink, validateMenuLink } from '../src/utils/menuLinks.ts';

test('legacy links and anchors resolve to home sections', () => {
  for (const section of ['plans', 'faq', 'contact']) assert.equal(normalizeMenuLink(`/${section}`), `/#${section}`);
  assert.equal(normalizeMenuLink(' #plans '), '/#plans');
  assert.equal(normalizeMenuLink('/page/about-us'), '/page/about-us');
});

for (const link of ['/', '/consultations', '/#plans', '#faq', '/page/about-us', 'https://example.com/path?q=1', 'http://localhost:5100/', 'tel:+982112345678', 'mailto:hello@example.com']) {
  test(`allows valid destination: ${link}`, () => assert.equal(validateMenuLink(link), null));
}

for (const link of ['', '#', '/#', '/page/', '/page/--', 'javascript:alert(1)', 'data:text/html,test', '//example.com', '/%2fevil.com', '/%5cevil.com', '/hello%0dworld', '/hello\nworld', '/hello\\world', 'https://', 'https:example.com', 'https://user:pass@example.com', 'https://example.com/a b', 'tel:abc', 'mailto:no-address', '/'.repeat(201)]) {
  test(`rejects unsafe or incomplete destination: ${JSON.stringify(link)}`, () => assert.ok(validateMenuLink(link)));
}
