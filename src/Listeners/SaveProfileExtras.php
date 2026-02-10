<?php

namespace Kmcginley1928\ProfileTitleAndDescription\Listeners;

use Flarum\User\Event\Saving;
use Illuminate\Validation\ValidationException;

/**
 * Guarded Save listener:
 * - Allows self-edit or moderators/admins (checks admin + generic can('edit', $user) if available).
 * - Validates title <= 250 chars; short_description is free-form string.
 * - Silently no-ops if the actor isn't allowed, to avoid breaking saves on trimmed builds.
 */
class SaveProfileExtras
{
    public function __invoke(Saving $event): void
    {
        $this->handle($event);
    }

    public function handle(Saving $event): void
    {
        $data = (array) ($event->data['attributes'] ?? []);

        if (!array_key_exists('title', $data) && !array_key_exists('short_description', $data)) {
            return;
        }

        $actor = $event->actor;
        $user  = $event->user;

        // Guard: allow self, admins, or anyone who can('edit', $user) if available.
        $canEdit = $actor
            && (
                $actor->id === $user->id
                || (method_exists($actor, 'isAdmin') && $actor->isAdmin())
                || (method_exists($actor, 'can') && $actor->can('edit', $user))
            );

        if (!$canEdit) {
            // Silently ignore on unauthorised attempts to keep behaviour safe on trimmed builds
            return;
        }

        // Validate + save 'title'
        if (array_key_exists('title', $data)) {
            $title = $data['title'];

            if ($title === null || $title === '') {
                $user->setAttribute('title', null);
            } else {
                $title = trim((string) $title);
                if (mb_strlen($title) > 250) {
                    throw ValidationException::withMessages([
                        'title' => 'Title must be 250 characters or fewer.',
                    ]);
                }
                $user->setAttribute('title', $title);
            }
        }

        // Validate + save 'short_description'
        if (array_key_exists('short_description', $data)) {
            $short = $data['short_description'];

            if ($short === null || $short === '') {
                $user->setAttribute('short_description', null);
            } else {
                $short = trim((string) $short);
                $user->setAttribute('short_description', $short);
            }
        }
    }
}