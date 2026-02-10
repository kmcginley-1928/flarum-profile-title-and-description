<?php

namespace Kmcginley1928\ProfileTitleAndDescription;

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\Event\Saving as UserSaving;
use Kmcginley1928\ProfileTitleAndDescription\Listeners\SaveProfileExtras;

return [
    // Provide the forum JS (defensive, will not crash if compat modules are missing)
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js'),

    // Locales
    (new Extend\Locales(__DIR__ . '/locale')),

    // Expose the attributes on the user serializer
    (new Extend\ApiSerializer(UserSerializer::class))
        ->attributes(function (UserSerializer $serializer, $user, array $attributes) {
            $attributes['title'] = $user->getAttribute('title');
            $attributes['short_description'] = $user->getAttribute('short_description');
            return $attributes;
        }),

    // Guarded save listener (self or moderator/admin), with validation
    (new Extend\Event())
        ->listen(UserSaving::class, SaveProfileExtras::class),
];