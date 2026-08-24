<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * GET /api/users
     *
     * List all system users.
     */
    public function index(): JsonResponse
    {
        $users = User::with('roleRelation')->orderBy('user_id')->get();

        return response()->json([
            'users' => $users->map(fn (User $u) => $this->formatUser($u)),
        ]);
    }

    /**
     * GET /api/users/{id}
     *
     * Get a single user by user_id.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('roleRelation')->findOrFail($id);

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * POST /api/users
     *
     * Create a new system user.
     *
     * Expected request body (matching the frontend's addUserForm):
     * {
     *   firstName, lastName, email, password,
     *   contactNumber, role, roleId, status, hospitalId
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'firstName'     => 'required|string|max:50',
            'lastName'      => 'required|string|max:50',
            'email'         => 'required|email|max:100|unique:users,email',
            'password'      => 'nullable|string|min:6',
            'contactNumber' => 'nullable|string|max:20',
            'role'          => 'required|string',
            'status'        => 'nullable|string|in:Active,Inactive',
            'hospitalId'    => 'nullable|string',
        ]);

        // Resolve role_id from the role name
        $role = Role::where('role_name', $validated['role'])->first();
        if (! $role) {
            return response()->json(['message' => 'Invalid role specified.'], 422);
        }

        // Parse hospitalId: frontend sends "HOSP-001" format or empty string
        $hospitalId = null;
        if (! empty($validated['hospitalId'])) {
            $hospitalIdStr = $validated['hospitalId'];
            // Extract numeric part from "HOSP-001" format
            if (str_starts_with($hospitalIdStr, 'HOSP-')) {
                $hospitalId = (int) ltrim(str_replace('HOSP-', '', $hospitalIdStr), '0') ?: null;
            } else {
                $hospitalId = is_numeric($hospitalIdStr) ? (int) $hospitalIdStr : null;
            }
        }

        $user = User::create([
            'role_id'        => $role->role_id,
            'hospital_id'    => $hospitalId,
            'first_name'     => $validated['firstName'],
            'last_name'      => $validated['lastName'],
            'email'          => $validated['email'],
            'password'       => $validated['password'] ?? 'pass123',
            'contact_number' => $validated['contactNumber'] ?? null,
            'status'         => $validated['status'] ?? 'Active',
        ]);

        $user->load('roleRelation');

        return response()->json([
            'user'    => $this->formatUser($user),
            'message' => 'User registered successfully.',
        ], 201);
    }

    /**
     * PUT /api/users/{id}
     *
     * Update an existing user.
     *
     * Expected request body (matching the frontend's editUserForm):
     * {
     *   firstName, lastName, email, contactNumber, role, roleId, status
     * }
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'firstName'     => 'sometimes|required|string|max:50',
            'lastName'      => 'sometimes|required|string|max:50',
            'email'         => 'sometimes|required|email|max:100|unique:users,email,' . $user->user_id . ',user_id',
            'contactNumber' => 'nullable|string|max:20',
            'role'          => 'sometimes|required|string',
            'status'        => 'nullable|string|in:Active,Inactive',
        ]);

        // Build update array
        $updates = [];

        if (isset($validated['firstName'])) {
            $updates['first_name'] = $validated['firstName'];
        }
        if (isset($validated['lastName'])) {
            $updates['last_name'] = $validated['lastName'];
        }
        if (isset($validated['email'])) {
            $updates['email'] = $validated['email'];
        }
        if (array_key_exists('contactNumber', $validated)) {
            $updates['contact_number'] = $validated['contactNumber'];
        }
        if (isset($validated['status'])) {
            $updates['status'] = $validated['status'];
        }

        // Resolve role_id if role name changed
        if (isset($validated['role'])) {
            $role = Role::where('role_name', $validated['role'])->first();
            if ($role) {
                $updates['role_id'] = $role->role_id;
            }
        }

        $user->update($updates);
        $user->load('roleRelation');

        return response()->json([
            'user'    => $this->formatUser($user),
            'message' => 'User updated successfully.',
        ]);
    }

    /**
     * Format a User model into the shape the frontend expects.
     * Same format as AuthController::formatUser.
     */
    private function formatUser(User $user): array
    {
        return [
            'id'            => 'USR-' . str_pad((string) $user->user_id, 3, '0', STR_PAD_LEFT),
            'roleId'        => $user->role_id_label,
            'firstName'     => $user->first_name,
            'lastName'      => $user->last_name,
            'name'          => $user->name,
            'email'         => $user->email,
            'contactNumber' => $user->contact_number ?? '',
            'status'        => $user->status,
            'role'          => $user->role,
            'hospitalId'    => $user->hospital_id ? 'HOSP-' . str_pad((string) $user->hospital_id, 3, '0', STR_PAD_LEFT) : null,
            'createdAt'     => $user->created_at?->toDateTimeString(),
            'updatedAt'     => $user->updated_at?->toDateTimeString(),
        ];
    }
}
