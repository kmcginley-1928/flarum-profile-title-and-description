// Keep the DOM‑only implementation. No direct compat dependency required.
(function () {
  'use strict';

  var EXT_ID = 'kmcginley-1928-profile-title-and-description';

  function getMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }

  function getCsrfToken() {
    try { if (window.app && window.app.session && window.app.session.csrfToken) return window.app.session.csrfToken; } catch (_) {}
    return getMeta('csrf-token') || getMeta('csrf') || null;
  }

  function currentProfileSlug() {
    var m = window.location.pathname.match(/\/u\/([^/?#]+)/i);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function isOnUserProfilePage() { return !!currentProfileSlug(); }
  function key() { return 'kmcginley1928-ptad-btn'; }
  function alreadyInjected() { return !!document.getElementById(key()); }

  function createButton() {
    var btn = document.createElement('button');
    btn.id = key();
    btn.type = 'button';
    btn.textContent = 'Edit profile info';
    btn.style.cssText = 'cursor:pointer;padding:6px 10px;font-size:14px;border-radius:4px;border:1px solid #0a7cff;background:#0a7cff;color:#fff;margin:8px 0 0 8px;white-space:nowrap';
    return btn;
  }

  function findProfileHeaderContainer() {
    var sels = ['.UserHero .container','.UserHero','.Hero .container','.UserCard','.UserPage','.UserPage .container','.App-content .container'];
    for (var i=0;i<sels.length;i++) { var el = document.querySelector(sels[i]); if (el) return el; }
    return null;
  }

  function injectButton() {
    var container = findProfileHeaderContainer();
    var btn = createButton();
    if (container) container.appendChild(btn);
    else {
      btn.style.position = 'fixed'; btn.style.bottom = '16px'; btn.style.right = '16px'; btn.style.zIndex = '2147483647';
      document.body.appendChild(btn);
    }
    return btn;
  }

  async function fetchUserBySlug(slug) {
    try {
      var r = await fetch('/api/users/' + encodeURIComponent(slug), { headers: { 'Accept': 'application/vnd.api+json' }, credentials: 'same-origin' });
      if (!r.ok) return null;
      return await r.json();
    } catch (_) { return null; }
  }

  async function patchUser(id, attrs, csrf) {
    var headers = { 'Accept': 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;
    return fetch('/api/users/' + encodeURIComponent(String(id)), {
      method: 'PATCH', credentials: 'same-origin', headers,
      body: JSON.stringify({ data: { type: 'users', id: String(id), attributes: attrs } })
    });
  }

  async function onEditClick() {
    var slug = currentProfileSlug(); if (!slug) return;
    var user = await fetchUserBySlug(slug); if (!user || !user.data) return;

    var attrs = user.data.attributes || {};
    var title = window.prompt('Profile title (max 250 characters):', (attrs.title || '').toString());
    if (title === null) return;
    title = (title || '').trim();
    if (title.length > 250) { alert('Title must be 250 characters or fewer.'); return; }

    var short = window.prompt('Short description:', (attrs.short_description || '').toString());
    if (short === null) return; short = (short || '').trim();

    var csrf = getCsrfToken();
    var res = await patchUser(user.data.id, { title, short_description: short }, csrf);
    if (res && res.ok) window.location.reload();
    else {
      var msg = 'Saving failed';
      try { msg += ': ' + (await res.text()); } catch(_) {}
      alert(msg);
    }
  }

  function ensureButton() {
    if (!isOnUserProfilePage() || alreadyInjected()) return;
    var btn = injectButton();
    btn.addEventListener('click', onEditClick);
  }

  function setupObserver() {
    try {
      var obs = new MutationObserver(function () { ensureButton(); });
      obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

  // Run with or without app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ensureButton(); setupObserver(); });
  } else {
    ensureButton(); setupObserver();
  }
})();

// Export a harmless object so Flarum assigns a module, not undefined.
module.exports = { extend: [] };