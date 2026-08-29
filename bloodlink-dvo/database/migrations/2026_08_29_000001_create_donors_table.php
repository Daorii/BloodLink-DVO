<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donors', function (Blueprint $table) {
            $table->id('donor_id');

            // Name fields (frontend uses full "name" but split in DB)
            $table->string('first_name', 50);
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50);

            // Personal info — matches frontend fields exactly
            $table->string('sex', 10);           // Male / Female
            $table->string('civil_status', 20);  // Single / Married / Widowed / Divorced
            $table->date('birth_date');           // frontend: dob
            $table->text('address');
            $table->string('contact_number', 20); // frontend: phone
            $table->string('email', 100)->nullable();

            // Blood info — ADD blood_type (not in DD but frontend uses it)
            $table->string('blood_type', 50)->nullable(); // O+, A-, AB+, "Pending Conf.", etc.

            // Status: Regular / New / Lapsed / Deferred
            $table->string('donor_status', 20)->default('New'); // frontend: status

            // Donation tracking
            $table->date('registration_date');         // frontend: donationDate
            $table->date('last_donation_date')->nullable(); // frontend: lastDonation
            $table->integer('total_donations')->default(0); // frontend: totalDonations
            $table->string('remarks', 255)->nullable();     // frontend: remarks

            // Who registered this donor
            $table->unsignedBigInteger('registered_by')->nullable();
            $table->foreign('registered_by')->references('user_id')->on('users')->onDelete('set null');

            $table->timestamps(); // created_at + updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donors');
    }
};
