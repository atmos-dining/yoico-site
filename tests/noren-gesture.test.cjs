const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'home.js'), 'utf8');

function page({y = 0, reduced = false, line = false} = {}) {
  const events = {window: {}, document: {}};
  const frames = new Map();
  let id = 0, now = 0, sceneHeight = 1440;
  const listen = scope => (type, fn) => (events[scope][type] ||= []).push(fn);
  const fire = (scope, type, event = {}) => (events[scope][type] || []).forEach(fn => fn(event));
  const body = {style: {}, closest: () => null};
  const panels = Array.from({length: 4}, () => ({style: {}}));
  const photo = {style: {}};
  const label = {};
  const button = {querySelector: () => label, addEventListener: (type, fn) => button[type] = fn};
  const media = {matches: reduced, addEventListener: (_, fn) => media.change = fn};
  const classes = new Set();
  const scene = {get offsetHeight() {return sceneHeight;},
    getBoundingClientRect: () => ({top: -win.scrollY}),
    classList: {toggle(name, on) {on ? classes.add(name) : classes.delete(name);}}};
  const stage = {offsetHeight: 800};
  const concept = {scrollIntoView() {concept.visited = true;}};
  const win = {scrollY: y, addEventListener: listen('window'),
    scrollTo({top}) {win.scrollY = top; fire('window', 'scroll');}};
  const doc = {hidden: false, body, addEventListener: listen('document'),
    querySelector: selector => ({'.noren-scene': scene, '.noren-stage': stage, '.noren-photo': photo, '.noren-enter': button}[selector]),
    querySelectorAll: () => panels,
    getElementById: id => id === 'concept' ? concept : null};
  vm.runInNewContext(source, {window: win, document: doc, navigator: {userAgent: line ? 'Line/14' : 'Browser'},
    performance: {now: () => now}, matchMedia: () => media,
    requestAnimationFrame(fn) {frames.set(++id, fn); return id;}, cancelAnimationFrame: id => frames.delete(id),
    fetch: () => Promise.resolve({ok: true, json: () => ({posts: []})})});
  function advance(ms, hz = 60) {
    const end = now + ms;
    while (now < end) {
      now = Math.min(end, now + 1000 / hz);
      const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now));
    }
  }
  const event = extra => ({target: body, cancelable: true, defaultPrevented: false,
    preventDefault() {if (this.cancelable) this.defaultPrevented = true;}, ...extra});
  function wheel(deltaY, extra = {}) {
    const e = event({deltaY, deltaX: 0, ...extra}); fire('window', 'wheel', e);
    if (!e.defaultPrevented && !e.ctrlKey && !e.metaKey) win.scrollTo({top: Math.max(0, win.scrollY + deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stage.offsetHeight : 1))});
    return e;
  }
  function key(key, extra = {}) {const e = event({key, repeat: false, ...extra}); fire('document', 'keydown', e); return e;}
  function touch(type, y, extra = {}) {const e = event({touches: type === 'touchend' ? [] : [{clientX: 120, clientY: y}], ...extra}); fire('window', type, e); return e;}
  const lift = () => Number(panels[1].style.transform.match(/, (-?[\d.]+)%/)?.[1] || 0);
  return {win, doc, button, label, media, classes, panels, photo, concept, frames, advance, wheel, key, touch, fire, lift,
    resize(height) {sceneHeight = height; fire('window', 'resize');}};
}

test('weak and strong first wheel gestures both stop at the fully open HERO', () => {
  for (const distance of [1, 40, 800, 10000]) {
    const p = page(); assert(p.wheel(distance).defaultPrevented);
    p.advance(500); assert(p.win.scrollY > 0 && p.win.scrollY < 640);
    p.advance(700); assert.equal(p.win.scrollY, 640); assert.equal(p.lift(), -115);
    assert.equal(p.frames.size, 0); assert.equal(p.button.disabled, false);
    assert.equal(p.wheel(200).defaultPrevented, false); assert.equal(p.win.scrollY, 840);
  }
});

test('long trackpad momentum stays in the HERO until a separate gesture', () => {
  const p = page(); p.wheel(1800);
  for (let i = 0; i < 150; i++) {p.advance(16); assert(p.wheel(Math.max(0.2, 300 * Math.exp(-i / 15))).defaultPrevented);}
  assert.equal(p.win.scrollY, 640); assert.equal(p.lift(), -115);
  p.wheel(0.2, {cancelable: false}); assert.equal(p.win.scrollY, 640, 'non-cancelable tail is contained too');
  p.advance(250); assert.equal(p.wheel(300).defaultPrevented, false); assert.equal(p.win.scrollY, 940);
});

