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
