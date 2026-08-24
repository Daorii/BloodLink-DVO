<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Hospitals table must run AFTER roles but BEFORE users
     * because users has a FK to hospitals (hospital_id).
     */
    public function up(): void
    {
        Schema::create('hospitals', function (Blueprint $table) {
            $table->id('hospital_id');

            // Core info — field names match the frontend exactly
            $table->string('name', 150);
            $table->string('type', 20)->default('Government'); // Government / Private / Blood Bank
            $table->string('contact', 100)->nullable();        // contact person name
            $table->string('phone', 20)->nullable();           // contact number
            $table->string('email', 100)->nullable();
            $table->text('address');

            // Registration status: Active / Pending / Suspended
            // (frontend uses "Active" not "Verified" — aligned here)
            $table->string('registration_status', 20)->default('Pending');

            // Admin who registered this hospital (nullable — not required by frontend)
            $table->unsignedBigInteger('registered_by')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hospitals');
    }
};
