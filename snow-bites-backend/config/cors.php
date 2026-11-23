<?php

$rawOrigins = env(
    'CORS_ORIGIN',
    'http://localhost:8080,http://localhost:5173,http://127.0.0.1:8080,http://127.0.0.1:5173',
);

$allowedOrigins = array_values(array_filter(array_map(
    fn (string $origin): string => rtrim(trim($origin), '/'),
    explode(',', $rawOrigins),
)));

return [
    'paths' => ['api/*', 'uploads/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Disposition'],
    'max_age' => 0,
    'supports_credentials' => true,
];

