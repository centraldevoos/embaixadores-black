import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const code = readFileSync(new URL('./script.js', import.meta.url), 'utf8');

for (const [medium, expected] of [['reels', 'reels'], ['facebook', 'facebook']]) {
  test(`preserva o destino Tintim e mede página/CTA para ${medium}`, () => {
    const original = 'https://tintim.link/whatsapp/account/group';
    const events = [];
    let onClick;
    const button = {
      href: original,
      getAttribute(name) { return name === 'href' ? this.href : null; },
      setAttribute(name, value) { if (name === 'href') this.href = value; },
      addEventListener(name, fn) { if (name === 'click') onClick = fn; },
    };
    const storage = new Map();
    const sandbox = {
      URLSearchParams, window: { location: { search: `?utm_medium=${medium}&utm_campaign=teste` } },
      document: { querySelectorAll: () => [button] },
      sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      crypto: { randomUUID: () => 'b4a03a26-91ea-4d2d-a50c-b2c73a8f3a98' },
      navigator: { sendBeacon(url, payload) { events.push({ url, ...JSON.parse(payload) }); return true; } },
      fetch: () => { throw new Error('fallback desnecessário'); },
    };
    vm.runInNewContext(code, sandbox);
    assert.equal(button.href, `${original}?utm_medium=${medium}&utm_campaign=teste`);
    onClick();
    assert.deepEqual(events.map(({ source, event }) => ({ source, event })), [
      { source: expected, event: 'page_view' },
      { source: expected, event: 'group_click' },
    ]);
    assert.equal(events[0].sessionId, events[1].sessionId);
  });
}
