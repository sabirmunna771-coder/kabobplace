<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\StaffAccessService;
use App\Support\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffPermissionMiddleware
{
    public function __construct(private readonly StaffAccessService $staffAccess) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        /** @var User|null $user */
        $user = $request->attributes->get('authUser');
        if (! $user) {
            throw new ApiException(401, 'Authentication is required.');
        }

        $access = $this->staffAccess->getRequestStaffAccess($user);
        if (! $access || ! in_array($permission, $access['permissions'], true)) {
            throw new ApiException(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}

