<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class OptionalJwtAuthMiddleware
{
    public function __construct(private readonly JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');
        if (is_string($header) && str_starts_with($header, 'Bearer ')) {
            try {
                $claims = $this->jwt->verify(substr($header, 7));
                $user = User::find($claims['userId']);
                if ($user) {
                    $request->attributes->set('authUser', $user);
                    $request->attributes->set('authClaims', $claims);
                }
            } catch (Throwable) {
                // Optional auth ignores expired/invalid tokens on public routes
            }
        }

        return $next($request);
    }
}

