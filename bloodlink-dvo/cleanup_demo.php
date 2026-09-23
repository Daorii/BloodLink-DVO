<?php
// cleanup_demo.php - run with: php cleanup_demo.php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$donationIds = DB::table('donations')
    ->where('serial_number', 'like', 'DEMO-2026-%')
    ->pluck('donation_id');

$donorIds = DB::table('donations')
    ->where('serial_number', 'like', 'DEMO-2026-%')
    ->pluck('donor_id');

$inventory = DB::table('blood_inventory')
    ->whereIn('donation_id', $donationIds)
    ->delete();

$donations = DB::table('donations')
    ->where('serial_number', 'like', 'DEMO-2026-%')
    ->delete();

$donors = DB::table('donors')
    ->whereIn('donor_id', $donorIds)
    ->delete();

echo "Deleted: {$inventory} inventory units, {$donations} donations, {$donors} donors.\n";
