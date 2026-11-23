<?php

namespace App\Support;

use RuntimeException;

class ApiException extends RuntimeException
{
    public function __construct(
        public readonly int $statusCode,
        string $message,
        public readonly ?array $errors = null,
    ) {
        parent::__construct($message);
    }
}

