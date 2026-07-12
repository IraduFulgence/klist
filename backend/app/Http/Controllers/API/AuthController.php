<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        
        $data = $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|max:20|unique:users,telephone|min:12|regex:/^\+?[0-9]{10,15}$/',
            'password' => 'required|string|min:8',
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;
        // update the user's last_seen and is_online status
        
        $user->is_online = true;
        $user->save();
        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        // let's also update the user's last_seen and is_online status
        $user = $request->user();
        $user->last_seen = now();
        $user->is_online = false;
        $user->save();
        return response()->json(['message' => 'Logged out']);
    }
    // admin and project manager adding team members to system
    public function createUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'telephone' => 'required|string|max:20|unique:users,telephone|min:12|regex:/^\+?[0-9]{10,15}$/',
            'password' => 'required|string|min:8',
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create(array_merge($data, ['role' => 'user']));
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }
    // change password
    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        // check if the current password matches
        if (! Hash::check($data['current_password'], $request->user()->password)) {
            return response()->json(['message' => 'Current password does not match'], 400);
        }
        $request->user()->update(['password' => Hash::make($data['new_password'])]);
        return response()->json(['message' => 'Password changed successfully']);
    }
}