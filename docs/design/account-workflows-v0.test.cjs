const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'account-workflows-v0.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously' });
const d = dom.window.document;
const keeps = [...d.querySelectorAll('.keep')];
assert.equal(keeps.filter(input => input.checked).length, 3);
keeps[0].checked = false;
keeps[0].dispatchEvent(new dom.window.Event('change'));
assert.equal(d.getElementById('counts').textContent, '2 to keep \u00b7 1 to hide');
assert.match(d.querySelector('.state').textContent, /Will be hidden/);
d.getElementById('keep-all').click();
assert.ok(keeps.every(input => input.checked));
d.querySelector('[data-view="linking"]').click();
assert.equal(d.getElementById('review').hidden, true);
assert.equal(d.getElementById('linking').hidden, false);
d.getElementById('mcid-continue').click();
assert.equal(d.getElementById('profiles').hidden, false);
d.querySelector('.profile-check').click();
assert.equal(d.getElementById('link-selected').disabled, false);
assert.equal(d.getElementById('profile-count').textContent, '1 selected');
d.querySelector('.profile-check').click();
assert.equal(d.getElementById('link-selected').disabled, true);
d.getElementById('result').value = 'empty';
d.getElementById('mcid-continue').click();
assert.equal(d.getElementById('no-profiles').hidden, false);
assert.equal(d.getElementById('profiles').hidden, true);
d.getElementById('retry').click();
assert.equal(d.getElementById('handoff').hidden, false);
assert.equal(d.getElementById('no-profiles').hidden, true);
for (const image of d.querySelectorAll('img')) {
  assert.ok(fs.existsSync(path.resolve(__dirname, image.getAttribute('src'))));
}
assert.ok(!html.includes('scrollIntoView'));
dom.window.close();
console.log('PASS: selection counts, keep-all, navigation, profile selection, empty recovery, local assets.');
