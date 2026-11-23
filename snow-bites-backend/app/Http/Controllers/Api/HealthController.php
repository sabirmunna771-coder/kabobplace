<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $base = [
            'message' => 'Kabob Places Laravel backend is running.',
            'ok' => true,
            'driver' => config('database.default'),
        ];

        try {
            DB::select('SELECT 1');

            return response()->json([
                ...$base,
                'database' => 'connected',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                ...$base,
                'ok' => false,
                'database' => 'error',
                'hint' => 'Set DB_CONNECTION=pgsql and DATABASE_URL to your Prisma Postgres / PostgreSQL connection string and run php artisan migrate.',
            ], 503);
        }
    }
}