test('one swipe opens completely; holding that finger cannot enter the body', () => {
  for (const distance of [5, 650]) {
    const p = page(); p.touch('touchstart', 700); assert(p.touch('touchmove', 700 - distance).defaultPrevented);
    p.advance(1200); assert.equal(p.win.scrollY, 640);
    assert(p.touch('touchmove', 20).defaultPrevented);
    p.touch('touchend'); p.touch('touchstart', 700);
    assert.equal(p.touch('touchmove', 500).defaultPrevented, false);
    p.win.scrollTo({top: 840}); assert.equal(p.win.scrollY, 840);
  }
});

test('touch tap, horizontal swipe, pinch and menu interactions remain available', () => {
  const p = page(); p.touch('touchstart', 500);
  assert.equal(p.touch('touchmove', 499).defaultPrevented, false);
  assert.equal(p.touch('touchmove', 495, {touches: [{clientX: 250, clientY: 495}]}).defaultPrevented, false);
  p.touch('touchstart', 500, {touches: [{clientX: 100, clientY: 500}, {clientX: 200, clientY: 500}]});
  assert.equal(p.touch('touchmove', 300).defaultPrevented, false);
  assert.equal(p.wheel(50, {ctrlKey: true}).defaultPrevented, false);
  p.doc.body.style.overflow = 'hidden'; assert.equal(p.wheel(50).defaultPrevented, false);
  p.touch('touchstart', 500); assert.equal(p.touch('touchmove', 200).defaultPrevented, false);
});

test('keyboard hold stops at HERO, key release and another press can continue', () => {
  for (const key of ['ArrowDown', 'PageDown', ' ']) {
    const p = page(); assert(p.key(key).defaultPrevented); p.advance(1200);
    assert(p.key(key, {repeat: true}).defaultPrevented); assert.equal(p.win.scrollY, 640);
    p.fire('document', 'keyup', {key}); assert.equal(p.key(key).defaultPrevented, false);
  }
});

test('reverse and a fresh downward gesture work without moving the pointer', () => {
  const p = page(); p.wheel(600); p.advance(1200);
  assert.equal(p.wheel(-640).defaultPrevented, false); p.advance(1200); assert.equal(p.lift(), 0);
  assert(p.wheel(1).defaultPrevented); p.advance(1200); assert.equal(p.lift(), -115);
});

test('button opens first and visits the concept only on a second press', () => {
  const p = page(); p.button.click(); assert(p.button.disabled); p.button.click(); assert(!p.concept.visited);
  p.advance(1200); assert.equal(p.win.scrollY, 640); p.button.click(); assert(p.concept.visited);
});

test('navigation and End cancel the entrance instead of trapping the user', () => {
  for (const trigger of [p => p.fire('document', 'click', {target: {closest: () => ({})}}), p => p.key('End')]) {
    const p = page(); p.wheel(500); p.advance(300); trigger(p);
    p.win.scrollTo({top: 3000}); p.advance(1200); assert.equal(p.win.scrollY, 3000); assert(!p.button.disabled);
  }
});

test('restored scroll, reduced motion, resize and background restoration', () => {
  const restored = page({y: 2500}); assert.equal(restored.lift(), -115); assert(!restored.wheel(60).defaultPrevented);
  for (const options of [{reduced: true}]) {
    const p = page(options); assert(!p.wheel(20).defaultPrevented); assert(p.button.hidden); assert.equal(p.frames.size, 0);
  }
  const p = page(); p.wheel(200); p.advance(300); p.resize(1760); p.advance(900); assert.equal(p.win.scrollY, 960);
  p.win.scrollTo({top: 0}); p.advance(1200); p.wheel(40); p.advance(300);
  p.doc.hidden = true; p.fire('document', 'visibilitychange'); assert.equal(p.frames.size, 0);
  p.doc.hidden = false; p.fire('document', 'visibilitychange'); assert(!p.button.disabled);
  p.wheel(1); p.advance(1200); assert.equal(p.win.scrollY, 960);
  p.media.matches = true; p.media.change(); assert(p.button.hidden); assert.equal(p.panels[1].style.transform, '');
});

test('opening takes the same time at 60 and 120 Hz', () => {
  const samples = [60, 120].map(hz => {const p = page(); p.wheel(50); p.advance(525, hz); return [p.win.scrollY, p.lift()];});
  assert(Math.abs(samples[0][0] - samples[1][0]) < 0.01); assert(Math.abs(samples[0][1] - samples[1][1]) < 0.01);
});

