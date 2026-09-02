<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->id('donation_id');

            $table->unsignedBigInteger('donor_id');
            $table->foreign('donor_id')->references('donor_id')->on('donors')->onDelete('cascade');

            $table->unsignedBigInteger('event_id')->nullable();
            $table->foreign('event_id')->references('event_id')->on('donation_events')->onDelete('set null');

            $table->date('donation_date');

            // Screening Outcome (Table 7)
            $table->string('screening_outcome', 30)->default('Accepted');
            // Accepted / Temporarily Deferred / Permanently Deferred / Indefinite Deferral
            $table->text('deferral_reason')->nullable();
            $table->date('deferral_end_date')->nullable();

            // Who recorded this
            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->foreign('recorded_by')->references('user_id')->on('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
