<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Allowed origins for CORS.
     * Add production URL here when deploying.
     */
    private array $allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];

    /**
     * Handle an incoming request.
     *
     * Wraps the entire pipeline in a try-catch so that CORS headers
     * are added even when downstream middleware (e.g. Sanctum auth)
     * throws an exception — otherwise the browser silently blocks
     * the error response and the frontend never sees the real error.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');

        // Handle preflight OPTIONS requests immediately
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 204);
            return $this->addCorsHeaders($response, $origin);
        }

        // Process the request, catching exceptions so CORS headers
        // are still applied to error responses
        try {
            $response = $next($request);
        } catch (\Throwable $e) {
            $response = response()->json([
                'message' => $e->getMessage(),
            ], $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
                ? $e->getStatusCode()
                : 500
            );
        }

        return $this->addCorsHeaders($response, $origin);
    }

    /**
     * Add CORS headers to the response if the origin is allowed.
     */
    private function addCorsHeaders(Response $response, ?string $origin): Response
    {
        if ($origin && in_array($origin, $this->allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Max-Age', '86400');
        }

        return $response;
    }
}
