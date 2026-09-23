<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$today = now()->toDateString();
$components = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
$types = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

echo "=== Available Non-Expired Units per Blood Type x Component ===\n";
foreach ($types as $t) {
    $row = [];
    foreach ($components as $c) {
        $count = DB::table('blood_inventory')
            ->where('blood_type', $t)
            ->where('component', $c)
            ->where('inventory_status', 'Available')
            ->where('expiration_date', '>', $today)
            ->count();
        $short = str_pad(substr($c, 0, 4), 4) . '=' . str_pad($count, 3);
        $row[] = $short;
    }
    echo str_pad($t, 4) . ': ' . implode(' | ', $row) . "\n";
}

echo "\n=== Expired (but still Available status) ===\n";
$expired = DB::table('blood_inventory')
    ->where('inventory_status', 'Available')
    ->where('expiration_date', '<', $today)
    ->select('blood_type', 'component', DB::raw('count(*) as cnt'))
    ->groupBy('blood_type', 'component')
    ->orderBy('blood_type')
    ->get();
foreach ($expired as $row) {
    echo "  {$row->blood_type} {$row->component}: {$row->cnt} expired units still marked Available\n";
}

echo "\n=== Non-Available Units ===\n";
$statuses = DB::table('blood_inventory')
    ->where('inventory_status', '!=', 'Available')
    ->select('inventory_status', DB::raw('count(*) as cnt'))
    ->groupBy('inventory_status')
    ->get();
foreach ($statuses as $s) {
    echo "  {$s->inventory_status}: {$s->cnt}\n";
}

echo "\n=== Orphaned Units (no donation_id) ===\n";
$orphans = DB::table('blood_inventory')->whereNull('donation_id')->count();
echo "  {$orphans} units with no donation_id\n";
