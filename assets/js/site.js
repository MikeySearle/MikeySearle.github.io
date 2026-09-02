/* ============================================================
   Michael Searle — site behaviour
   1. load-in          2. sticky masthead     3. reveal on scroll
   4. hover to develop 5. index readout       6. film viewer
   ============================================================ */

(function () {
  'use strict';

  var root   = document.documentElement;
  var films  = Array.prototype.slice.call(document.querySelectorAll('.film'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- 1. load-in ------------------------------------ */

  function reveal() { root.classList.remove('is-loading'); }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(reveal);
    setTimeout(reveal, 1400);            // never wait on a slow font host
  } else {
    window.addEventListener('load', reveal);
  }

  /* ---------- 2. sticky masthead ---------------------------- */

  var masthead = document.querySelector('.masthead');
  var hud      = document.querySelector('.hud');
  var ticking  = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    masthead.classList.toggle('is-stuck', y > 40);
    if (hud) {
      var nearEnd = y + window.innerHeight > document.body.scrollHeight - 160;
      hud.classList.toggle('is-hidden', y < 40 || nearEnd);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 3. reveal on scroll --------------------------- */

  var portrait = document.querySelector('.portrait');

  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    films.forEach(function (el) { io.observe(el); });
  } else {
    films.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* On touch there is no cursor to reward, so the middle of the screen does the
     rewarding instead: whatever sits there is in full colour, and every frame
     fades back to monochrome as it travels away from the centre. The strength
     rides on --dev, which the stylesheet reads inside its filters.          */

  if (!canHover.matches) {
    var developable = films
      .map(function (f) { return f.querySelector('.film__frame'); })
      .filter(Boolean);

    var portraitImg = portrait && portrait.querySelector('img');
    if (portraitImg) developable.push(portraitImg);

    if (reduce.matches) {
      /* No scroll-linked change; leave every frame in colour. */
      developable.forEach(function (el) { el.style.setProperty('--dev', '1'); });

    } else {
      var painting = false;

      var paint = function () {
        painting = false;
        var vh    = window.innerHeight;
        var mid   = vh / 2;
        var hot   = vh * 0.06;   // full colour only this close to the middle
        var cold  = vh * 0.28;   // fully monochrome by this far from it
        var BITE  = 1.35;        // >1 pulls the curve toward monochrome sooner

        developable.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var dev = 0;

          if (r.bottom > -80 && r.top < vh + 80) {
            var d = Math.abs(r.top + r.height / 2 - mid);
            var t = (cold - d) / (cold - hot);
            t = t < 0 ? 0 : (t > 1 ? 1 : t);
            dev = Math.pow(t * t * (3 - 2 * t), BITE);   // ease, then bias down
          }

          el.style.setProperty('--dev', dev.toFixed(3));
        });
      };

      var schedulePaint = function () {
        if (painting) return;
        painting = true;
        window.requestAnimationFrame(paint);
      };

      window.addEventListener('scroll', schedulePaint, { passive: true });
      window.addEventListener('resize', schedulePaint);
      window.addEventListener('orientationchange', schedulePaint);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedulePaint);
      paint();
    }
  }

  /* ---------- 4. hover to develop --------------------------- */
  /* The still develops instantly. The film itself is only faded in once
     YouTube reports it is actually playing, so the player's own loading
     chrome never shows through the frame.                             */

  var PREVIEW_DELAY = 3000;     // hold the cursor this long before a film plays
  var apiState = 0;             // 0 idle, 1 loading, 2 ready
  var apiQueue = [];

  function withYouTubeAPI(fn) {
    if (apiState === 2) { fn(); return; }
    apiQueue.push(fn);
    if (apiState !== 0) return;
    apiState = 1;
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = function () { apiState = 0; apiQueue.length = 0; };
    document.head.appendChild(s);
  }

  window.onYouTubeIframeAPIReady = function () {
    apiState = 2;
    apiQueue.splice(0).forEach(function (fn) { fn(); });
  };

  if (canHover.matches && !reduce.matches) {
    films.forEach(function (film) {
      var id    = film.getAttribute('data-video');
      var stage = film.querySelector('.film__stage');
      if (!id || id === 'PASTE_ID' || !stage) return;

      var timer  = null;
      var poll   = null;
      var player = null;
      var wanted = false;

      function live() {
        if (wanted) stage.classList.add('is-live');
        clearInterval(poll);
      }

      /* onStateChange is the signal; the playhead poll is the safety net for
         browsers where the postMessage handshake drops an event. */
      function watch() {
        clearInterval(poll);
        poll = setInterval(function () {
          if (!wanted || !player || !player.getCurrentTime) { clearInterval(poll); return; }
          try { if (player.getCurrentTime() > 0.15) live(); } catch (err) { clearInterval(poll); }
        }, 400);
      }

      function build() {
        if (player || !wanted) return;
        var slot = document.createElement('div');
        stage.appendChild(slot);

        player = new window.YT.Player(slot, {
          videoId: id,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: id,
            modestbranding: 1, playsinline: 1, rel: 0, fs: 0,
            disablekb: 1, iv_load_policy: 3, origin: window.location.origin
          },
          events: {
            onReady: function (e) { e.target.mute(); e.target.playVideo(); watch(); },
            onStateChange: function (e) {
              if (e.data === window.YT.PlayerState.PLAYING) live();
            }
          }
        });
      }

      function teardown() {
        clearInterval(poll);
        stage.classList.remove('is-live');
        setTimeout(function () {
          if (wanted) return;
          if (player && player.destroy) { try { player.destroy(); } catch (err) {} }
          player = null;
          stage.innerHTML = '';
        }, 700);
      }

      film.addEventListener('pointerenter', function () {
        wanted = true;
        clearTimeout(timer);
        timer = setTimeout(function () { withYouTubeAPI(build); }, PREVIEW_DELAY);
      });

      film.addEventListener('pointerleave', function () {
        wanted = false;
        clearTimeout(timer);
        teardown();
      });
    });
  }

  /* ---------- 5. index readout ------------------------------ */

  var hudValue = document.getElementById('hud-value');
  var total    = films.length;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  if (hudValue) {
    hudValue.textContent = pad(total);
    films.forEach(function (film, i) {
      film.addEventListener('pointerenter', function () {
        hudValue.textContent = pad(i + 1) + ' / ' + pad(total);
      });
      film.addEventListener('pointerleave', function () {
        hudValue.textContent = pad(total);
      });
    });
  }

  /* ---------- 6. film viewer -------------------------------- */

  var viewer  = document.getElementById('viewer');
  var mount   = document.getElementById('viewer-mount');
  var slate   = document.getElementById('viewer-slate');
  var closeEl = document.getElementById('viewer-close');
  var lastFocus = null;

  function open(id, client, title) {
    lastFocus = document.activeElement;

    mount.innerHTML = '';
    var frame = document.createElement('iframe');
    frame.setAttribute('title', client + ' — ' + title);
    frame.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
    frame.setAttribute('allowfullscreen', '');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + id +
                '?autoplay=1&rel=0&modestbranding=1&playsinline=1' +
                '&origin=' + encodeURIComponent(window.location.origin);
    mount.appendChild(frame);

    slate.innerHTML = '<b>' + client + '</b> &nbsp;&mdash;&nbsp; ' + title;

    viewer.hidden = false;
    document.body.classList.add('is-locked');
    window.requestAnimationFrame(function () { viewer.classList.add('is-open'); });
    closeEl.focus();
  }

  function close() {
    viewer.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () {
      viewer.hidden = true;
      mount.innerHTML = '';
    }, 450);
    if (lastFocus) lastFocus.focus();
  }

  films.forEach(function (film) {
    var id      = film.getAttribute('data-video');
    var trigger = film.querySelector('.film__trigger');
    var client  = (film.querySelector('.film__client') || {}).textContent || '';
    var title   = (film.querySelector('.film__title')  || {}).textContent || '';

    if (!trigger) return;

    trigger.setAttribute('aria-label', 'Play ' + client + ', ' + title);

    if (!id || id === 'PASTE_ID') {
      trigger.disabled = true;
      return;
    }
    trigger.addEventListener('click', function () { open(id, client, title); });
  });

  closeEl.addEventListener('click', close);

  viewer.addEventListener('click', function (e) {
    if (e.target === viewer || e.target === viewer.querySelector('.viewer__stage')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (viewer.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { e.preventDefault(); closeEl.focus(); }
  });

  /* ---------- housekeeping ---------------------------------- */

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

})();
