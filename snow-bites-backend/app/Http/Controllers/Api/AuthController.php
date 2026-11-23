<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AvatarStorageService;
use App\Support\ApiException;
use App\Support\ApiSerializer;
use App\Support\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private readonly JwtService $jwt,
        private readonly ApiSerializer $serializer,
        private readonly AvatarStorageService $avatarStorage,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email'],
            'phone' => ['nullable', 'string', 'min:7', 'max:32'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
        ]);

        $email = strtolower(trim($data['email']));
        if (User::where('email', $email)->exists()) {
            throw new ApiException(409, 'An account with this email already exists.');
        }

        $user = User::create([
            'full_name' => trim($data['fullName']),
            'email' => $email,
            'phone' => isset($data['phone']) && trim($data['phone']) !== '' ? trim($data['phone']) : null,
            'password_hash' => Hash::make($data['password']),
            'role' => 'CUSTOMER',
        ]);

        $token = $this->jwt->sign($user->id, $user->role);

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => $this->serializer->user($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
        ]);

        $user = User::where('email', strtolower(trim($data['email'])))->first();
        if (! $user || ! password_verify($data['password'], $user->password_hash)) {
            throw new ApiException(401, 'Invalid email or password.');
        }

        $token = $this->jwt->sign($user->id, $user->role);

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $this->serializer->user($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        return response()->json([
            'user' => $this->serializer->user($user),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $data = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email'],
            'phone' => ['nullable', 'string', 'max:32'],
        ]);

        $phone = isset($data['phone']) ? trim($data['phone']) : '';
        if ($phone !== '' && strlen($phone) < 7) {
            throw new ApiException(400, 'Phone number must be at least 7 characters.');
        }

        $email = strtolower(trim($data['email']));
        $existing = User::where('email', $email)->first();
        if ($existing && $existing->id !== $user->id) {
            throw new ApiException(409, 'This email address is already in use.');
        }

        $user->update([
            'full_name' => trim($data['fullName']),
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->serializer->user($user->fresh()),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $data = $request->validate([
            'imageDataUrl' => ['required', 'string', 'min:1'],
        ]);

        $avatarUrl = $this->avatarStorage->storeUserAvatar(
            $user->id,
            $data['imageDataUrl'],
            $user->profile_picture_url,
        );

        $user->update(['profile_picture_url' => $avatarUrl]);

        return response()->json([
            'message' => 'Profile photo updated successfully.',
            'user' => $this->serializer->user($user->fresh()),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('authUser');

        $data = $request->validate([
            'currentPassword' => ['required', 'string', 'min:8', 'max:100'],
            'newPassword' => ['required', 'string', 'min:8', 'max:100'],
            'confirmPassword' => ['required', 'string', 'min:8', 'max:100', 'same:newPassword'],
        ]);

        if (! password_verify($data['currentPassword'], $user->password_hash)) {
            throw new ApiException(400, 'Current password is incorrect.');
        }

        if ($data['currentPassword'] === $data['newPassword']) {
            throw new ApiException(400, 'Choose a different new password.');
        }

        $user->update([
            'password_hash' => Hash::make($data['newPassword']),
        ]);

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}

