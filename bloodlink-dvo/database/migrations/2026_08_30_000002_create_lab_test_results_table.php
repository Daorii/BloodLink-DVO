<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_test_results', function (Blueprint $table) {
            $table->id('test_id');

            $table->unsignedBigInteger('donation_id');
            $table->foreign('donation_id')->references('donation_id')->on('donations')->onDelete('cascade');

            // Results — all nullable since they may be filled over time
            $table->string('hemoglobin_result', 20)->nullable();
            $table->string('blood_type_confirmed', 5)->nullable(); // A+, A-, B+, B-, AB+, AB-, O+, O-
            $table->string('hbsag_result', 20)->nullable();
            $table->string('syphilis_result', 20)->nullable();
            $table->string('hiv_result', 20)->nullable();
            $table->string('hcv_result', 20)->nullable();
            $table->string('malaria_result', 20)->nullable();
            $table->string('nat_result', 20)->nullable();
            $table->string('others_result', 50)->nullable();

            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->foreign('recorded_by')->references('user_id')->on('users')->onDelete('set null');

            $table->timestamps();

            // One donation → one lab result only
            $table->unique('donation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_results');
    }
};
