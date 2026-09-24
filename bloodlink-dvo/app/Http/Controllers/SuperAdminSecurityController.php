<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminSecurityController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        return response()->json(['overview' => [
            'activeAccounts' => User::where('status', 'Active')->count(),
            'restrictedAccounts' => User::where('status', '!=', 'Active')->count(),
            'activeSessions' => DB::table('personal_access_tokens')->count(),
            'eventsToday' => AuditLog::whereDate('created_at', today())->count(),
        ]]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $validated = $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'module' => 'nullable|string|max:80',
            'search' => 'nullable|string|max:100',
        ]);

        $logs = AuditLog::with('user')->when($validated['module'] ?? null, fn ($query, $module) => $query->where('module', $module))
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('action', 'like', "%{$search}%")
                        ->orWhere('module', 'like', "%{$search}%")
                        ->orWhere('record_id', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%");
                });
            })->latest('audit_log_id')->limit($validated['per_page'] ?? 100)->get();

        return response()->json(['logs' => $logs->map(fn (AuditLog $log) => [
            'id' => 'LOG-' . str_pad((string) $log->audit_log_id, 5, '0', STR_PAD_LEFT),
            'actorName' => $log->user?->name,
            'action' => $log->action,
            'module' => $log->module,
            'recordId' => $log->record_id,
            'ipAddress' => $log->ip_address,
            'performedAt' => $log->created_at?->format('M j, Y g:i A'),
        ])]);
    }

    public function revokeSessions(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $target = User::findOrFail($id);
        if ($target->is($request->user())) {
            return response()->json(['message' => 'You cannot revoke your own session from this control.'], 422);
        }
        $count = $target->tokens()->delete();
        AuditLogger::record($request, 'Revoked active sessions', 'Account Security', 'USR-' . str_pad((string) $target->user_id, 3, '0', STR_PAD_LEFT), null, ['revoked_sessions' => $count]);

        return response()->json(['message' => 'Active sessions revoked.', 'revokedSessions' => $count]);
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'Super Admin', 403, 'Super Administrator access is required.');
    }
}
