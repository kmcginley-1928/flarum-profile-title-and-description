<?php

namespace Kmcginley1928\ProfileTitleAndDescription;

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\Event\Saving as UserSaving;
use Kmcginley1928\ProfileTitleAndDescription\Listeners\SaveProfileExtras;

return [
    // Inject a tiny inline script in HEAD to guarantee a benign object exists
    (new Extend\Frontend('forum'))
        ->content(function (Extend\Frontend $frontend) {
            $frontend->content(function () {
                return '<script>(function(){try{window.flarum=window.flarum||{};window.flarum.extensions=window.flarum.extensions||{};if(typeof window.flarum.extensions["kmcginley-1928-profile-title-and-description"]==="undefined"){window.flarum.extensions["kmcginley-1928-profile-title-and-description"]={};}}catch(e){}})();</script>';
            });
        })
        ->js(__DIR__ . '/js/dist/forum.js'),

    (new Extend\Locales(__DIR__ . '/locale')),

    (new Extend\ApiSerializer(UserSerializer::class))
        ->attributes(function (UserSerializer $serializer, $user, array $attributes) {
            $attributes['title'] = $user->getAttribute('title');
            $attributes['short_description'] = $user->getAttribute('short_description');
            return $attributes;
        }),

    (new Extend\Event())
        ->listen(UserSaving::class, SaveProfileExtras::class),
];