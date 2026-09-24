<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function record(Request $request, string $action, string $module, ?string $recordId = null, ?array $oldValues = null, ?array $newValues = null, ?User $actor = null): void
    {
        AuditLog::create([
            'user_id' => ($actor ?? $request->user())?->user_id,
            'action' => $action,
            'module' => $module,
            'record_id' => $recordId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 65535),
        ]);
    }
}
