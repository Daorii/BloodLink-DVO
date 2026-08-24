<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/login
     *
     * Authenticate a user with email + password.
     * Returns the user object + a Sanctum API token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'Active') {
            throw ValidationException::withMessages([
                'email' => ['This account is currently inactive.'],
            ]);
        }

        // Revoke any existing tokens (single-session login)
        $user->tokens()->delete();

        // Create a new token
        $token = $user->createToken('bloodlink-session')->plainTextToken;

        // Load the role relationship for the response
        $user->load('roleRelation');

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * POST /api/logout
     *
     * Revoke the current user's token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/me
     *
     * Return the currently authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('roleRelation');

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Format a User model into the shape the frontend expects.
     *
     * Frontend expects:
     * {
     *   id: "USR-001",
     *   roleId: "ROLE-001",
     *   firstName: "DOH",
     *   lastName: "Super Admin",
     *   name: "DOH Super Admin",
     *   email: "superadmin@bloodlink.dvo",
     *   contactNumber: "+63 917 123 4567",
     *   status: "Active",
     *   role: "Super Admin",
     *   hospitalId: "HOSP-001" | null,
     *   createdAt: "...",
     *   updatedAt: "..."
     * }
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
