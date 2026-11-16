(() => {
  'use strict';
  const scene = document.querySelector('.noren-scene');
  const stage = document.querySelector('.noren-stage');
  const panels = [...document.querySelectorAll('.noren-panel')];
  const photo = document.querySelector('.noren-photo');
  const enter = document.querySelector('.noren-enter');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const light = /Line\//i.test(navigator.userAgent);
  const OPEN_DURATION = 1050;
  const WHEEL_GAP = 240;
  const WHEEL_REARM_DELAY = 450;
  const WHEEL_INTENT = 40;
  let frame = 0;
  let previousTime = 0;
  let progress = 0;
  let target = 0;
  let range = 1;
  let sceneTop = 0;
  let opening = null;
  let wheelHeld = false;
  let lastWheel = -Infinity;
  let wheelStarted = -Infinity;
  let wheelDirection = 0;
  let wheelAmount = 0;
  let wheelArmed = false;
  let wheelTrough = Infinity;
  let touch = null;
  let heldKey = '';
  const motionAllowed = () => !reduced.matches && !light;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const heroEnd = () => sceneTop + range;
  const canOpen = () => scene && stage && motionAllowed()
    && window.scrollY >= sceneTop - 2 && window.scrollY < heroEnd() - 2;
  const menuOpen = () => document.body.style.overflow === 'hidden';
  const isField = element => element?.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"],.drawer');
  const isControl = element => isField(element) || element?.closest?.('a,button');

  function paint() {
    panels.forEach((panel, i) => {
      const delay = [0.025, 0, 0.045, 0.015][i] || 0;
      const lifted = ease(clamp((progress - delay) / (1 - delay)));
      const sway = Math.sin(lifted * Math.PI);
      panel.style.transform = motionAllowed()
        ? `translate3d(0, ${-lifted * 115}%, 0) rotateX(${sway * 5}deg) rotateZ(${(i - 1) * sway * 1.2}deg)` : '';
    });
    if (photo) photo.style.transform = motionAllowed()
      ? `scale(${1.025 + ease(progress) * 0.045})` : '';
    if (enter) {
      enter.disabled = Boolean(opening);
      enter.querySelector('span').textContent = progress > .97 ? 'お店のことを見る' : '暖簾をくぐる';
    }
  }

  function animate(time) {
    frame = 0;
    if (opening) {
      // One gesture opens the whole cloth, independent of distance or force.
      const elapsed = clamp((time - opening.start) / OPEN_DURATION);
      const amount = ease(elapsed);
      window.scrollTo({top:opening.y + (heroEnd() - opening.y) * amount, behavior:'instant'});
      progress = target = opening.progress + (1 - opening.progress) * amount;
      if (elapsed === 1) opening = null;
      paint();
      if (opening) frame = requestAnimationFrame(animate);
      return;
    }
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
    previousTime = time;
    progress += (target - progress) * (1 - Math.exp(-elapsed / 95));
    if (Math.abs(target - progress) < .0001) progress = target;
    paint();
    if (progress !== target) frame = requestAnimationFrame(animate);
    else previousTime = 0;
  }

  function schedule() {
    if (!scene || !stage || !motionAllowed() || document.hidden || opening) return;
    // Also contain non-cancelable momentum events at the open HERO boundary.
    if (wheelHeld && performance.now() - lastWheel < WHEEL_GAP && window.scrollY > heroEnd()) {
      window.scrollTo({top:heroEnd(), behavior:'instant'});
    }
    target = clamp((window.scrollY - sceneTop) / range);
    if (!frame && target !== progress) frame = requestAnimationFrame(animate);
  }
  function measure(scheduleFrame = true) {
    if (!scene || !stage) return;
    sceneTop = scene.getBoundingClientRect().top + window.scrollY;
    range = Math.max(1, scene.offsetHeight - stage.offsetHeight);
    if (scheduleFrame) schedule();
  }
  function configure() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    opening = null;
    wheelHeld = false;
    lastWheel = wheelStarted = -Infinity;
    wheelDirection = wheelAmount = 0;
    wheelArmed = false;
    wheelTrough = Infinity;
    touch = null;
    heldKey = '';
    scene?.classList.toggle('motion-enabled', motionAllowed());
    if (enter) enter.hidden = !motionAllowed();
    measure(false);
    progress = target = motionAllowed() ? clamp((window.scrollY - sceneTop) / range) : 0;
    paint();
  }
  function openNoren() {
    if (opening || !canOpen()) return;
    cancelAnimationFrame(frame);
    previousTime = 0;
    opening = {start:performance.now(), y:window.scrollY, progress};
    paint();
    frame = requestAnimationFrame(animate);
  }

  window.addEventListener('wheel', event => {
    if (!motionAllowed() || menuOpen() || event.ctrlKey || event.metaKey
      || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const now = performance.now();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.offsetHeight : 1;
    const magnitude = Math.abs(event.deltaY) * unit;
    const direction = event.deltaY > 0 ? 1 : -1;

    if (!wheelHeld) {
      if (!opening && !(direction > 0 && canOpen())) return;
      event.preventDefault();
      wheelHeld = true;
      lastWheel = wheelStarted = now;
      wheelDirection = direction;
      wheelAmount = 0;
      wheelArmed = false;
      wheelTrough = Infinity;
      openNoren();
      return;
    }

    // macOS momentum can bridge separate swipes without an idle interval.
    // This is the renewed-force gate accepted on the OnO site (2026-11-12).
    const idle = now - lastWheel >= WHEEL_GAP;
    const reversed = direction !== wheelDirection && magnitude >= 8;
    if (idle || reversed) {
      wheelArmed = true;
      wheelAmount = 0;
      wheelTrough = Infinity;
    }
    lastWheel = now;
    if (idle || magnitude >= 8) wheelDirection = direction;
    if (!wheelArmed && now - wheelStarted >= WHEEL_REARM_DELAY) {
      // Ignore the first swipe's acceleration; recognize force after its tail.
      wheelTrough = Math.min(wheelTrough, magnitude);
      if (wheelTrough <= 8 && magnitude >= 12 && magnitude >= wheelTrough * 3) {
        wheelArmed = true;
        wheelAmount = 0;
      }
    }
    if (wheelArmed) wheelAmount += event.deltaY * unit;
    if (!opening && (idle || (wheelArmed && Math.abs(wheelAmount) >= WHEEL_INTENT))) {
      // Release the entire new gesture, not just its first event. No pointer
      // movement or hit-target change is needed to leave the open HERO.
      wheelHeld = false;
      wheelArmed = false;
      return;
    }
    event.preventDefault();
  }, {passive:false, capture:true});

  window.addEventListener('touchstart', event => {
    touch = event.touches.length === 1 && !menuOpen() && !isField(event.target)
      ? {x:event.touches[0].clientX, y:event.touches[0].clientY, blocked:false} : null;
  }, {passive:true});
  window.addEventListener('touchmove', event => {
    if (!touch || !motionAllowed() || menuOpen() || event.touches.length !== 1) return;
    const dy = touch.y - event.touches[0].clientY;
    const dx = touch.x - event.touches[0].clientX;
    if (touch.blocked || opening || (dy > 4 && Math.abs(dy) > Math.abs(dx) && canOpen())) {
      event.preventDefault();
      touch.blocked = true;
      openNoren();
    }
  }, {passive:false});
  const endTouch = () => { touch = null; };
  window.addEventListener('touchend', endTouch, {passive:true});
  window.addEventListener('touchcancel', endTouch, {passive:true});

  document.addEventListener('keydown', event => {
    if (!motionAllowed() || menuOpen() || isControl(event.target)
      || event.ctrlKey || event.metaKey || event.altKey) return;
    const down = ['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey;
    if (!down) {
      if (['Escape', 'Home', 'End', 'ArrowUp', 'PageUp', ' '].includes(event.key)) configure();
      return;
    }
    if (opening || (heldKey === event.key && event.repeat) || canOpen()) {
      event.preventDefault();
      heldKey = event.key;
      openNoren();
    }
  });
  document.addEventListener('keyup', event => { if (event.key === heldKey) heldKey = ''; });
  // Links and the mobile menu remain usable during the entrance animation.
  document.addEventListener('click', event => {
    if (event.target.closest?.('a[href],.nav-toggle')) configure();
  });
  window.addEventListener('hashchange', configure);
  enter?.addEventListener('click', () => {
    if (opening) return;
    if (canOpen()) openNoren();
    else document.getElementById('concept')?.scrollIntoView({behavior:'smooth'});
  });
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', measure, {passive:true});
  window.addEventListener('pageshow', configure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    } else configure();
  });
  reduced.addEventListener('change', configure);
  configure();

})();
