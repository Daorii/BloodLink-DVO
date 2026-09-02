<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BloodIssuanceController;
use App\Http\Controllers\BloodRequestController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\DonationEventController;
use App\Http\Controllers\DonorController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\DonorRecallController;
use App\Http\Controllers\LabTestResultController;
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

    // Donor Management (CRUD)
    Route::get('/donors', [DonorController::class, 'index']);
    Route::post('/donors', [DonorController::class, 'store']);
    Route::put('/donors/{id}', [DonorController::class, 'update']);
    Route::delete('/donors/{id}', [DonorController::class, 'destroy']);

    // Donation Events
    Route::get('/donation-events', [DonationEventController::class, 'index']);
    Route::post('/donation-events', [DonationEventController::class, 'store']);
    Route::put('/donation-events/{id}', [DonationEventController::class, 'update']);
    Route::delete('/donation-events/{id}', [DonationEventController::class, 'destroy']);

    // Donations / Record Outcomes
    Route::get('/donations', [DonationController::class, 'index']);
    Route::post('/donations', [DonationController::class, 'store']);
    Route::put('/donations/{id}/outcome', [DonationController::class, 'updateOutcome']);

    // Lab Test Results
    Route::get('/lab-results', [LabTestResultController::class, 'index']);
    Route::post('/lab-results', [LabTestResultController::class, 'store']);
    Route::get('/donations/{id}/lab-result', [LabTestResultController::class, 'showByDonation']);

    // Donor Recalls
    Route::get('/recalls', [DonorRecallController::class, 'index']);
    Route::post('/recalls', [DonorRecallController::class, 'store']);
    Route::post('/recalls/bulk', [DonorRecallController::class, 'bulk']);
    Route::put('/recalls/{id}/response', [DonorRecallController::class, 'updateResponse']);

    // Blood Requests
    Route::get('/blood-requests', [BloodRequestController::class, 'index']);
    Route::post('/blood-requests', [BloodRequestController::class, 'store']);
    Route::put('/blood-requests/{id}/status', [BloodRequestController::class, 'updateStatus']);

    // Blood Issuances
    Route::get('/blood-issuances', [BloodIssuanceController::class, 'index']);
    Route::post('/blood-issuances', [BloodIssuanceController::class, 'store']);
    Route::put('/blood-issuances/{id}/release', [BloodIssuanceController::class, 'release']);
});
