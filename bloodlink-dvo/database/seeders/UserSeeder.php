<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed the users table with the 6 initial system users
     * matching the frontend's initialUsers array in useBloodStore.js.
     *
     * Frontend reference:
     *   USR-001 → Super Admin       → superadmin@bloodlink.dvo
     *   USR-002 → Administrator     → admin@bloodlink.dvo
     *   USR-003 → Registry Staff    → registry@bloodlink.dvo
     *   USR-004 → Blood Bank Staff  → bloodbank@bloodlink.dvo
     *   USR-005 → Issuance Personnel→ issuance@bloodlink.dvo
     *   USR-006 → Hospital User     → hospital@bloodlink.dvo  (HOSP-001)
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('pass123');

        $users = [
            [
                'role_id'        => 1, // Super Admin
                'hospital_id'    => null,
                'first_name'     => 'DOH',
                'middle_name'    => null,
                'last_name'      => 'Super Admin',
                'email'          => 'superadmin@bloodlink.dvo',
                'password'       => $defaultPassword,
                'contact_number' => null,
                'status'         => 'Active',
            ],
            [
                'role_id'        => 2, // Administrator
                'hospital_id'    => null,
                'first_name'     => 'DOH',
                'middle_name'    => null,
                'last_name'      => 'Medical Officer IV',
                'email'          => 'admin@bloodlink.dvo',
                'password'       => $defaultPassword,
                'contact_number' => null,
                'status'         => 'Active',
            ],
            [
                'role_id'        => 3, // Registry Staff
                'hospital_id'    => null,
                'first_name'     => 'Nurse Joy',
                'middle_name'    => null,
                'last_name'      => 'Cruz',
                'email'          => 'registry@bloodlink.dvo',
                'password'       => $defaultPassword,
                'contact_number' => null,
                'status'         => 'Active',
            ],
            [
                'role_id'        => 4, // Blood Bank Staff
                'hospital_id'    => null,
                'first_name'     => 'RMT Mark',
                'middle_name'    => null,
                'last_name'      => 'Lopez',
                'email'          => 'bloodbank@bloodlink.dvo',
                'password'       => $defaultPassword,
                'contact_number' => null,
                'status'         => 'Active',
            ],
            [
                'role_id'        => 5, // Issuance Personnel
                'hospital_id'    => null,
                'first_name'     => 'SNBC Issuance',
                'middle_name'    => null,
                'last_name'      => 'Officer',
                'email'          => 'issuance@bloodlink.dvo',
                'password'       => $defaultPassword,
                'contact_number' => null,
                'status'         => 'Active',
            ],
            [
                'role_id'        => 6, // Hospital User
                'hospital_id'    => 1, // HOSP-001: Southern Philippines Medical Center (SPMC)
                'first_name'     => 'Dr. Roberto',
                'middle_name'    => null,
                'last_name'      => 'Santos',
                'email'          => 'hospital@bloodlink.dvo',
                'password'       => $defaultPassword,
                'contact_number' => null,
                'status'         => 'Active',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
