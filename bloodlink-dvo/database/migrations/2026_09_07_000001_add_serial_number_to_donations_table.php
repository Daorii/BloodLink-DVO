<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            // Serial/Segment Number — e.g. "2026-0001"
            // Auto-generated at lab result encoding; editable by staff for pre-printed bag numbers
            $table->string('serial_number', 20)->nullable()->unique()->after('donation_date');
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn('serial_number');
        });
    }
};
