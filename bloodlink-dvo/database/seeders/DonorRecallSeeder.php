<?php

namespace Database\Seeders;

use App\Models\Donor;
use App\Models\DonorRecall;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DonorRecallSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $today = Carbon::today();

        $sampleDonors = [
            [
                'first_name'         => 'Ramil',
                'middle_name'        => 'Gomez',
                'last_name'          => 'Alcantara',
                'sex'                => 'Male',
                'civil_status'       => 'Married',
                'birth_date'         => '1992-04-15',
                'address'            => 'Buhangin, Davao City',
                'contact_number'     => '0917-555-0101',
                'email'              => 'ramil.alcantara@gmail.com',
                'blood_type'         => 'O-',
                'donor_status'       => 'Regular',
                'registration_date'  => $today->copy()->subDays(400)->toDateString(),
                'last_donation_date' => $today->copy()->subDays(95)->toDateString(), // 95 days ago -> Ready to Donate
                'total_donations'    => 4,
                'remarks'            => 'Eligible donor',
            ],
            [
                'first_name'         => 'Cristina',
                'middle_name'        => 'Santos',
                'last_name'          => 'Villanueva',
                'sex'                => 'Female',
                'civil_status'       => 'Single',
                'birth_date'         => '1996-08-20',
                'address'            => 'Matina, Davao City',
                'contact_number'     => '0928-555-0202',
                'email'              => 'cristina.v@gmail.com',
                'blood_type'         => 'AB+',
                'donor_status'       => 'Regular',
                'registration_date'  => $today->copy()->subDays(350)->toDateString(),
                'last_donation_date' => $today->copy()->subDays(110)->toDateString(), // 110 days ago -> Ready to Donate
                'total_donations'    => 3,
                'remarks'            => 'Eligible donor',
            ],
            [
                'first_name'         => 'Mark Anthony',
                'middle_name'        => 'Dela',
                'last_name'          => 'Torres',
                'sex'                => 'Male',
                'civil_status'       => 'Single',
                'birth_date'         => '1990-11-05',
                'address'            => 'Agdao, Davao City',
                'contact_number'     => '0919-555-0303',
                'email'              => 'mark.torres@yahoo.com',
                'blood_type'         => 'A-',
                'donor_status'       => 'Regular',
                'registration_date'  => $today->copy()->subDays(500)->toDateString(),
                'last_donation_date' => $today->copy()->subDays(125)->toDateString(), // 125 days ago -> Ready to Donate
                'total_donations'    => 6,
                'remarks'            => 'Eligible donor',
            ],
            [
                'first_name'         => 'Aileen',
                'middle_name'        => 'Bautista',
                'last_name'          => 'Mendoza',
                'sex'                => 'Female',
                'civil_status'       => 'Married',
                'birth_date'         => '1994-02-28',
                'address'            => 'Toril, Davao City',
                'contact_number'     => '0995-555-0404',
                'email'              => 'aileen.mendoza@gmail.com',
                'blood_type'         => 'B-',
                'donor_status'       => 'Regular',
                'registration_date'  => $today->copy()->subDays(280)->toDateString(),
                'last_donation_date' => $today->copy()->subDays(88)->toDateString(), // 88 days ago -> Eligible Soon (<5 days left)
                'total_donations'    => 2,
                'remarks'            => 'Eligible donor',
            ],
            [
                'first_name'         => 'Eduardo',
                'middle_name'        => 'Navarro',
                'last_name'          => 'Mercado',
                'sex'                => 'Male',
                'civil_status'       => 'Married',
                'birth_date'         => '1988-07-12',
                'address'            => 'Calinan, Davao City',
                'contact_number'     => '0918-555-0505',
                'email'              => 'ed.mercado@outlook.com',
                'blood_type'         => 'AB-',
                'donor_status'       => 'Regular',
                'registration_date'  => $today->copy()->subDays(600)->toDateString(),
                'last_donation_date' => $today->copy()->subDays(102)->toDateString(), // 102 days ago -> Ready to Donate
                'total_donations'    => 5,
                'remarks'            => 'Eligible donor',
            ],
        ];

        foreach ($sampleDonors as $data) {
            $donor = Donor::updateOrCreate(
                [
                    'first_name' => $data['first_name'],
                    'last_name'  => $data['last_name'],
                ],
                $data
            );
        }

        // Also add 2 past recall records to test the Recall Dispatch History table!
        $firstDonor = Donor::where('first_name', 'Ramil')->where('last_name', 'Alcantara')->first();
        $secondDonor = Donor::where('first_name', 'Cristina')->where('last_name', 'Villanueva')->first();

        if ($firstDonor) {
            DonorRecall::updateOrCreate(
                [
                    'donor_id'    => $firstDonor->donor_id,
                    'recall_date' => $today->copy()->subDays(14)->toDateString(),
                ],
                [
                    'sms_status'     => 'Sent',
                    'donor_response' => 'Committed',
                    'recall_reason'  => 'Critical Shortage Match (O-)',
                    'processed_by'   => 1,
                ]
            );
        }

        if ($secondDonor) {
            DonorRecall::updateOrCreate(
                [
                    'donor_id'    => $secondDonor->donor_id,
                    'recall_date' => $today->copy()->subDays(7)->toDateString(),
                ],
                [
                    'sms_status'     => 'Sent',
                    'donor_response' => 'No Response',
                    'recall_reason'  => 'Critical Shortage Match (AB+)',
                    'processed_by'   => 1,
                ]
            );
        }
    }
}
