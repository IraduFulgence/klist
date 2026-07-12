<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show()
    {
        return response()->json(Setting::firstOrCreate([]));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'timezone' => 'sometimes|required|string|max:100',
        ]);

        $setting = Setting::firstOrCreate([]);
        $setting->update($data);

        return response()->json($setting);
    }
}
