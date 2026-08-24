<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| BloodLink DVO — API Routes
|--------------------------------------------------------------------------
*/

// ── Handle CORS preflight OPTIONS requests ──────────────────────────────
// The browser sends an OPTIONS request before every cross-origin POST/PUT.
// Without this, Laravel returns 405 and the CORS headers never get added.
Route::options('/{any}', function () {
    return response('', 204);
})->where('any', '.*');

// ── Public (no auth required) ───────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ── Protected (Sanctum token required) ──────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // User Management (CRUD)
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);

    // Hospital Management (CRUD)
    Route::get('/hospitals', [HospitalController::class, 'index']);
    Route::get('/hospitals/{id}', [HospitalController::class, 'show']);
    Route::post('/hospitals', [HospitalController::class, 'store']);
    Route::put('/hospitals/{id}', [HospitalController::class, 'update']);
    Route::delete('/hospitals/{id}', [HospitalController::class, 'destroy']);
});
