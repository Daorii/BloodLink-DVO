<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\AuditLogger;

class UserController extends Controller
{
    /**
     * GET /api/users
     *
     * List all system users.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeUserManager($request);
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
    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeUserManager($request);
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
        $this->authorizeUserManager($request);
        $validated = $request->validate([
            'firstName'     => ['required', 'string', 'max:50', "regex:/^[\\pL][\\pL .'-]*$/u"],
            'lastName'      => ['required', 'string', 'max:50', "regex:/^[\\pL][\\pL .'-]*$/u"],
            'email'         => 'required|email|max:100|unique:users,email',
            'password'      => 'required|string|min:6',
            'contactNumber' => ['required', 'string', 'regex:/^(?:\+63|63|0)9\d{9}$/'],
            'role'          => 'required|string',
            'status'        => 'nullable|string|in:Active,Inactive,Suspended,Locked',
            'hospitalId'    => 'nullable|string',
        ]);

        // Resolve role_id from the role name
        $role = Role::where('role_name', $validated['role'])->first();
        if (! $role) {
            return response()->json(['message' => 'Invalid role specified.'], 422);
        }
        $this->authorizeRoleManagement($request, $role->role_name);

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

        if ($role->role_name === 'Hospital User' && (! $hospitalId || ! Hospital::where('hospital_id', $hospitalId)->exists())) {
            return response()->json(['message' => 'A valid affiliated hospital is required for a Hospital User account.'], 422);
        }

        $user = User::create([
            'role_id'        => $role->role_id,
            'hospital_id'    => $hospitalId,
            'first_name'     => $validated['firstName'],
            'last_name'      => $validated['lastName'],
            'email'          => $validated['email'],
            'password'       => $validated['password'],
            'contact_number' => $validated['contactNumber'] ?? null,
            'status'         => $validated['status'] ?? 'Active',
        ]);

        $user->load('roleRelation');
        AuditLogger::record($request, 'Created user account', 'User Management', 'USR-' . str_pad((string) $user->user_id, 3, '0', STR_PAD_LEFT), null, ['role' => $user->role, 'email' => $user->email, 'status' => $user->status]);

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
        $this->authorizeUserManager($request);
        $user = User::findOrFail($id);
        $this->authorizeRoleManagement($request, $user->role);
        $oldValues = ['role' => $user->role, 'email' => $user->email, 'status' => $user->status];

        $validated = $request->validate([
            'firstName'     => ['sometimes', 'required', 'string', 'max:50', "regex:/^[\\pL][\\pL .'-]*$/u"],
            'lastName'      => ['sometimes', 'required', 'string', 'max:50', "regex:/^[\\pL][\\pL .'-]*$/u"],
            'email'         => 'sometimes|required|email|max:100|unique:users,email,' . $user->user_id . ',user_id',
            'contactNumber' => ['sometimes', 'required', 'string', 'regex:/^(?:\+63|63|0)9\d{9}$/'],
            'role'          => 'sometimes|required|string',
            'status'        => 'nullable|string|in:Active,Inactive,Suspended,Locked',
            'hospitalId'    => 'nullable|string',
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

        if (array_key_exists('hospitalId', $validated)) {
            $hospitalIdStr = $validated['hospitalId'];
            if (empty($hospitalIdStr)) {
                $updates['hospital_id'] = null;
            } else {
            $hospitalId = str_starts_with((string) $hospitalIdStr, 'HOSP-')
                ? (int) ltrim(str_replace('HOSP-', '', $hospitalIdStr), '0')
                : (is_numeric($hospitalIdStr) ? (int) $hospitalIdStr : null);
            if (! $hospitalId || ! Hospital::where('hospital_id', $hospitalId)->exists()) {
                return response()->json(['message' => 'Select a valid affiliated hospital.'], 422);
            }
            $updates['hospital_id'] = $hospitalId;
            }
        }

        // Resolve role_id if role name changed.
        $effectiveRole = $user->role;
        if (isset($validated['role'])) {
            $role = Role::where('role_name', $validated['role'])->first();
            if (! $role) {
                return response()->json(['message' => 'Invalid role specified.'], 422);
            }
            $this->authorizeRoleManagement($request, $role->role_name);
            $updates['role_id'] = $role->role_id;
            $effectiveRole = $role->role_name;
        }

        if ($effectiveRole === 'Hospital User' && empty($updates['hospital_id'] ?? $user->hospital_id)) {
            return response()->json(['message' => 'A valid affiliated hospital is required for a Hospital User account.'], 422);
        }

        $user->update($updates);
        if (isset($updates['status']) && $updates['status'] !== 'Active') {
            $user->tokens()->delete();
        }
        $user->load('roleRelation');
        AuditLogger::record($request, 'Updated user account', 'User Management', 'USR-' . str_pad((string) $user->user_id, 3, '0', STR_PAD_LEFT), $oldValues, ['role' => $user->role, 'email' => $user->email, 'status' => $user->status]);

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

    private function authorizeUserManager(Request $request): void
    {
        abort_unless(in_array($request->user()->role, ['Super Admin', 'Administrator'], true), 403, 'Administrator access is required.');
    }

    private function authorizeRoleManagement(Request $request, ?string $role): void
    {
        if ($request->user()->role === 'Super Admin') {
            return;
        }

        abort_unless(! in_array($role, ['Super Admin', 'Administrator'], true), 403, 'Only Super Administrators can manage Administrator or Super Admin accounts.');
    }
}
