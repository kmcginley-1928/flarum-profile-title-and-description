<?php

namespace Kmcginley1928\ProfileTitleAndDescription\Listeners;

use Flarum\Foundation\ValidationException;
use Flarum\User\Event\Saving;
use Illuminate\Support\Arr;

class SaveProfileExtras
{
    public function handle(Saving $event): void
    {
        $attributes = Arr::get($event->data, 'attributes', []);

        if (!array_key_exists('title', $attributes) && !array_key_exists('short_description', $attributes)) {
            return;
        }

        $actor = $event->actor;
        $user  = $event->user;

        // Allow self-edit or anyone who can edit the user
        $canEdit = $actor->id === $user->id || $actor->can('edit', $user);
        if (!$canEdit) {
            throw new ValidationException([
                'permission' => ['You do not have permission to update these fields.'],
            ]);
        }

        if (array_key_exists('title', $attributes)) {
            $title = $attributes['title'];
            $title = is_null($title) ? null : trim((string) $title);

            if ($title !== null && mb_strlen($title) > 250) {
                throw new ValidationException([
                    'title' => ['Title must be 250 characters or fewer.'],
                ]);
            }

            $user->title = $title ?: null;
        }

        if (array_key_exists('short_description', $attributes)) {
            $desc = $attributes['short_description'];
            $desc = is_null($desc) ? null : trim((string) $desc);

            // Soft cap, change if needed
            if ($desc !== null && mb_strlen($desc) > 2000) {
                throw new ValidationException([
                    'short_description' => ['Description must be 2000 characters or fewer.'],
                ]);
            }

            $user->short_description = $desc ?: null;
        }
    }
}