/*!
 * kmcginley-1928/flarum-profile-title-and-description
 * Forum JS: exports a default object so Flarum never sees undefined.
 */

// ---- Ensure the module has a default export (Flarum reads module.default) ----
const __kmc_ext_default__ = {};
export default __kmc_ext_default__;

// Keep a benign runtime object on the global for maximum compatibility too
(function () {
  'use strict';

  var EXT_ID = 'kmcginley-1928-profile-title-and-description';

  // Also seed the global map early (belt and braces)
  try {
    var _w = typeof window !== 'undefined' ? window : {};
    _w.flarum = _w.flarum || {};
    _w.flarum.extensions = _w.flarum.extensions || {};
    if (typeof _w.flarum.extensions[EXT_ID] === 'undefined') {
      _w.flarum.extensions[EXT_ID] = __kmc_ext_default__;
    }
  } catch (_) {}

  // ---------------- Utilities (defensive) ----------------

  function getMeta(name) {
    try {
      var el = document.querySelector('meta[name="' + name + '"]');
      return el ? el.getAttribute('content') : null;
    } catch (_) {
      return null;
    }
  }

  function getCsrfToken() {
    try {
      if (window.app && window.app.session && window.app.session.csrfToken) {
        return window.app.session.csrfToken;
      }
    } catch (_) {}
    return getMeta('csrf-token') || getMeta('csrf') || null;
  }

  function currentProfileSlug() {
    try {
      var m = window.location.pathname.match(/\/u\/([^/?#]+)/i);
      return m ? decodeURIComponent(m[1]) : null;
    } catch (_) {
      return null;
    }
  }

  function isOnUserProfilePage() {
    return !!currentProfileSlug();
  }

  function oncePerPageRunKey() {
    return 'kmcginley1928-ptad-btn';
  }

  function alreadyInjected() {
    return !!document.getElementById(oncePerPageRunKey());
  }

  function markInjected(btn) {
    btn.id = oncePerPageRunKey();
  }

  async function fetchUserRecordBySlug(slug) {
    try {
      if (!slug) return null;
      var res = await fetch('/api/users/' + encodeURIComponent(slug), {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/vnd.api+json' }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  async function patchUser(id, payload, csrf) {
    try {
      var headers = {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      };
      if (csrf) headers['X-CSRF-Token'] = csrf;

      return await fetch('/api/users/' + encodeURIComponent(String(id)), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: headers,
        body: JSON.stringify({
          data: { type: 'users', id: String(id), attributes: payload }
        })
      });
    } catch (e) {
      return { ok: false, status: 0, error: e };
    }
  }

  function findProfileHeaderContainer() {
    var candidates = [
      '.UserHero .container',
      '.UserHero',
      '.Hero .container',
      '.UserCard',
      '.UserPage',
      '.UserPage .container',
      '.App-content .container'
    ];
    for (var i = 0; i < candidates.length; i++) {
      var el = document.querySelector(candidates[i]);
      if (el) return el;
    }
    return null;
  }

  function createButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Edit profile info';
    btn.setAttribute('aria-label', 'Edit profile info');
    btn.style.cursor = 'pointer';
    btn.style.padding = '6px 10px';
    btn.style.fontSize = '14px';
    btn.style.borderRadius = '4px';
    btn.style.border = '1px solid #0a7cff';
    btn.style.background = '#0a7cff';
    btn.style.color = '#fff';
    btn.style.marginLeft = '8px';
    btn.style.marginTop = '8px';
    btn.style.whiteSpace = 'nowrap';
    return btn;
  }

  function injectFixedButton() {
    var btn = createButton();
    markInjected(btn);
    btn.style.position = 'fixed';
    btn.style.bottom = '16px';
    btn.style.right = '16px';
    btn.style.zIndex = '2147483647';
    document.body.appendChild(btn);
    return btn;
  }

  function injectButtonIntoHeader() {
    var container = findProfileHeaderContainer();
    if (!container) return injectFixedButton();
    var btn = createButton();
    markInjected(btn);
    container.appendChild(btn);
    return btn;
  }

  async function handleEditClick() {
    var slug = currentProfileSlug();
    if (!slug) return;

    var user = await fetchUserRecordBySlug(slug);
    if (!user || !user.data) return;

    var id = user.data.id;
    var attrs = user.data.attributes || {};

    var currentTitle = (attrs.title || '').toString();
    var currentShort = (attrs.short_description || '').toString();

    var newTitle = window.prompt('Profile title (max 250 characters):', currentTitle);
    if (newTitle === null) return;
    newTitle = (newTitle || '').trim();
    if (newTitle.length > 250) {
      alert('Title must be 250 characters or fewer.');
      return;
    }

    var newShort = window.prompt('Short description:', currentShort);
    if (newShort === null) return;
    newShort = (newShort || '').trim();

    var csrf = getCsrfToken();
    var res = await patchUser(id, { title: newTitle, short_description: newShort }, csrf);

    if (res && res.ok) {
      window.location.reload();
    } else {
      var msg = 'Saving failed';
      try {
        var txt = await res.text();
        if (txt) msg += ': ' + txt;
      } catch (_) {}
      alert(msg);
    }
  }

  function ensureButton() {
    if (!isOnUserProfilePage() || alreadyInjected()) return;
    var btn = injectButtonIntoHeader();
    btn.addEventListener('click', handleEditClick);
  }

  function setupMutationObserver() {
    try {
      var obs = new MutationObserver(function () { ensureButton(); });
      obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

  function initWithAppIfAvailable() {
    try {
      var hasCompat = !!(window.flarum && window.flarum.core && window.flarum.core.compat);
      var appModule = hasCompat ? (window.flarum.core.compat['forum/app'] || null) : null;
      var app = appModule || (window.app || null);
      if (app && app.initializers && typeof app.initializers.add === 'function') {
        app.initializers.add(EXT_ID, function () {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
              ensureButton();
              setupMutationObserver();
            });
          } else {
            ensureButton();
            setupMutationObserver();
          }
        });
        return true;
      }
    } catch (_) {}
    return false;
  }

  if (!initWithAppIfAvailable()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        ensureButton();
        setupMutationObserver();
      });
    } else {
      ensureButton();
      setupMutationObserver();
    }
  }
})();