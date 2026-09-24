<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $userIds = DB::table('users')->where('role_id', 4)->pluck('user_id');
        if ($userIds->isNotEmpty()) {
            DB::table('personal_access_tokens')->where('tokenable_type', 'App\\Models\\User')->whereIn('tokenable_id', $userIds)->delete();
            DB::table('users')->whereIn('user_id', $userIds)->delete();
        }
        DB::table('roles')->where('role_id', 4)->delete();
        DB::table('roles')->updateOrInsert(['role_id' => 7], ['role_name' => 'Serology Staff', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('roles')->updateOrInsert(['role_id' => 8], ['role_name' => 'Production Staff', 'created_at' => now(), 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('roles')->whereIn('role_id', [7, 8])->delete();
        DB::table('roles')->updateOrInsert(['role_id' => 4], ['role_name' => 'Blood Bank Staff', 'created_at' => now(), 'updated_at' => now()]);
    }
};
