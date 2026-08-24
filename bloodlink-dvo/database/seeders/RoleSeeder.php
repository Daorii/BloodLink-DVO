<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seed the roles table with the 6 system roles
     * matching the frontend's role definitions.
     */
    public function run(): void
    {
        $roles = [
            ['role_id' => 1, 'role_name' => 'Super Admin'],
            ['role_id' => 2, 'role_name' => 'Administrator'],
            ['role_id' => 3, 'role_name' => 'Registry Staff'],
            ['role_id' => 4, 'role_name' => 'Blood Bank Staff'],
            ['role_id' => 5, 'role_name' => 'Issuance Personnel'],
            ['role_id' => 6, 'role_name' => 'Hospital User'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['role_id' => $role['role_id']],
                ['role_name' => $role['role_name']]
            );
        }
    }
}
