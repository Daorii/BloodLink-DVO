<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Issuance header — created when Blood Bank processes a request ──
        Schema::create('blood_issuances', function (Blueprint $table) {
            $table->id('issuance_id');

            $table->unsignedBigInteger('request_id');
            $table->foreign('request_id')->references('request_id')->on('blood_requests')->onDelete('cascade');

            // Blood Bank Staff who prepared the blood units
            $table->unsignedBigInteger('processed_by');
            $table->foreign('processed_by')->references('user_id')->on('users')->onDelete('restrict');

            $table->dateTime('issuance_date')->useCurrent();

            // Issuance Personnel who approved physical release (filled later)
            $table->unsignedBigInteger('release_approved_by')->nullable();
            $table->foreign('release_approved_by')->references('user_id')->on('users')->onDelete('set null');

            $table->dateTime('release_date')->nullable();

            // Prepared | Released | Cancelled
            $table->string('status', 20)->default('Prepared');

            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // ── Line items — what was actually prepared per blood type/component ──
        Schema::create('blood_issuance_items', function (Blueprint $table) {
            $table->id('issuance_item_id');

            $table->unsignedBigInteger('issuance_id');
            $table->foreign('issuance_id')->references('issuance_id')->on('blood_issuances')->onDelete('cascade');

            $table->string('blood_type', 10);
            $table->string('component', 50);
            $table->unsignedInteger('quantity_issued')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blood_issuance_items');
        Schema::dropIfExists('blood_issuances');
    }
};
