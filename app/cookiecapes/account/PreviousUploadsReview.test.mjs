import { expect, test } from "bun:test";

test("pending reviews auto-open, retain dismissed drafts, and save only after confirmation", () => {
  const result = Bun.spawnSync([process.execPath, "--eval", `
    import assert from "node:assert/strict";
    import { mock } from "bun:test";
    import { JSDOM } from "jsdom";
    const dom = new JSDOM('<div id="root"></div>', { url: "https://example.invalid" });
    for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'NodeFilter', 'MutationObserver', 'CustomEvent', 'Event', 'MouseEvent', 'FocusEvent', 'DocumentFragment']) {
      Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
    }
    globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
    globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
    globalThis.cancelAnimationFrame = clearTimeout;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const { default: React, act } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { translations } = await import('./app/cookiecapes/i18n/messages.ts');
    let locale = 'en';
    mock.module('@/app/cookiecapes/i18n/client', () => ({ useTranslations: () => translations(locale) }));
    mock.module('./app/cookiecapes/components/CapeViewer.tsx', () => ({ default: () => React.createElement('div', {}, '3D preview') }));
    const saves = [];
    let saveResult = { error: 'Review expired; reload' };
    let finishSave;
    mock.module('@/app/actions/account-actions', () => ({ reviewLegacyCapes: (id, ids) => {
      saves.push({ id, ids });
      return new Promise(resolve => { finishSave = () => resolve(saveResult); });
    } }));
    mock.module('@/components/ui/toast', () => ({ toast: { add() {} } }));
    const { default: Review } = await import('./app/cookiecapes/account/PreviousUploadsReview.tsx');
    const owned = {
      review: { id: 'review-1', snapshot: [{ cape_id: 2, revision: 1 }, { cape_id: 3, revision: 1 }] },
      capes: [2, 3, 4].map(id => ({ cape_id: id, cape_name: 'Cape ' + id, last_edited: '2026-10-29', hidden_at: null })),
    };
    let reviewed = 0;
    let reloads = 0;
    const props = { owned, disabled: false, minecraftName: 'Player', onReviewed: () => reviewed++, onReload: () => reloads++ };
    const root = createRoot(document.getElementById('root'));
    const flush = () => new Promise(resolve => setTimeout(resolve, 20));
    const render = async extra => act(async () => { root.render(React.createElement(Review, { ...props, ...extra })); await flush(); });
    const click = async button => { assert.ok(button, 'button exists'); await act(async () => { button.click(); await flush(); }); };
    const button = (text, scope = document) => [...scope.querySelectorAll('button')].find(item => item.textContent.trim() === text);
    const dialog = () => document.querySelector('[role="dialog"]');
    await render();
    assert.ok(dialog(), 'pending review opens immediately');
    assert.ok(dialog().contains(document.activeElement), 'focus enters modal');
    assert.equal(document.querySelector('input[type="checkbox"]'), null);
    assert.equal(dialog().querySelectorAll('article').length, 2, 'only snapshot capes appear');
    await click(button('Hide', dialog().querySelector('article')));
    assert.match(dialog().textContent, /1 to keep · 1 to hide/);
    await click(button('Review later', dialog()));
    assert.equal(dialog(), null);
    assert.equal(saves.length, 0, 'dismissal does not save');
    assert.equal(document.activeElement, button('Review previous uploads'), 'focus returns to reopen trigger');
    await click(button('Review previous uploads'));
    assert.match(dialog().textContent, /1 to keep · 1 to hide/, 'draft survives dismissal');
    await render({ owned: { ...owned, review: { ...owned.review, id: 'review-2' } } });
    assert.match(dialog().textContent, /1 to keep · 1 to hide/, 'same snapshot refresh preserves draft');
    await click(button('Review selection'));
    assert.equal(saves.length, 0, 'summary does not save');
    assert.match(dialog().textContent, /Cape 2/);
    await click(button('Back to selection'));
    await click(button('Keep all'));
    assert.match(dialog().textContent, /2 to keep · 0 to hide/);
    for (const article of dialog().querySelectorAll('article')) await click(button('Hide', article));
    await click(button('Review selection'));
    await click(button('Confirm selection'));
    assert.deepEqual(saves, [{ id: 'review-2', ids: [] }], 'uses latest review id and allows hiding all');
    assert.ok(dialog().querySelector('[aria-label="Review later"]').disabled, 'cannot dismiss while saving');
    await act(async () => { finishSave(); await flush(); });
    assert.match(dialog().querySelector('[role="alert"]').textContent, /Review expired/);
    assert.equal(reviewed, 0);
    await click(button('Reload'));
    assert.equal(reloads, 1);
    saveResult = { value: undefined };
    await click(button('Confirm selection'));
    await act(async () => { finishSave(); await flush(); });
    assert.equal(reviewed, 1);
    assert.equal(dialog(), null, 'success closes review');
    await render({ key: 'new-visit' });
    assert.ok(dialog(), 'pending review reopens on a new visit');
    await act(async () => { document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await flush(); });
    assert.equal(dialog(), null, 'Escape dismisses without saving');
    locale = 'de';
    await render({ key: 'incomplete', owned: { ...owned, capes: owned.capes.filter(c => c.cape_id !== 2) } });
    assert.ok(button('Auswahl prüfen').disabled, 'cannot submit an incomplete snapshot');
    assert.match(dialog().querySelector('[role="alert"]').textContent, /Einige Capes/);
    await act(async () => { root.unmount(); await flush(); });
    dom.window.close();
  `], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
  expect(new TextDecoder().decode(result.stderr)).not.toContain("AssertionError");
  expect(result.exitCode, new TextDecoder().decode(result.stderr)).toBe(0);
}, 60000);
