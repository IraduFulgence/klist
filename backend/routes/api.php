<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ActivityController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CommentController;
use App\Http\Controllers\API\DepartmentController;
use App\Http\Controllers\API\MilestoneController;
use App\Http\Controllers\API\ProjectController;
use App\Http\Controllers\API\ProjectExpenseController;
use App\Http\Controllers\API\ProjectFileController;
use App\Http\Controllers\API\ProjectMemberController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\SettingsController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\UserController;

Route::get('/', function () {
    return response()->json([
        'message' => 'Hello World'
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    Route::apiResource('tasks', TaskController::class);
    Route::get('/activities', [ActivityController::class, 'index']);

    Route::apiResource('projects', ProjectController::class)->except(['store']);
    Route::post('/projects', [ProjectController::class, 'store'])->middleware('role:admin,project_manager');
    Route::post('/projects/{project}/reorder', [TaskController::class, 'reorder']);
    Route::get('/projects/{project}/members', [ProjectMemberController::class, 'index']);
    Route::post('/projects/{project}/members', [ProjectMemberController::class, 'store']);
    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);

    // Milestones
    Route::get('/projects/{project}/milestones', [MilestoneController::class, 'index']);
    Route::post('/projects/{project}/milestones', [MilestoneController::class, 'store']);
    Route::patch('/milestones/{milestone}', [MilestoneController::class, 'update']);
    Route::delete('/milestones/{milestone}', [MilestoneController::class, 'destroy']);

    // Documents
    Route::get('/projects/{project}/files', [ProjectFileController::class, 'index']);
    Route::post('/projects/{project}/files', [ProjectFileController::class, 'store']);
    Route::get('/files/{file}/download', [ProjectFileController::class, 'download']);
    Route::delete('/files/{file}', [ProjectFileController::class, 'destroy']);

    // Comments
    Route::get('/tasks/{task}/comments', [CommentController::class, 'index']);
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store']);
    Route::patch('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Project budget/expenses (PM/admin only)
    Route::get('/projects/{project}/expenses', [ProjectExpenseController::class, 'index']);
    Route::post('/projects/{project}/expenses', [ProjectExpenseController::class, 'store']);
    Route::patch('/expenses/{expense}', [ProjectExpenseController::class, 'update']);
    Route::delete('/expenses/{expense}', [ProjectExpenseController::class, 'destroy']);

    // Reports
    Route::get('/reports/projects/{project}', [ReportController::class, 'project']);

    // Departments (read is open to any authenticated user, writes are admin-only below)
    Route::get('/departments', [DepartmentController::class, 'index']);

    // Org settings (read is open to any authenticated user, writes are admin-only below)
    Route::get('/settings', [SettingsController::class, 'show']);

    // Admin and project manager can create projects
    Route::post('/projects/create', [ProjectController::class, 'store'])->middleware('role:admin,project_manager');

    // Admin and project manager can add team members to the system
    Route::post('/add-user', [AuthController::class, 'createUser'])->middleware('role:admin,project_manager');

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::patch('/admin/users/{user}', [UserController::class, 'update']);
        Route::patch('/admin/users/{user}/active', [UserController::class, 'setActive']);

        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::patch('/departments/{department}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);

        Route::patch('/projects/{project}/manager', [ProjectController::class, 'assignManager']);

        Route::get('/reports/organization', [ReportController::class, 'organization']);

        Route::patch('/settings', [SettingsController::class, 'update']);
    });
});
