<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donor_recalls', function (Blueprint $table) {
            $table->id('recall_id');
            $table->unsignedBigInteger('donor_id');
            $table->date('recall_date');
            $table->string('sms_status', 20)->default('Pending'); // Sent / Failed / Pending
            $table->string('donor_response', 30)->nullable();     // Committed / No Response / NULL
            $table->string('recall_reason', 100)->nullable();     // e.g. Critical Shortage Match
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamps();

            $table->foreign('donor_id')->references('donor_id')->on('donors')->onDelete('cascade');
            $table->foreign('processed_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donor_recalls');
    }
};
