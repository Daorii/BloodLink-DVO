<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donation_events', function (Blueprint $table) {
            $table->id('event_id');
            $table->string('province', 100);
            $table->string('city_municipality', 100);
            $table->string('barangay_organization', 100);
            $table->date('event_date');

            // Who created this event
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('user_id')->on('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_events');
    }
};
