<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * DemoDataSeeder  (v3 - corrected per-component collection dates)
 *
 * Per-component shelf lives (DOH NVBSP):
 *   PRBC                 : 35 days  → collect max 28 days ago
 *   Platelet Concentrate : 5 days   → collect max 3 days ago
 *   FFP                  : 90 days  → collect max 70 days ago
 *   Cryoprecipitate      : 180 days → collect max 140 days ago
 *   Cryosupernate        : 365 days → collect max 300 days ago
 *
 * Target per-component counts:
 *   All Safe blood types (O+,O-,A+,A-,B+,B-): 55 per component (105 for O-)
 *   AB+ PRBC = 20 (LOW)  — all other AB+ components = 55
 *   AB- FFP  = 3 (CRITICAL) — all other AB- components = 55
 *
 * Run: php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    // Volume midpoints (cc) — DOH NVBSP reference ranges
    private const VOLUMES = [
        'PRBC'                 => 280.00,
        'Platelet Concentrate' => 60.00,
        'FFP'                  => 200.00,
        'Cryoprecipitate'      => 22.00,
        'Cryosupernate'        => 200.00,
    ];

    // Shelf life in days
    private const SHELF_DAYS = [
        'PRBC'                 => 35,
        'Platelet Concentrate' => 5,
        'FFP'                  => 90,
        'Cryoprecipitate'      => 180,
        'Cryosupernate'        => 365,
    ];

    // Max days ago for collection per component (with safety buffer)
    private const MAX_DAYS_AGO = [
        'PRBC'                 => 28,   // shelf=35, buffer=7
        'Platelet Concentrate' => 3,    // shelf=5,  buffer=2
        'FFP'                  => 70,   // shelf=90, buffer=20
        'Cryoprecipitate'      => 140,  // shelf=180, buffer=40
        'Cryosupernate'        => 300,  // shelf=365, buffer=65
    ];

    // Min days ago (for realistic spread)
    private const MIN_DAYS_AGO = [
        'PRBC'                 => 3,
        'Platelet Concentrate' => 1,
        'FFP'                  => 5,
        'Cryoprecipitate'      => 10,
        'Cryosupernate'        => 15,
    ];

    public function run(): void
    {
        // Guard: skip if already seeded
        if (DB::table('donations')->where('serial_number', 'like', 'DEMO-2026-%')->exists()) {
            $this->command->info('DemoDataSeeder: already seeded. Run cleanup_demo.php to reset.');
            return;
        }

        $now = Carbon::now();

        $firstNames = [
            'Jose','Maria','Juan','Ana','Pedro','Rosa','Carlo','Liza','Manuel','Elena',
            'Ramon','Luisa','Eduardo','Carmen','Roberto','Juana','Fernando','Teresa','Antonio','Cecilia',
            'Rodrigo','Marites','Danilo','Rowena','Nestor','Maricel','Alfredo','Josephine','Renato','Mylene',
            'Edilberto','Glenda','Ernesto','Remedios','Rodel','Ligaya','Noel','Cristina','Arnel','Florencia',
            'Emmanuel','Rosario','Virgilio','Concepcion','Alejandro','Nimfa','Dominador','Teresita','Ruben','Erlinda',
            'Victorino','Margarita','Dionisio','Leonora','Hilario','Milagros','Crisanto','Resurreccion','Feliciano','Natividad',
            'Amado','Imelda','Gregorio','Estelita','Simplicio','Pilar','Ceferino','Lucinda','Atanacio','Dolores',
            'Benigno','Pacita','Mamerto','Estrella','Serafin','Adoracion','Tomas','Priscilla','Cirilo','Virginia',
            'Apolinario','Dalisay','Zosimo','Marilou','Paquito','Perla','Victoriano','Luz','Emilio','Rosalinda',
        ];

        $lastNames = [
            'Santos','Reyes','Cruz','Bautista','Ocampo','Garcia','Mendoza','Torres','Flores','Ramos',
            'Aquino','Dela Cruz','Gonzales','Lopez','Perez','Manalo','Soriano','Villanueva','Castillo','Morales',
            'Aguilar','Navarro','Espinosa','Domingo','Macaraeg','Pascual','Salazar','Tolentino','Delos Santos','Enriquez',
            'Fernandez','Guerrero','Ilagan','Javier','Labrador','Molina','Nicolas','Ortiz','Paguia','Rivera',
            'Salamanca','Tupas','Valera','Villon','Yap','Zablan','Benedicto','Calderon','Ebrada','Francisco',
            'Herrera','Ignacio','Junio','Katigbak','Lagman','Magalona','Nacino','Orozco','Panganiban','Recio',
            'Sarmiento','Teves','Vargas','Velasquez','Yambot','Zulueta','Adlaon','Baylon','Cadapan','Dadivas',
            'Ebarle','Felias','Guda','Hubaldo','Ibanez','Kintanar','Gler','Ureta','Quitain','Ugdoracion',
            'Wenceslao','Wagan','Yusoph','Zerrudo','Abdurahim','Balinas','Cedeno','Dapitan','Larraga','Omandam',
        ];

        $addresses = [
            'Blk 4 Lot 2, Buhangin, Davao City',
            'Purok 5, Agdao, Davao City',
            'Zone 3, Toril, Davao City',
            '123 Cabaguio Ave., Agdao, Davao City',
            'Prk. Maligaya, Talomo, Davao City',
            'Blk 12 Lot 6, Panacan, Davao City',
            'Purok 1, Matina, Davao City',
            'Prk. 7, Sasa, Davao City',
            '456 Quimpo Blvd., Poblacion, Davao City',
            'Zone 8, Catigan, Toril, Davao City',
            'Blk 2 Lot 9, Communal, Buhangin, Davao City',
            'Purok 3, Calinan, Davao City',
            'Prk. Bagong Silang, Mintal, Davao City',
            'Blk 7 Lot 4, Bago Aplaya, Talomo, Davao City',
            'Zone 1, Tibungco, Davao City',
        ];

        $civilStatuses = ['Single', 'Married', 'Married', 'Widowed', 'Single'];
        $allFive = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];

        // Batch definitions: [blood_type, donor_count, components[]]
        $batches = [
            ['O+',  55,  $allFive],
            ['O-',  105, $allFive],
            ['A+',  55,  $allFive],
            ['A-',  55,  $allFive],
            ['B+',  55,  $allFive],
            ['B-',  55,  $allFive],
            ['AB+', 20,  ['PRBC']],                                                         // AB+ PRBC = 20 (LOW)
            ['AB+', 55,  ['Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate']], // AB+ others = Safe
            ['AB-', 55,  ['PRBC', 'Platelet Concentrate', 'Cryoprecipitate', 'Cryosupernate']], // AB- others = Safe
            ['AB-', 3,   ['FFP']],                                                          // AB- FFP = 3 (CRITICAL)
        ];

        $serialCounter = 1;
        $unitCounter   = 1;
        $donorCounter  = 0;

        foreach ($batches as $batch) {
            [$bloodType, $donorCount, $components] = $batch;

            for ($d = 0; $d < $donorCount; $d++) {
                $i = $donorCounter++;

                // Use PRBC collection date as the donation date (most clinically relevant)
                $prbcRange   = self::MAX_DAYS_AGO['PRBC'] - self::MIN_DAYS_AGO['PRBC']; // 25
                $donationDaysAgo = ($i % $prbcRange) + self::MIN_DAYS_AGO['PRBC']; // 3..27
                $donationDate    = $now->copy()->subDays($donationDaysAgo)->toDateString();

                // Registration: 6-30 months before donation date
                $regMonthsBefore  = ($i % 25) + 6;
                $registrationDate = Carbon::parse($donationDate)->subMonths($regMonthsBefore)->toDateString();

                // Birth date: donor age 22-58 in 2026
                $birthYear  = 1968 + ($i % 37);
                $birthMonth = str_pad(($i % 12) + 1, 2, '0', STR_PAD_LEFT);
                $birthDay   = str_pad(($i % 28) + 1, 2, '0', STR_PAD_LEFT);
                $birthDate  = "{$birthYear}-{$birthMonth}-{$birthDay}";

                $totalDons = ($i % 9) + 1;
                $sex       = ($i % 2 === 0) ? 'Male' : 'Female';
                $firstName = $firstNames[$i % count($firstNames)];
                $lastName  = $lastNames[$i % count($lastNames)];
                $civil     = $civilStatuses[$i % count($civilStatuses)];
                $address   = $addresses[$i % count($addresses)];
                $contact   = '09' . str_pad((string)(170000000 + $i), 9, '0', STR_PAD_LEFT);

                // Insert donor
                $donorId = DB::table('donors')->insertGetId([
                    'first_name'         => $firstName,
                    'middle_name'        => null,
                    'last_name'          => $lastName,
                    'sex'                => $sex,
                    'civil_status'       => $civil,
                    'birth_date'         => $birthDate,
                    'address'            => $address,
                    'contact_number'     => $contact,
                    'email'              => null,
                    'blood_type'         => $bloodType,
                    'donor_status'       => $totalDons >= 4 ? 'Regular' : 'New',
                    'registration_date'  => $registrationDate,
                    'last_donation_date' => $donationDate,
                    'total_donations'    => $totalDons,
                    'remarks'            => null,
                    'registered_by'      => null,
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ]);

                // Insert donation
                $serial     = 'DEMO-2026-' . str_pad((string)$serialCounter++, 4, '0', STR_PAD_LEFT);
                $donationId = DB::table('donations')->insertGetId([
                    'donor_id'          => $donorId,
                    'event_id'          => null,
                    'donation_date'     => $donationDate,
                    'serial_number'     => $serial,
                    'screening_outcome' => 'Accepted',
                    'deferral_reason'   => null,
                    'deferral_end_date' => null,
                    'recorded_by'       => null,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);

                // Insert blood inventory units — each component uses its own safe date range
                foreach ($components as $component) {
                    $minDays = self::MIN_DAYS_AGO[$component];
                    $maxDays = self::MAX_DAYS_AGO[$component];
                    $range   = $maxDays - $minDays; // cycle range

                    $daysAgo = ($i % $range) + $minDays; // always within shelf life
                    $colDate = $now->copy()->subDays($daysAgo)->toDateString();
                    $expDate = Carbon::parse($colDate)->addDays(self::SHELF_DAYS[$component])->toDateString();

                    $unitCode = 'BAG-DVO-2026-' . str_pad((string)$unitCounter++, 4, '0', STR_PAD_LEFT);

                    DB::table('blood_inventory')->insert([
                        'donation_id'      => $donationId,
                        'unit_code'        => $unitCode,
                        'blood_type'       => $bloodType,
                        'component'        => $component,
                        'volume_cc'        => self::VOLUMES[$component],
                        'collection_date'  => $colDate,
                        'expiration_date'  => $expDate,
                        'safety_status'    => 'Cleared',
                        'intended_use'     => 'Transfusable',
                        'inventory_status' => 'Available',
                        'remarks'          => null,
                        'status_date'      => null,
                        'rejection_reason' => null,
                        'verified_by'      => null,
                        'recorded_by'      => null,
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]);
                }
            }
        }

        $totalUnits  = $unitCounter - 1;
        $totalDonors = $donorCounter;
        $this->command->info("DemoDataSeeder v3: Done!");
        $this->command->info("  Seeded: {$totalDonors} donors | {$totalDonors} donations | {$totalUnits} blood units");
        $this->command->info("  Target counts per component:");
        $this->command->info("    O+(55ea) O-(105ea) A+(55ea) A-(55ea) B+(55ea) B-(55ea)");
        $this->command->info("    AB+ PRBC=20(LOW)  |  AB- FFP=3(CRITICAL)  |  all other cells=55");
    }
}