test('renewed downward swipe releases HERO even when momentum never becomes idle', () => {
  const p = page(); p.wheel(100);
  for (let i = 0; i < 140; i++) {p.advance(8); p.wheel(Math.max(2, 100 * Math.exp(-i / 20)));}
  assert.equal(p.win.scrollY, 640);
  p.advance(8); p.wheel(20);
  p.advance(8); p.wheel(20);
  assert(p.win.scrollY > 640, 'second intentional swipe must escape the old momentum gate');
  const previous = p.win.scrollY;
  p.advance(8); p.wheel(2);
  assert(p.win.scrollY > previous, 'the rest of the released gesture must stay native');
});

test('OnO physical-trace sample interpolation does not require an idle gap or pointer movement', () => {
  // Magnitudes/timings from the accepted 2026-11-12 OnO fixed-pointer report.
  // Interpolated samples, not an exact replay of all 637 original events.
  const samples = [[398965,1],[399211,55],[399462,22],[399712,6],[399962,2],[400403,22],[400662,25],[400912,7],[401161,2],[401620,46],[401873,30],[402123,9],[402373,3],[402825,12],[403078,38],[403328,11],[403578,3],[403887,1],[404170,50],[404437,18],[404686,32],[404961,52]];
  const p = page(); let last = samples[0][0];
  for (let i = 0; i < samples.length - 1; i++) {
    const [start, first] = samples[i], [end, next] = samples[i + 1];
    for (let time = start; time < end; time += 8) {
      p.advance(time - last); last = time;
      p.wheel(first + (next - first) * (time - start) / (end - start), {clientX:612, clientY:398});
    }
  }
  assert(p.win.scrollY > 640, 'continuous physical-style swipes must scroll past HERO');
});

test('initial acceleration and one long decaying fling never count as a second swipe', () => {
  const p = page(); p.wheel(1);
  for (let time = 8; time <= 3000; time += 8) {
    p.advance(8);
    const amount = time < 200 ? time / 2 : Math.max(0.2, 100 * Math.exp(-(time - 200) / 240));
    assert(p.wheel(amount).defaultPrevented);
  }
  assert.equal(p.win.scrollY, 640);
});

test('new force during opening stays armed until the cloth finishes opening', () => {
  const p = page(); p.wheel(100);
  for (let time = 8; time < 600; time += 8) {p.advance(8); p.wheel(2);}
  p.advance(8); p.wheel(20); p.advance(8); p.wheel(20);
  assert(p.win.scrollY < 640, 'the HERO must finish opening before release');
  for (let time = 0; time < 600; time += 8) {p.advance(8); p.wheel(2);}
  assert(p.win.scrollY > 640, 'queued intentional input survives the animation');
});

test('no-idle reversal and line/page delta units release intentional input', () => {
  for (const extra of [{deltaMode:0,delta:20},{deltaMode:1,delta:3},{deltaMode:2,delta:0.1}]) {
    const p = page(); p.wheel(100);
    for (let i = 0; i < 150; i++) {p.advance(8); p.wheel(2);}
    p.advance(8); p.wheel(extra.delta, {deltaMode:extra.deltaMode});
    p.advance(8); p.wheel(extra.delta, {deltaMode:extra.deltaMode});
    assert(p.win.scrollY > 640);
  }
  const p = page(); p.wheel(100);
  for (let i = 0; i < 150; i++) {p.advance(8); p.wheel(2);}
  p.advance(8); p.wheel(-20); p.advance(8); p.wheel(-20);
  assert(p.win.scrollY < 640);
});

// Regression: LINE used to be excluded explicitly by user-agent sniffing.
test('LINE swipe opens fully and releases the next touch gesture', () => {
  const p = page({line: true});
  assert(p.classes.has('motion-enabled'));
  assert.equal(p.button.hidden, false);
  p.touch('touchstart', 700);
  assert(p.touch('touchmove', 600).defaultPrevented);
  p.advance(1200);
  assert.equal(p.lift(), -115);
  assert.equal(p.win.scrollY, 640);
  p.touch('touchend'); p.touch('touchstart', 700);
  assert.equal(p.touch('touchmove', 500).defaultPrevented, false);
});
test('LINE tap opens the curtain and second tap reaches content', () => {
  const p = page({line: true});
  assert.equal(p.button.hidden, false);
  p.button.click(); p.advance(1200);
  assert.equal(p.lift(), -115);
  p.button.click(); assert(p.concept.visited);
});
