<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ActivityController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProjectController;
use App\Http\Controllers\API\ProjectMemberController;
use App\Http\Controllers\API\TaskController;

Route::get('/', function () {
    return response()->json([
        'message' => 'Hello World'
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/admin/users', [AuthController::class, 'getAllUsers']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);


    Route::apiResource('tasks', TaskController::class);
    Route::get('/activities', [ActivityController::class, 'index']);

    Route::apiResource('projects', ProjectController::class);
    Route::post('/projects/{project}/reorder', [TaskController::class, 'reorder']);
    Route::get('/projects/{project}/members', [ProjectMemberController::class, 'index']);
    Route::post('/projects/{project}/members', [ProjectMemberController::class, 'store']);
    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);
 // create proect manager
    Route::post('/admin/add-project-manager', [AuthController::class, 'createProjectManager']);
    // admin and proect manager adding users to system
    Route::post('/add-user', [AuthController::class, 'createUser']);

    // admin and project manager can create projects
    Route::post('/projects/create', [ProjectController::class, 'store']);
    });
// admin routes

