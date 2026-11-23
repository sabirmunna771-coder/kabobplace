<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\JwtAuthMiddleware;
use App\Http\Middleware\OptionalJwtAuthMiddleware;
use App\Http\Middleware\StaffPermissionMiddleware;
use App\Http\Middleware\StaffRoleMiddleware;
use App\Support\ApiException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

if (!file_exists(dirname(__DIR__).'/.env')) {
    putenv('APP_NAME=Kabob Places');
    putenv('APP_KEY=base64:U6SoCYwPaDMKfUJEDsxPggYLGHbar3QTqz7m/qwdhm8=');
    putenv('APP_ENV=production');
    putenv('APP_DEBUG=false');
    putenv('APP_URL=https://elkabobplace.com');
    putenv('DB_CONNECTION=sqlite');
    $_ENV['APP_NAME'] = 'Kabob Places';
    $_ENV['APP_KEY'] = 'base64:U6SoCYwPaDMKfUJEDsxPggYLGHbar3QTqz7m/qwdhm8=';
    $_ENV['APP_ENV'] = 'production';
    $_ENV['APP_DEBUG'] = 'false';
    $_ENV['APP_URL'] = 'https://elkabobplace.com';
    $_ENV['DB_CONNECTION'] = 'sqlite';
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'auth.jwt' => JwtAuthMiddleware::class,
            'auth.jwt.optional' => OptionalJwtAuthMiddleware::class,
            'admin.only' => AdminMiddleware::class,
            'staff.permission' => StaffPermissionMiddleware::class,
            'staff.role' => StaffRoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (ApiException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $body = ['message' => $e->getMessage()];
                if ($e->errors !== null) {
                    $body['errors'] = $e->errors;
                }

                return response()->json($body, $e->statusCode);
            }
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => [
                        'fieldErrors' => $e->errors(),
                        'formErrors' => [],
                    ],
                ], 400);
            }
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Resource not found.',
                ], 404);
            }
        });
    })->create();
