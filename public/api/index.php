<?php
/**
 * PHP Reverse Proxy for Growatt API
 *
 * Used on Mắt Bão shared Linux hosting where Apache mod_proxy is NOT available.
 * Apache routes all /api/* requests here via .htaccess RewriteRule.
 * This script then forwards them to the Node.js backend running on localhost.
 *
 * Backend port must match PORT env on the hosting server (baohanh: 3000).
 */

// ── Configuration ─────────────────────────────────────────────────────────────
// Must match PORT in server env on the hosting server
define('BACKEND_PORT', '3000');
define('BACKEND_BASE', 'http://127.0.0.1:' . BACKEND_PORT);
define('REQUEST_TIMEOUT', 30);
define('CONNECT_TIMEOUT', 5);

// ── Hop-by-hop headers that must NOT be forwarded ─────────────────────────────
$HOP_BY_HOP = [
    'host', 'connection', 'keep-alive', 'transfer-encoding',
    'te', 'trailers', 'upgrade', 'proxy-authorization', 'proxy-authenticate',
];

// ── Build target URL ──────────────────────────────────────────────────────────
// REQUEST_URI already contains /api/... so we forward it as-is.
// e.g. /api/auth/login → http://localhost:3001/api/auth/login
$request_uri = $_SERVER['REQUEST_URI'];
$target_url  = BACKEND_BASE . $request_uri;

// ── cURL request ──────────────────────────────────────────────────────────────
$ch     = curl_init($target_url);
$method = $_SERVER['REQUEST_METHOD'];

curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT        => REQUEST_TIMEOUT,
    CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT,
]);

// Forward request headers (skip hop-by-hop)
$forward_headers = [];
foreach (getallheaders() as $name => $value) {
    if (!in_array(strtolower($name), $HOP_BY_HOP)) {
        $forward_headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $forward_headers);

// Forward request body for write methods
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);

// ── Handle cURL error ─────────────────────────────────────────────────────────
if (curl_errno($ch)) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error'  => 'API backend unavailable',
        'detail' => curl_error($ch),
    ]);
    curl_close($ch);
    exit;
}

// ── Parse response ────────────────────────────────────────────────────────────
$header_size  = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$http_code    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$resp_headers = substr($response, 0, $header_size);
$body         = substr($response, $header_size);
curl_close($ch);

// ── Send response ─────────────────────────────────────────────────────────────
http_response_code($http_code);

foreach (explode("\r\n", $resp_headers) as $line) {
    if (strpos($line, ':') === false) continue;
    [$hname, $hval] = explode(':', $line, 2);
    if (!in_array(strtolower(trim($hname)), $HOP_BY_HOP)) {
        header(trim($hname) . ':' . $hval, false);
    }
}

echo $body;
