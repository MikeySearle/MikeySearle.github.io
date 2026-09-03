/* ============================================================
   Enquiry form
   The human check and the honeypot run here, in the browser.
   Where the answers go is set by ENDPOINT below.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     WHERE THE ANSWERS GO

     Left empty, the form opens your mail app with everything filled in
     and addressed to you. That works with no setup, but the sender has
     to press send in their own mail client.

     For answers to arrive in your inbox on their own, get a free
     endpoint from formspree.io or web3forms.com and paste it here.
     Nothing else needs to change.
  ------------------------------------------------------------------ */
  var ENDPOINT = '';
  var TO       = 'searlecamera@gmail.com';

  var form   = document.getElementById('enquiry-form');
  var error  = document.getElementById('form-error');
  var note   = document.getElementById('form-note');
  var sent   = document.getElementById('sent');
  var sentBody = document.getElementById('sent-body');
  var loadedAt = Date.now();

  document.documentElement.classList.remove('is-loading');
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- human check ---------- */

  var WORDS = ['zero','one','two','three','four','five','six','seven','eight',
               'nine','ten','eleven','twelve','thirteen','fourteen','fifteen',
               'sixteen','seventeen','eighteen'];

  var a = 2 + Math.floor(Math.random() * 8);
  var b = 2 + Math.floor(Math.random() * 8);
  var answer = a + b;

  document.getElementById('human-question').textContent =
    'What is ' + WORDS[a] + ' plus ' + WORDS[b] + '?';

  function humanOK(raw) {
    var v = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!v) return false;
    if (v === String(answer)) return true;
    return v === WORDS[answer];
  }

  /* ---------- helpers ---------- */

  function val(name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  function checked() {
    return [].filter.call(form.querySelectorAll('input[name="need"]'), function (i) {
      return i.checked;
    }).map(function (i) { return i.value; }).join(', ');
  }

  function fail(message, focusId) {
    error.textContent = message;
    error.hidden = false;
    var el = focusId && document.getElementById(focusId);
    if (el) el.focus();
  }

  function clearError() {
    error.hidden = true;
    error.textContent = '';
  }

  function fields() {
    return [
      ['Name',         val('name')],
      ['Organisation', val('organisation')],
      ['Email',        val('email')],
      ['Their role',   val('role')],
      ['Needs',        checked()],
      ['Location',     val('location')],
      ['Timing',       val('timing')],
      ['Budget',       val('budget')],
      ['Found me via', val('heard')],
      ['Brief',        val('brief')]
    ];
  }

  function asText() {
    return fields().filter(function (f) { return f[1]; })
      .map(function (f) { return f[0] + ': ' + f[1]; })
      .join('\n\n');
  }

  function finish(message) {
    form.hidden = true;
    sent.hidden = false;
    sentBody.textContent = message;
    sent.scrollIntoView({ block: 'center' });
  }

  /* ---------- submit ---------- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    /* a bot filled the field nobody can see */
    if (val('website')) return;

    /* nobody reads and completes this in under three seconds */
    if (Date.now() - loadedAt < 3000) {
      return fail('That was quick. Give it a moment and send again.', 'f-name');
    }

    if (!val('name'))  return fail('Please add your name.', 'f-name');
    if (!val('email') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) {
      return fail('Please check the email address.', 'f-email');
    }
    if (!val('brief')) return fail('Please say a little about the film.', 'f-brief');
    if (!humanOK(val('human'))) {
      return fail('The human check did not match. Have another go.', 'f-human');
    }

    var subject = 'Enquiry from ' + val('name') +
                  (val('organisation') ? ' at ' + val('organisation') : '');

    if (!ENDPOINT) {
      note.textContent = 'Opening your mail app…';
      var href = 'mailto:' + TO +
                 '?subject=' + encodeURIComponent(subject) +
                 '&body=' + encodeURIComponent(asText());
      window.location.href = href;
      finish('Your mail app should have opened with everything filled in. Press send there ' +
             'and it comes straight to me. If nothing opened, email ' + TO + ' directly.');
      return;
    }

    var button = form.querySelector('.submit');
    button.disabled = true;
    note.textContent = 'Sending…';

    var payload = { _subject: subject, subject: subject };
    fields().forEach(function (f) { payload[f[0]] = f[1]; });

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      finish('Your enquiry is with me. I will come back to you within a couple of days.');
    }).catch(function () {
      button.disabled = false;
      note.textContent = '';
      fail('That did not send. Please email ' + TO + ' instead — sorry.');
    });
  });

})();
