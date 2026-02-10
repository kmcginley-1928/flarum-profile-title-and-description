// Minimal enhancer using compat where available, with guards to avoid crashes
(() => {
  const compat = (window.flarum && flarum.core && flarum.core.compat) || {};
  const app = (flarum.core && flarum.core.app) || compat['forum/app'];

  const extendMod = compat['common/extend'];
  const extend = extendMod && extendMod.extend ? extendMod.extend : null;

  const UserCardMod = compat['forum/components/UserCard'] || {};
  const UserPageMod = compat['forum/components/UserPage'] || {};
  const ButtonMod   = compat['common/components/Button'] || {};

  const UserCard = UserCardMod.default || UserCardMod;
  const UserPage = UserPageMod.default || UserPageMod;
  const Button   = ButtonMod.default || ButtonMod;

  const m_ = typeof m !== 'undefined' ? m : null;

  if (!app || !m_ || !UserCard || !UserPage || !Button) return;

  app.initializers.add('kmc-profile-extras', () => {
    // Show fields on the user card
    if (extend && UserCard && UserCard.prototype) {
      extend(UserCard.prototype, 'infoItems', function (items) {
        const user = this.attrs.user;
        const title = user.attribute('title');
        const desc  = user.attribute('short_description');

        if (title) {
          items.add('kmc-title', m_('div.UserExtras-title', title), 5);
        }
        if (desc) {
          items.add('kmc-short', m_('div.UserExtras-short', desc), 4);
        }
      });
    } else {
      // Fallback DOM injection if compat is missing
      const mo = new MutationObserver(() => {
        const card = document.querySelector('.UserCard-info');
        if (!card) return;
        const holder = document.querySelector('[data-user-id]') || document.querySelector('.UserPage');
        const id = holder && holder.getAttribute('data-user-id');
        if (!id || !app.store) return;
        const user = app.store.getById('users', id);
        if (!user) return;

        const title = user.attribute('title');
        const desc  = user.attribute('short_description');

        if (title && !card.querySelector('.user-extra-title')) {
          const el = document.createElement('div');
          el.className = 'user-extra-title';
          el.textContent = title;
          card.appendChild(el);
        }
        if (desc && !card.querySelector('.user-extra-desc')) {
          const el = document.createElement('div');
          el.className = 'user-extra-desc';
          el.textContent = desc;
          card.appendChild(el);
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Simple self-edit via prompts on your own profile
    if (extend && UserPage && UserPage.prototype) {
      extend(UserPage.prototype, 'navItems', function (items) {
        const user = this.user;
        const isSelf = app.session?.user && user && app.session.user.id() === user.id();
        if (!isSelf) return;

        items.add(
          'kmc-edit-profile-extras',
          Button.component(
            {
              className: 'Button Button--link',
              onclick: () => {
                const currentTitle = user.attribute('title') || '';
                const currentDesc  = user.attribute('short_description') || '';

                const newTitle = window.prompt('Title', currentTitle);
                if (newTitle === null) return;

                const newDesc = window.prompt('Short description', currentDesc);
                if (newDesc === null) return;

                user.save({
                  title: (newTitle || '').trim().slice(0, 250) || null,
                  short_description: (newDesc || '').trim() || null
                })
                .then(() => app.alerts.show({ type: 'success' }, 'Saved'))
                .catch(() => app.alerts.show({ type: 'error' }, 'Save failed'));
              }
            },
            'Edit profile info'
          ),
          90
        );
      });
    }
  });
})();