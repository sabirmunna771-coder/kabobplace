<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->attributes->get('authUser');

        if (! $user) {
            throw new ApiException(401, 'Authentication is required.');
        }

        if ($user->role !== 'ADMIN') {
            throw new ApiException(403, 'Admin access is required.');
        }

        return $next($request);
    }
}

