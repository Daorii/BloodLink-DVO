<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blood_inventory', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('remarks');
            $table->unsignedBigInteger('verified_by')->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('blood_inventory', function (Blueprint $table) {
            $table->dropColumn(['rejection_reason', 'verified_by']);
        });
    }
};
