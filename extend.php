<?php

namespace Kmcginley1928\ProfileTitleAndDescription;

use Flarum\Extend;
use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\Event\Saving as UserSaving;
use Flarum\Frontend\Document;
use Kmcginley1928\ProfileTitleAndDescription\Listeners\SaveProfileExtras;

return [
    // 1) Inject a guard in <head> to keep the extension entry from being overwritten with undefined
    (new Extend\Frontend('forum'))
        ->content(function (Document $document) {
            $document->head[] =
                '<script>(function(){try{' .
                'var w=window; w.flarum=w.flarum||{}; var ex=w.flarum.extensions=w.flarum.extensions||{};' .
                'var ID="kmcginley-1928-profile-title-and-description";' .
                // Backing store for our value
                'var store={};' .
                // Install a property with getter/setter. If a loader tries to assign undefined, ignore it.
                'if(!Object.prototype.hasOwnProperty.call(ex,ID)){' .
                  'Object.defineProperty(ex,ID,{' .
                    'configurable:true, enumerable:true,' .
                    'get:function(){return store;},' .
                    'set:function(v){ if(v==null){return;} store=v; }' .
                  '});' .
                '}' .
                '}catch(e){}})();</script>';
        })
        ->js(__DIR__ . '/js/dist/forum.js'),

    // 2) Locales
    (new Extend\Locales(__DIR__ . '/locale')),

    // 3) Expose attributes on User serializer
    (new Extend\ApiSerializer(\Flarum\Api\Serializer\UserSerializer::class))
        ->attributes(function (\Flarum\Api\Serializer\UserSerializer $serializer, $user, array $attributes) {
            $attributes['title'] = $user->getAttribute('title');
            $attributes['short_description'] = $user->getAttribute('short_description');
            return $attributes;
        }),

    // 4) Guarded save listener with validation
    (new Extend\Event())
        ->listen(UserSaving::class, SaveProfileExtras::class),
];