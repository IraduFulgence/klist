<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Admin: list all employees, optionally filtered by department/role.
     */
    public function index(Request $request)
    {
        $query = User::with('department:id,name')->orderBy('name');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        return response()->json($query->get());
    }

    /**
     * Admin: create an employee with any role.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'telephone' => 'required|string|max:20|unique:users,telephone|min:12|regex:/^\+?[0-9]{10,15}$/',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,project_manager,user',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json($user->load('department:id,name'), 201);
    }

    /**
     * Admin: update an employee's profile, role, or department.
     */
    public function update(User $user, Request $request)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'telephone' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('users', 'telephone')->ignore($user->id)],
            'role' => 'sometimes|required|in:admin,project_manager,user',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $user->update($data);

        return response()->json($user->load('department:id,name'));
    }

    /**
     * Admin: deactivate/reactivate an employee.
     */
    public function setActive(User $user, Request $request)
    {
        $data = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $user->update(['is_active' => $data['is_active']]);

        return response()->json($user->load('department:id,name'));
    }
}
