<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->foreignId('assignee_id')->nullable()->after('project_id')->constrained('users')->nullOnDelete();
            $table->enum('status', ['todo', 'in_progress', 'completed','onhold','cancelled'])->default('todo')->after('completed');
            $table->enum('priority', ['low', 'medium', 'high','critical'])->default('medium')->after('status');
            $table->integer('position')->default(0)->after('priority');
            $table->foreignId('milestone_id')->nullable()->after('position')->constrained('milestones')->nullOnDelete();
            $table->string('estimated_hours')->nullable()->after('milestone_id');
            $table->string('actual_hours')->nullable()->after('estimated_hours');
            
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_id');
            $table->dropConstrainedForeignId('assignee_id');
            $table->dropColumn(['status', 'priority', 'position']);
        });
    }
};
