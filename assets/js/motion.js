/* ============================================================
   Michael Searle — motion study
   The scroll and cursor behaviour of a Resn-style experience,
   written by hand. No libraries, no build step.

   1. plumbing        2. smooth scroll      3. pinned scenes
   4. the cursor field on type              5. the cursor itself
   6. magnetic targets 7. parallax          8. velocity marquee
   ============================================================ */

(function () {
  'use strict';

  var root   = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine   = window.matchMedia('(hover: hover) and (pointer: fine)');

  var motion = !reduce.matches;
  var smooth = motion && fine.matches;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ease(t) { return t * t * (3 - 2 * t); }          /* smoothstep */

  var vw = window.innerWidth;
  var vh = window.innerHeight;

  var scroll = { target: 0, current: 0, velocity: 0 };
  var mouse  = { x: vw / 2, y: vh / 2, ex: vw / 2, ey: vh / 2, live: false };

  /* ---------- 2. smooth scroll ------------------------------
     The page is a fixed sheet that we translate ourselves, with
     an empty div behind it holding the real scroll height. That
     one indirection is what buys the weight and the overrun —
     the page arrives a beat after the wheel stops.
     ---------------------------------------------------------- */

  var canvas = document.querySelector('[data-canvas]');
  var spacer = document.querySelector('[data-spacer]');

  if (smooth) root.classList.add('has-smooth');
  if (!motion) root.classList.add('no-motion');

  function measurePage() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    if (smooth) spacer.style.height = canvas.getBoundingClientRect().height + 'px';
  }

  function offset() { return smooth ? scroll.current : (window.scrollY || 0); }

  window.addEventListener('scroll', function () {
    scroll.target = window.scrollY || 0;
  }, { passive: true });

  /* Tabbing to something off screen must still bring it into view,
     which the browser cannot do for us once the sheet is fixed. */
  document.addEventListener('focusin', function (e) {
    if (!smooth || !e.target.getBoundingClientRect) return;
    var r = e.target.getBoundingClientRect();
    if (r.top > 80 && r.bottom < vh - 80) return;
    window.scrollTo(0, clamp(r.top + scroll.current - vh * 0.4, 0, spacer.offsetHeight - vh));
  });

  /* Anchors, by hand, for the same reason. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a || !smooth) return;
    var id = a.getAttribute('href').slice(1);
    var el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    window.scrollTo(0, clamp(el.getBoundingClientRect().top + scroll.current - 40, 0, spacer.offsetHeight - vh));
  });

  /* ---------- 4a. split the type into characters ------------ */

  var fields = [];

  function split(el) {
    var text = el.textContent;
    var chars = [];
    var frag = document.createDocumentFragment();

    text.split(/(\s+)/).forEach(function (chunk) {
      if (!chunk) return;
      if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(' ')); return; }
      var word = document.createElement('span');
      word.className = 'word';
      chunk.split('').forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        word.appendChild(s);
        chars.push({ el: s, x: 0, y: 0, f: 0 });
      });
      frag.appendChild(word);
    });

    el.textContent = '';
    el.appendChild(frag);
    el.setAttribute('aria-label', text.trim());

    fields.push({
      el: el,
      chars: chars,
      radius: parseFloat(el.dataset.radius) || 190,
      push:   parseFloat(el.dataset.push)   || 12,
      wght:   (el.dataset.wght   || '200 800').split(' ').map(Number),
      wdth:   (el.dataset.wdth   || '86 118').split(' ').map(Number)
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-field]'), split);

  /* Positions are cached against the page, not the viewport, so a
     frame costs arithmetic instead of layout. Re-read on resize
     with the transforms stripped, or we measure our own effect. */
  function measureFields() {
    var y = offset();
    fields.forEach(function (f) {
      f.chars.forEach(function (c) { c.el.style.transform = ''; c.el.style.fontVariationSettings = ''; });
    });
    fields.forEach(function (f) {
      f.chars.forEach(function (c) {
        var r = c.el.getBoundingClientRect();
        c.x = r.left + r.width / 2;
        c.y = r.top + r.height / 2 + y;
      });
    });
  }

  /* ---------- 3. pinned scenes ------------------------------ */

  var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-scene]')).map(function (el) {
    return { el: el, pin: el.querySelector('[data-pin]'), steps: el.querySelectorAll('[data-step]') };
  });

  /* ---------- 7. parallax ----------------------------------- */

  var floats = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  /* ---------- 8. marquee ------------------------------------ */

  var marquees = Array.prototype.slice.call(document.querySelectorAll('[data-marquee]')).map(function (el) {
    var run = el.firstElementChild;
    el.appendChild(run.cloneNode(true));
    return { el: el, track: el, x: 0, w: 0, speed: parseFloat(el.dataset.marquee) || 0.5 };
  });

  function measureMarquees() {
    marquees.forEach(function (m) { m.w = m.el.firstElementChild.getBoundingClientRect().width; });
  }

  /* ---------- 5. the cursor --------------------------------- */

  var cursor = document.querySelector('[data-cursor]');
  var label  = cursor ? cursor.querySelector('.cursor__label') : null;

  if (fine.matches && cursor) {
    root.classList.add('has-cursor');

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!mouse.live) { mouse.ex = mouse.x; mouse.ey = mouse.y; mouse.live = true; root.classList.add('cursor-on'); }
    }, { passive: true });

    document.addEventListener('mouseleave', function () { root.classList.remove('cursor-on'); });
    document.addEventListener('mouseenter', function () { if (mouse.live) root.classList.add('cursor-on'); });

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cue], a, button') : null;
      cursor.classList.toggle('is-wide', !!t);
      if (label) label.textContent = (t && t.dataset && t.dataset.cue) ? t.dataset.cue : '';
    });

    window.addEventListener('mousedown', function () { cursor.classList.add('is-down'); });
    window.addEventListener('mouseup',   function () { cursor.classList.remove('is-down'); });
  }

  /* ---------- 6. magnetic targets --------------------------- */

  var magnets = Array.prototype.slice.call(document.querySelectorAll('[data-magnetic]')).map(function (el) {
    return { el: el, strength: parseFloat(el.dataset.magnetic) || 0.35, x: 0, y: 0, tx: 0, ty: 0 };
  });

  /* ---------- the one frame loop ---------------------------- */

  function frame() {
    /* scroll */
    var prev = scroll.current;
    if (smooth) {
      scroll.current += (scroll.target - scroll.current) * 0.095;
      if (Math.abs(scroll.target - scroll.current) < 0.06) scroll.current = scroll.target;
      canvas.style.transform = 'translate3d(0,' + (-scroll.current).toFixed(2) + 'px,0)';
    } else {
      scroll.current = window.scrollY || 0;
    }
    scroll.velocity = scroll.current - prev;

    var y = scroll.current;
    var v = clamp(scroll.velocity, -140, 140);

    root.style.setProperty('--velocity', (v / 140).toFixed(3));

    /* pointer, chasing */
    mouse.ex += (mouse.x - mouse.ex) * 0.16;
    mouse.ey += (mouse.y - mouse.ey) * 0.16;

    /* 4b. the cursor field on type ------------------------------
       Every character asks how close the pointer is, and answers
       on the variable axes of the typeface: it fattens, widens and
       leans out of the way. Archivo carries wght and wdth, so the
       letter reshapes rather than merely moving. */
    if (motion) {
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        var r = f.radius;
        for (var j = 0; j < f.chars.length; j++) {
          var c = f.chars[j];
          var dx = mouse.ex - c.x;
          var dy = mouse.ey - (c.y - y);
          var d  = Math.sqrt(dx * dx + dy * dy);
          var t  = d > r ? 0 : ease(1 - d / r);
          c.f += (t - c.f) * 0.18;
          if (c.f < 0.002) {
            if (c.el.style.transform) { c.el.style.transform = ''; c.el.style.fontVariationSettings = ''; }
            continue;
          }
          var k = c.f;
          var n = d || 1;
          c.el.style.fontVariationSettings =
            "'wght' " + (f.wght[0] + (f.wght[1] - f.wght[0]) * k).toFixed(0) +
            ",'wdth' " + (f.wdth[0] + (f.wdth[1] - f.wdth[0]) * k).toFixed(0);
          c.el.style.transform =
            'translate3d(' + (-dx / n * f.push * k).toFixed(2) + 'px,' +
            (-dy / n * f.push * k - k * 4).toFixed(2) + 'px,0)';
        }
      }
    }

    /* 3. scenes */
    for (var s = 0; s < scenes.length; s++) {
      var sc = scenes[s];
      var rect = sc.el.getBoundingClientRect();
      var span = rect.height - vh;
      if (span <= 0) continue;
      var p = clamp(-rect.top / span, 0, 1);
      sc.el.style.setProperty('--p', p.toFixed(4));
      if (motion && sc.pin) sc.pin.style.transform = 'translate3d(0,' + clamp(-rect.top, 0, span).toFixed(2) + 'px,0)';
      if (sc.steps.length) {
        var active = Math.min(sc.steps.length - 1, Math.floor(p * sc.steps.length * 0.999));
        for (var q = 0; q < sc.steps.length; q++) sc.steps[q].classList.toggle('is-on', q === active);
      }
    }

    /* 7. parallax, and the shear that sells the weight */
    if (motion) {
      for (var p2 = 0; p2 < floats.length; p2++) {
        var el = floats[p2];
        var fr = el.getBoundingClientRect();
        var mid = (fr.top + fr.height / 2 - vh / 2) / vh;
        var str = parseFloat(el.dataset.parallax);
        if (isNaN(str)) str = 40;
        var skew = el.hasAttribute('data-shear') ? ' skewY(' + (v * 0.012).toFixed(3) + 'deg)' : '';
        el.style.transform = 'translate3d(0,' + (-mid * str).toFixed(2) + 'px,0)' + skew;
      }
    }

    /* 8. marquee — scroll drives it, and reverses it */
    for (var m = 0; m < marquees.length; m++) {
      var mq = marquees[m];
      if (!mq.w) continue;
      mq.x -= mq.speed + v * 0.35;
      if (mq.x <= -mq.w) mq.x += mq.w;
      if (mq.x > 0) mq.x -= mq.w;
      mq.el.style.transform = 'translate3d(' + mq.x.toFixed(2) + 'px,0,0)';
    }

    /* 6. magnets */
    for (var g = 0; g < magnets.length; g++) {
      var mg = magnets[g];
      var mr = mg.el.getBoundingClientRect();
      var cx = mr.left + mr.width / 2;
      var cy = mr.top + mr.height / 2;
      var reach = Math.max(mr.width, mr.height) * 1.1;
      var ddx = mouse.x - cx, ddy = mouse.y - cy;
      var dd = Math.sqrt(ddx * ddx + ddy * ddy);
      var on = motion && fine.matches && dd < reach;
      mg.tx = on ? ddx * mg.strength : 0;
      mg.ty = on ? ddy * mg.strength : 0;
      mg.x += (mg.tx - mg.x) * 0.18;
      mg.y += (mg.ty - mg.y) * 0.18;
      mg.el.style.transform = 'translate3d(' + mg.x.toFixed(2) + 'px,' + mg.y.toFixed(2) + 'px,0)';
      mg.el.classList.toggle('is-pulled', on);
    }

    /* 5. the cursor last, so it sits on top of its own frame */
    if (cursor && mouse.live) {
      cursor.style.transform = 'translate3d(' + mouse.ex.toFixed(2) + 'px,' + mouse.ey.toFixed(2) + 'px,0)';
      var dot = cursor.querySelector('.cursor__dot');
      if (dot) dot.style.transform = 'translate3d(' + (mouse.x - mouse.ex).toFixed(2) + 'px,' + (mouse.y - mouse.ey).toFixed(2) + 'px,0)';
    }

    requestAnimationFrame(frame);
  }

  /* ---------- boot ------------------------------------------ */

  function measureAll() { measurePage(); measureFields(); measureMarquees(); }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureAll, 150);
  });

  if ('ResizeObserver' in window && smooth) {
    new ResizeObserver(function () { measurePage(); }).observe(canvas);
  }

  var started = false;

  function start() {
    if (started) return;
    started = true;
    root.classList.remove('is-loading');
    measureAll();
    scroll.target = scroll.current = window.scrollY || 0;
    requestAnimationFrame(frame);
    /* images land late and move everything under them */
    Array.prototype.forEach.call(document.images, function (img) {
      if (!img.complete) img.addEventListener('load', measureAll, { once: true });
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
    setTimeout(start, 1600);
  } else {
    window.addEventListener('load', start);
  }
}());
