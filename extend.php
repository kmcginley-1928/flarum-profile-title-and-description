<?php

namespace Kmcginley1928\ProfileTitleAndDescription;

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\Event\Saving as UserSaving;
use Flarum\Frontend\Document;
use Kmcginley1928\ProfileTitleAndDescription\Listeners\SaveProfileExtras;

return [
    // 1) Pre-seed the extension entry in <head> so bootExtensions never sees undefined.
    (new Extend\Frontend('forum'))
        ->content(function (Document $document) {
            $document->head[] = '<script>(function(){try{'
                . 'window.flarum=window.flarum||{};'
                . 'window.flarum.extensions=window.flarum.extensions||{};'
                . 'if(typeof window.flarum.extensions["kmcginley-1928-profile-title-and-description"]==="undefined"){'
                . 'window.flarum.extensions["kmcginley-1928-profile-title-and-description"]={};'
                . '}'
                . '}catch(e){}})();</script>';
        })
        ->js(__DIR__ . '/js/dist/forum.js'),

    // 2) Locales
    (new Extend\Locales(__DIR__ . '/locale')),

    // 3) Expose attributes
    (new Extend\ApiSerializer(UserSerializer::class))
        ->attributes(function (UserSerializer $serializer, $user, array $attributes) {
            $attributes['title'] = $user->getAttribute('title');
            $attributes['short_description'] = $user->getAttribute('short_description');
            return $attributes;
        }),

    // 4) Guarded save listener
    (new Extend\Event())
        ->listen(UserSaving::class, SaveProfileExtras::class),
];
