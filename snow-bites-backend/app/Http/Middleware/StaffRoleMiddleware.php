<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\StaffAccessService;
use App\Support\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffRoleMiddleware
{
    public function __construct(private readonly StaffAccessService $staffAccess) {}

    public function handle(Request $request, Closure $next, string $role): Response
    {
        /** @var User|null $user */
        $user = $request->attributes->get('authUser');
        if (! $user) {
            throw new ApiException(401, 'Authentication is required.');
        }

        $access = $this->staffAccess->getRequestStaffAccess($user);
        if (! $access || $access['role'] !== $role) {
            throw new ApiException(403, "{$role} access is required.");
        }

        return $next($request);
    }
}

