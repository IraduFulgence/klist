<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectExpense;
use Illuminate\Http\Request;

class ProjectExpenseController extends Controller
{
    public function index(Project $project, Request $request)
    {
        $this->authorizeManager($project, $request->user());

        return response()->json($project->expenses()->with('addedBy:id,name,email')->latest('expense_date')->get());
    }

    public function store(Project $project, Request $request)
    {
        $this->authorizeManager($project, $request->user());

        $data = $request->validate([
            'expense_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $expense = $project->expenses()->create(array_merge($data, [
            'added_by' => $request->user()->id,
        ]));

        return response()->json($expense->load('addedBy:id,name,email'), 201);
    }

    public function update(ProjectExpense $expense, Request $request)
    {
        $this->authorizeManager($expense->project, $request->user());

        $data = $request->validate([
            'expense_name' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'expense_date' => 'sometimes|required|date',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $expense->update($data);

        return response()->json($expense->load('addedBy:id,name,email'));
    }

    public function destroy(ProjectExpense $expense, Request $request)
    {
        $this->authorizeManager($expense->project, $request->user());

        $expense->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function authorizeManager(Project $project, $user): void
    {
        if (! $project->isManager($user)) {
            abort(403);
        }
    }
}
