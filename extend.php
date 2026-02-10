<?php

use Flarum\Extend;
use Flarum\User\Event\Saving;
use Kmcginley1928\ProfileTitleAndDescription\Listeners\SaveProfileExtras;

$extenders = [
    // Locales
    (new Extend\Locales(__DIR__ . '/locale')),

    // Forum JS (compiled, no build step needed)
    (new Extend\Frontend('forum'))->js(__DIR__ . '/js/dist/forum.js'),

    // Add fields to User API payload
    (new Extend\ApiSerializer(\Flarum\Api\Serializer\UserSerializer::class))
        ->attributes(function ($model, $serializer, array $attributes) {
            $attributes['title'] = $model->title;
            $attributes['short_description'] = $model->short_description;
            return $attributes;
        }),
];

// Guard the listener to avoid boot errors if autoload changes
if (class_exists('Kmcginley1928\\ProfileTitleAndDescription\\Listeners\\SaveProfileExtras')) {
    $extenders[] = (new Extend\Event())
        ->listen(Saving::class, 'Kmcginley1928\\ProfileTitleAndDescription\\Listeners\\SaveProfileExtras');
}

return $extenders;