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
        Schema::create('project_risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('risk_name');
            $table->text('description')->nullable();
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['open', 'mitigated', 'closed'])->default('open');
            $table->string('mitigation_plan')->nullable();
            $table->date('identified_date');
            $table->date('mitigation_date')->nullable();
            $table->foreignId('added_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('mitigated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('probability')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_risks');
    }
};
