<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\ApiException;
use App\Support\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthMiddleware
{
    public function __construct(private readonly JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');
        if (! is_string($header) || ! str_starts_with($header, 'Bearer ')) {
            throw new ApiException(401, 'Authorization token is required.');
        }

        $token = substr($header, 7);
        $claims = $this->jwt->verify($token);

        $user = User::find($claims['userId']);
        if (! $user) {
            throw new ApiException(401, 'Invalid or expired token.');
        }

        $request->attributes->set('authUser', $user);
        $request->attributes->set('authClaims', $claims);

        return $next($request);
    }
}

