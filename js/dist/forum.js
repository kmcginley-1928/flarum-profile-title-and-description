/*!
 * kmcginley-1928/flarum-profile-title-and-description
 * Forum JS - fully defensive, safe on trimmed/Asirem-style builds.
 *
 * Behaviour:
 *  - If Flarum compat/app modules exist, register a light initializer that relies on DOM.
 *  - Otherwise, fall back to pure DOM injection without touching compat.
 *  - Provides a single "Edit profile info" button on user profile pages.
 *  - Uses prompt() for title and short_description.
 *  - PATCHes /api/users/:id (with CSRF token if available) and reloads on success.
 */

(function () {
  'use strict';

  // ------------- Utilities (defensive) ----------------

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
    // try common meta names
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
        headers: {
          'Accept': 'application/vnd.api+json'
        }
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

      var res = await fetch('/api/users/' + encodeURIComponent(String(id)), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: headers,
        body: JSON.stringify({
          data: {
            type: 'users',
            id: String(id),
            attributes: payload
          }
        })
      });

      return res;
    } catch (e) {
      return { ok: false, status: 0, error: e };
    }
  }

  // Try to find a reasonable DOM container to place the button into.
  function findProfileHeaderContainer() {
    // Common Flarum selectors (default + popular themes)
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

    // Append to right if possible, otherwise just append.
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

    // Prefill existing values if present
    var currentTitle = (attrs.title || '').toString();
    var currentShort = (attrs.short_description || '').toString();

    var newTitle = window.prompt('Profile title (max 250 characters):', currentTitle);
    if (newTitle === null) return; // cancelled
    newTitle = (newTitle || '').trim();
    if (newTitle.length > 250) {
      alert('Title must be 250 characters or fewer.');
      return;
    }

    var newShort = window.prompt('Short description:', currentShort);
    if (newShort === null) return; // cancelled
    newShort = (newShort || '').trim();

    var csrf = getCsrfToken();
    var res = await patchUser(id, { title: newTitle, short_description: newShort }, csrf);

    if (res && res.ok) {
      // Refresh to reflect changes
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

  // Observe DOM changes to reinject on SPA navigations/redraws.
  function setupMutationObserver() {
    var obs;
    try {
      obs = new MutationObserver(function (_mutations) {
        ensureButton();
      });
      obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

  // ------------- Safe initialisation paths ----------------

  function frontendInitWithAppIfAvailable() {
    try {
      // Only reference compat if it exists. Do NOT read any property from undefined.
      var hasCompat = !!(window.flarum && window.flarum.core && window.flarum.core.compat);
      var appModule = hasCompat ? (window.flarum.core.compat['forum/app'] || null) : null;
      var app = appModule || (window.app || null);

      if (app && app.initializers && typeof app.initializers.add === 'function') {
        app.initializers.add('kmcginley-1928-profile-title-and-description', function () {
          // Keep it DOM-based even when app exists, to avoid depending on extend/mithril on trimmed builds.
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
    } catch (_) {
      // swallow and fall back
    }
    return false;
  }

  function fallbackInitWithoutApp() {
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

  // Try app path first, then fallback. Both are fully defensive.
  if (!frontendInitWithAppIfAvailable()) {
    fallbackInitWithoutApp();
  }
})();