# Profile Title & Description (Flarum extension) v5.5

Adds two profile fields to users:

- `title` (max 250 chars)
- `short_description`

Back end:
- Exposes both attributes through the User API serializer.
- Guarded save listener: allows self-edit or moderators/admins; validates `title` length.
- **No migrations** (assumes DB columns already exist on the users table in your environment).

Front end:
- A small, defensive forum JS that **does not depend on compat modules** to boot.
- Provides an **"Edit profile info"** button on user profile pages.
- Uses `prompt()` to edit and PATCHes via the JSON:API.

## Installation

Add the repository:
```json
"repositories": [
  {
    "type": "vcs",
    "url": "https://github.com/kmcginley-1928/flarum-profile-title-and-description"
  }
]