<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');

            // FK to roles table
            $table->unsignedBigInteger('role_id');
            $table->foreign('role_id')->references('role_id')->on('roles')->onDelete('restrict');

            // FK to hospitals table (only for Hospital Users)
            $table->unsignedBigInteger('hospital_id')->nullable();
            $table->foreign('hospital_id')->references('hospital_id')->on('hospitals')->onDelete('set null');

            // Name fields
            $table->string('first_name', 50);
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50);

            // Auth fields — email is the login identifier (aligned to frontend)
            $table->string('email', 100)->unique();
            $table->string('password', 255);

            // Contact
            $table->string('contact_number', 20)->nullable();

            // Account status
            $table->string('status', 20)->default('Active');

            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
