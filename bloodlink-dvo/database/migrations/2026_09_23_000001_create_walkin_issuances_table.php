<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Walk-in issuance header ─────────────────────────────────────────
        Schema::create('walkin_issuances', function (Blueprint $table) {
            $table->id('walkin_issuance_id');

            // Patient information
            $table->string('patient_name', 150);
            $table->unsignedTinyInteger('patient_age')->nullable();
            $table->string('patient_gender', 10)->nullable();   // Male | Female | Other
            $table->string('diagnosis', 255)->nullable();
            $table->string('attending_physician', 150)->nullable();
            $table->string('purpose', 50)->default('Other');   // Surgery | Emergency | Elective | Other

            // Issuance Personnel who issued the blood
            $table->unsignedBigInteger('issued_by')->nullable();
            $table->foreign('issued_by')->references('user_id')->on('users')->onDelete('set null');

            $table->dateTime('issuance_date')->useCurrent();

            // Completed | Cancelled
            $table->string('status', 20)->default('Completed');

            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // ── Walk-in issuance line items (individual bag assignments) ────────
        Schema::create('walkin_issuance_items', function (Blueprint $table) {
            $table->id('walkin_item_id');

            $table->unsignedBigInteger('walkin_issuance_id');
            $table->foreign('walkin_issuance_id')
                  ->references('walkin_issuance_id')
                  ->on('walkin_issuances')
                  ->onDelete('cascade');

            // The specific blood bag assigned — marks it as Issued
            $table->unsignedBigInteger('unit_id');
            $table->foreign('unit_id')
                  ->references('unit_id')
                  ->on('blood_inventory')
                  ->onDelete('restrict');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('walkin_issuance_items');
        Schema::dropIfExists('walkin_issuances');
    }
};
