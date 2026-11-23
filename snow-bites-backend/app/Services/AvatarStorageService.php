<?php

namespace App\Services;

use App\Support\ApiException;

class AvatarStorageService
{
    private const ALLOWED_MIME_TYPES = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/webp' => 'webp',
    ];

    private const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

    public function storeUserAvatar(int $userId, string $dataUrl, ?string $previousAvatarUrl = null): string
    {
        if (! preg_match('/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+\/=\s]+)$/', $dataUrl, $matches)) {
            throw new ApiException(400, 'Avatar must be a PNG, JPEG, or WEBP image.');
        }

        $mimeType = $matches[1];
        $extension = self::ALLOWED_MIME_TYPES[$mimeType] ?? null;
        $binary = base64_decode(preg_replace('/\s+/', '', $matches[3]) ?? '', true);

        if (! $extension) {
            throw new ApiException(400, 'Unsupported avatar format.');
        }

        if ($binary === false || strlen($binary) === 0 || strlen($binary) > self::MAX_AVATAR_BYTES) {
            throw new ApiException(400, 'Avatar must be smaller than 2MB.');
        }

        $directory = public_path('uploads/avatars');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $fileName = 'user-'.$userId.'-'.((int) round(microtime(true) * 1000)).'.'.$extension;
        $absolutePath = $directory.DIRECTORY_SEPARATOR.$fileName;
        file_put_contents($absolutePath, $binary);

        if ($previousAvatarUrl && str_starts_with($previousAvatarUrl, '/uploads/avatars/')) {
            $oldPath = public_path(ltrim($previousAvatarUrl, '/'));
            if (is_file($oldPath) && realpath($oldPath) !== realpath($absolutePath)) {
                @unlink($oldPath);
            }
        }

        return '/uploads/avatars/'.$fileName;
    }
}

