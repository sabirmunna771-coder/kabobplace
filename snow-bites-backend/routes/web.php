<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response('Kabob Places Laravel API. GET /api/health for a JSON check.', 200, [
        'Content-Type' => 'text/plain; charset=utf-8',
    ]);
});
