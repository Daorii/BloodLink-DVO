<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Main request header ──────────────────────────────────────────
        Schema::create('blood_requests', function (Blueprint $table) {
            $table->id('request_id');

            $table->unsignedBigInteger('hospital_id');
            $table->foreign('hospital_id')->references('hospital_id')->on('hospitals')->onDelete('cascade');

            // User who submitted the request (Hospital User or Issuance Personnel)
            $table->unsignedBigInteger('requested_by_user_id')->nullable();
            $table->foreign('requested_by_user_id')->references('user_id')->on('users')->onDelete('set null');

            // Urgency & scheduling
            $table->string('urgency_level', 20)->default('Routine');
            // Routine / Urgent / Emergency
            $table->date('date_needed');
            $table->dateTime('date_submitted')->useCurrent();

            // Hospital-side contact / reference
            $table->string('requesting_personnel', 100);
            $table->string('hospital_ref_no', 50)->nullable();
            $table->string('ward', 100)->nullable();
            $table->string('diagnosis', 255)->nullable();

            // Workflow status
            $table->string('request_status', 30)->default('Pending Verification');
            // Pending Verification / Verified / Approved / Partially Fulfilled / Fulfilled / Rejected

            // Issuance Personnel who processed it
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->foreign('processed_by')->references('user_id')->on('users')->onDelete('set null');

            $table->text('remarks')->nullable();

            // Whether the request was filed directly by Issuance Personnel
            $table->boolean('filed_by_issuance')->default(false);

            $table->timestamps();
        });

        // ── Per-item line rows (blood type + component + quantity) ───────
        Schema::create('blood_request_items', function (Blueprint $table) {
            $table->id('item_id');

            $table->unsignedBigInteger('request_id');
            $table->foreign('request_id')->references('request_id')->on('blood_requests')->onDelete('cascade');

            // Stored as strings — no separate lookup tables needed
            $table->string('blood_type', 10);   // O+, A-, B+, AB+, …
            $table->string('component', 50);     // PRBC, Platelet Concentrate, FFP, …
            $table->unsignedInteger('quantity_requested')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blood_request_items');
        Schema::dropIfExists('blood_requests');
    }
};
