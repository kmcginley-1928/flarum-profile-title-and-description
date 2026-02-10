<?php

namespace Kmcginley1928\ProfileTitleAndDescription;

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\Event\Saving as UserSaving;
use Flarum\Frontend\Document;
use Kmcginley1928\ProfileTitleAndDescription\Listeners\SaveProfileExtras;

return [
    // Pre-seed a benign extension entry in <head> so boot never sees undefined
    (new Extend\Frontend('forum'))
        ->content(function (Document $document) {
            $document->head[] = '<script>(function(){try{var w=window;w.flarum=w.flarum||{};var ex=w.flarum.extensions=w.flarum.extensions||{};var ID="kmcginley-1928-profile-title-and-description";if(ex[ID]==null){ex[ID]={};}}catch(e){}})();</script>';
        })
        ->js(__DIR__ . '/js/dist/forum.js'),

    // Locales
    new Extend\Locales(__DIR__ . '/locale'),

    // Expose attributes on the User API
    (new Extend\ApiSerializer(UserSerializer::class))
        ->attributes(function (UserSerializer $serializer, $user, array $attributes) {
            $attributes['title'] = $user->getAttribute('title');
            $attributes['short_description'] = $user->getAttribute('short_description');
            return $attributes;
        }),

    // Guarded save with validation
    (new Extend\Event())
        ->listen(UserSaving::class, SaveProfileExtras::class),
];