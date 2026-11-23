<?php

namespace App\Support;

class JwtService
{
    public function sign(int $userId, string $role): string
    {
        $now = time();
        $ttlDays = max(1, (int) config('services.jwt.ttl_days', 7));

        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));

        $payload = $this->base64UrlEncode(json_encode([
            'userId' => $userId,
            'role' => $role,
            'iat' => $now,
            'exp' => $now + ($ttlDays * 86400),
        ], JSON_THROW_ON_ERROR));

        $signature = $this->base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", $this->secret(), true),
        );

        return "{$header}.{$payload}.{$signature}";
    }

    /**
     * @return array{userId: int, role: string, iat: int, exp: int}
     */
    public function verify(string $token): array
    {
        $parts = explode('.', trim($token));
        if (count($parts) !== 3) {
            throw new ApiException(401, 'Invalid or expired token.');
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $expected = $this->base64UrlEncode(
            hash_hmac('sha256', "{$headerB64}.{$payloadB64}", $this->secret(), true),
        );

        if (! hash_equals($expected, $signatureB64)) {
            throw new ApiException(401, 'Invalid or expired token.');
        }

        $payloadJson = $this->base64UrlDecode($payloadB64);
        $payload = json_decode($payloadJson, true);

        if (! is_array($payload) || ! isset($payload['userId'], $payload['role'])) {
            throw new ApiException(401, 'Invalid or expired token.');
        }

        if (isset($payload['exp']) && (int) $payload['exp'] < time()) {
            throw new ApiException(401, 'Invalid or expired token.');
        }

        return [
            'userId' => (int) $payload['userId'],
            'role' => (string) $payload['role'],
            'iat' => (int) ($payload['iat'] ?? 0),
            'exp' => (int) ($payload['exp'] ?? 0),
        ];
    }

    private function secret(): string
    {
        $secret = (string) config('services.jwt.secret', '');
        if ($secret === '') {
            $secret = (string) config('app.key', 'fallback-secret-key-at-least-32-chars');
        }

        return $secret;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder > 0) {
            $data .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($data, '-_', '+/'), true);
        if ($decoded === false) {
            throw new ApiException(401, 'Invalid or expired token.');
        }

        return $decoded;
    }
}

