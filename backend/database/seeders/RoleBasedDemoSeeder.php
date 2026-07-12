<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Project;
use App\Models\Setting;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RoleBasedDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $engineering = Department::firstOrCreate(['name' => 'Engineering']);
            $design = Department::firstOrCreate(['name' => 'Design']);

            $admin = User::firstOrCreate(
                ['email' => 'admin@example.com'],
                [
                    'name' => 'Ada Admin',
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'telephone' => '+15550000001',
                ]
            );

            $pm1 = User::firstOrCreate(
                ['email' => 'pm1@example.com'],
                [
                    'name' => 'Priya Manager',
                    'password' => Hash::make('password'),
                    'role' => 'project_manager',
                    'department_id' => $engineering->id,
                    'telephone' => '+15550000002',
                ]
            );

            $pm2 = User::firstOrCreate(
                ['email' => 'pm2@example.com'],
                [
                    'name' => 'Paul Manager',
                    'password' => Hash::make('password'),
                    'role' => 'project_manager',
                    'department_id' => $design->id,
                    'telephone' => '+15550000003',
                ]
            );

            $members = collect([
                ['name' => 'Tom Team', 'email' => 'member1@example.com', 'department_id' => $engineering->id, 'telephone' => '+15550000004'],
                ['name' => 'Tina Team', 'email' => 'member2@example.com', 'department_id' => $engineering->id, 'telephone' => '+15550000005'],
                ['name' => 'Deb Designer', 'email' => 'member3@example.com', 'department_id' => $design->id, 'telephone' => '+15550000006'],
                ['name' => 'Dan Designer', 'email' => 'member4@example.com', 'department_id' => $design->id, 'telephone' => '+15550000007'],
            ])->map(fn ($attrs) => User::firstOrCreate(
                ['email' => $attrs['email']],
                array_merge($attrs, ['password' => Hash::make('password'), 'role' => 'user'])
            ));

            $projectsData = [
                ['name' => 'Website Revamp', 'manager' => $pm1, 'members' => [$members[0], $members[1]]],
                ['name' => 'Mobile App Redesign', 'manager' => $pm2, 'members' => [$members[2], $members[3]]],
            ];

            foreach ($projectsData as $projectData) {
                $project = Project::firstOrCreate(
                    ['name' => $projectData['name']],
                    [
                        'owner' => $projectData['manager']->name,
                        'manager_id' => $projectData['manager']->id,
                        'description' => $projectData['name'] . ' project',
                        'start_date' => now()->subMonth(),
                        'end_date' => now()->addMonths(2),
                        'status' => 'in_progress',
                        'budget' => 10000,
                        'priority' => 'high',
                        'completion_percentage' => 35,
                        'color' => '#6366f1',
                    ]
                );

                foreach ($projectData['members'] as $member) {
                    if (! $project->members()->where('user_id', $member->id)->exists()) {
                        $project->members()->attach($member->id, ['role' => 'member']);
                    }
                }

                if ($project->milestones()->count() === 0) {
                    $milestone1 = $project->milestones()->create([
                        'title' => 'Discovery & Planning',
                        'due_date' => now()->subWeeks(2),
                        'status' => 'completed',
                        'completion_percentage' => 100,
                    ]);

                    $milestone2 = $project->milestones()->create([
                        'title' => 'Implementation',
                        'due_date' => now()->addWeeks(2),
                        'status' => 'in_progress',
                        'completion_percentage' => 40,
                    ]);

                    $statuses = ['todo', 'in_progress', 'completed'];
                    foreach ($projectData['members'] as $i => $member) {
                        $task = $project->tasks()->create([
                            'user_id' => $projectData['manager']->id,
                            'assignee_id' => $member->id,
                            'title' => "Task for {$member->name}",
                            'description' => 'Demo seeded task',
                            'start_date' => now()->subDays(2),
                            'due_date' => now()->addDays(5 + $i),
                            'status' => $statuses[$i % count($statuses)],
                            'completed' => $statuses[$i % count($statuses)] === 'completed',
                            'priority' => 'medium',
                            'position' => $i,
                            'milestone_id' => $i % 2 === 0 ? $milestone1->id : $milestone2->id,
                        ]);

                        $task->comments()->create([
                            'user_id' => $member->id,
                            'content' => 'Working on this now.',
                        ]);
                    }

                    $project->expenses()->create([
                        'expense_name' => 'Tooling license',
                        'amount' => 500,
                        'expense_date' => now()->subWeek(),
                        'added_by' => $projectData['manager']->id,
                        'status' => 'approved',
                    ]);
                }
            }

            Setting::firstOrCreate([], ['company_name' => 'Acme Inc.', 'timezone' => 'UTC']);
        });
    }
}
