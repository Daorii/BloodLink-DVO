<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    /**
     * Seed the hospitals table with the 4 initial hospitals
     * matching the frontend's initialHospitals array in useBloodStore.js.
     */
    public function run(): void
    {
        $hospitals = [
            [
                'hospital_id'         => 1,
                'name'                => 'Southern Philippines Medical Center (SPMC)',
                'type'                => 'Government',
                'contact'             => 'Dr. Maria Santos',
                'phone'               => '0917-000-0001',
                'email'               => 'bloodbank@spmc.gov.ph',
                'address'             => 'J.P. Laurel Ave., Bajada, Davao City',
                'registration_status' => 'Active',
                'registered_by'       => null,
            ],
            [
                'hospital_id'         => 2,
                'name'                => 'Davao Doctors Hospital',
                'type'                => 'Private',
                'contact'             => 'Dr. Juan Reyes',
                'phone'               => '0917-000-0002',
                'email'               => 'blood@davaodoctors.com',
                'address'             => 'E. Quirino Ave., Davao City',
                'registration_status' => 'Active',
                'registered_by'       => null,
            ],
            [
                'hospital_id'         => 3,
                'name'                => 'San Pedro Hospital',
                'type'                => 'Private',
                'contact'             => 'Dr. Ana Cruz',
                'phone'               => '0917-000-0003',
                'email'               => 'blood@sanpedro.ph',
                'address'             => 'Ponciano St., Davao City',
                'registration_status' => 'Active',
                'registered_by'       => null,
            ],
            [
                'hospital_id'         => 4,
                'name'                => 'Philippine Red Cross – Davao Chapter',
                'type'                => 'Blood Bank',
                'contact'             => 'Ms. Joy Villanueva',
                'phone'               => '0917-000-0004',
                'email'               => 'davao@redcross.org.ph',
                'address'             => 'Anda St., Davao City',
                'registration_status' => 'Active',
                'registered_by'       => null,
            ],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::updateOrCreate(
                ['hospital_id' => $hospital['hospital_id']],
                $hospital
            );
        }
    }
}
