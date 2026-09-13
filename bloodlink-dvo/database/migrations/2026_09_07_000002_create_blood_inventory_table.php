<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blood_inventory', function (Blueprint $table) {
            $table->id('unit_id');

            // Link to the donation that produced this unit (via serial number)
            $table->unsignedBigInteger('donation_id')->nullable();
            $table->foreign('donation_id')->references('donation_id')->on('donations')->onDelete('set null');

            // Physical bag identifier (barcode / pre-printed serial on the bag)
            $table->string('unit_code', 50)->nullable(); // e.g. "BAG-DVO-2026-001"

            // Blood classification
            $table->string('blood_type', 10);           // O+, A-, etc.
            $table->string('component', 50);            // PRBC, FFP, Platelet Concentrate, etc.

            // Volume in CC
            $table->decimal('volume_cc', 8, 2);

            // Dates
            $table->date('collection_date');
            $table->date('expiration_date');

            // Status tracking
            $table->string('safety_status', 30)->default('Cleared');   // Cleared | Hold-Quarantined | NCU | NS | Discarded
            $table->string('intended_use', 30)->default('Transfusable'); // Transfusable | Storage-Research Only | Restricted
            $table->string('inventory_status', 20)->default('Available'); // Available | Reserved | Issued | Expired | Discarded

            // Who recorded this unit
            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->foreign('recorded_by')->references('user_id')->on('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blood_inventory');
    }
};
