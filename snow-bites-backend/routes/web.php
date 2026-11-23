<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $candidates = [
        public_path('index.html'),
        base_path('public/index.html'),
        base_path('index.html'),
    ];

    foreach ($candidates as $candidate) {
        if (file_exists($candidate)) {
            return response()->file($candidate);
        }
    }

    return response('Kabob Places API is running. Visit /api/health for system status.', 200, [
        'Content-Type' => 'text/plain; charset=utf-8',
    ]);
})->where('any', '^(?!api/).*');

